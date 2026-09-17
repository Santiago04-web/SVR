import { formatCOP } from '../utils/formatters';
import type { FinancialSummary, Obligation, CreditCard, Debt, BankAccount, Transaction } from '../types/finance';

const GEMINI_STORAGE_KEY = 'svr_finanzas_gemini_api_key';

export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (stored) return stored.trim();
  }
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
}

export function saveGeminiApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  }
}

export interface GeminiFinancialContext {
  summary: FinancialSummary;
  accounts: BankAccount[];
  obligations: Obligation[];
  creditCards: CreditCard[];
  debts: Debt[];
  transactions: Transaction[];
}

export interface GeminiResponse {
  replyText: string;
  providerUsed?: 'gemini' | 'openai';
  action?: {
    type: 'ADD_TRANSACTION' | 'PAY_OBLIGATION' | 'SET_RESERVE';
    data: any;
    feedbackText: string;
  };
}

export async function askGeminiFinancialAdvisor(
  userQuery: string,
  context: GeminiFinancialContext,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const { summary, accounts, obligations, creditCards, debts } = context;

  // Build real-time financial context string
  const accountsInfo = accounts
    .map((a) => `- ${a.name} (${a.type}): ${formatCOP(a.balance)}`)
    .join('\n');

  const pendingObligations = obligations
    .filter((o) => !o.isPaid)
    .map((o) => `- ${o.title}: ${formatCOP(o.amount)} (Vence: ${o.dueDate})`)
    .join('\n');

  const cardsInfo = creditCards
    .map((c) => `- ${c.name}: Cupo total ${formatCOP(c.totalLimit)}, corte día ${c.cutoffDay}, pago día ${c.paymentDueDay}, cuota manejo ${formatCOP(c.monthlyFee || 0)}`)
    .join('\n');

  const debtsInfo = debts
    .map((d) => `- ${d.name}: Total ${formatCOP(d.totalCost)}, Pendiente ${formatCOP(d.pendingAmount)} (${d.statusText})`)
    .join('\n');

  const systemPrompt = `Eres SVR AI, un asesor financiero personal colombiano de élite, analítico, directo y amigable (hablas en español colombiano natural con tono inteligente, usando números hiper precisos en COP).

ESTADO FINANCIERO REAL DEL USUARIO HOY:
1. Cuentas y Bolsillos (Total Disponible: ${formatCOP(summary.saldoDisponible)}):
${accountsInfo}

2. Ingresos:
- Nómina fija neta actual: $680.000 quincenales ($1.360.000/mes) los días 15 y 30.
- Ingresos extra Uber/Didi: Promedio $50.000 netos por jornada.

3. DISTINCIÓN CLAVE EN SUS GASTOS:
A) GASTOS DE VIDA / OPERATIVOS RECURRENTES (Vivir el día a día):
- Almuerzos quincenales ($200.000/quincena).
- Mercado ($250.000/mes).
- Gasolina moto y mantenimiento.
- Universidad ($350.000/mes hasta culminar carrera).

B) DEUDAS TEMPORALES CON FECHA DE FIN (Al pagarlas se libera un gran flujo de caja):
- Descuento de Licencia: $150.000/quincena ($300.000/mes). Cuando se termine de pagar, tu nómina neta subirá a $830k quincenales.
- Descuento de Moto: $100.000/quincena ($200.000/mes). Cuando se termine, sumado a la licencia, tu nómina neta libre será de $930.000 quincenales ($1.860.000/mes libres).
- Addi: Total $140.553 en 3 cuotas (~$46.851/mes).
- Casco Shaft: $379.000 (1ª cuota en Noviembre).
- Trámites Moto obligatorios anuales: SOAT $343.300 (10 Octubre) y Tecnomecánica $235.400 (20 Noviembre).

4. Obligaciones Pendientes (${formatCOP(obligations.filter(o => !o.isPaid).reduce((s,o)=>s+o.amount,0))}):
${pendingObligations}

5. Tarjetas de Crédito:
${cardsInfo}

6. Deudas Activas:
${debtsInfo}

REGLAS DE RESPUESTA:
- Responde de forma limpia, directa y conversacional como un asesor humano colombiano experto.
- Comprende la diferencia entre los gastos de vida indispensables y las deudas que se van a terminar de pagar y te van a dejar mucho más desahogado.
- IMPORTANTE: NO abuses de los asteriscos ni del markdown. Evita poner ** en cada palabra o frase. Usa texto plano limpio y fluido.
- Usa SIEMPRE los números y saldos reales de arriba para tus cálculos.
- Si el usuario te pide registrar un movimiento (ej: "me tomé un café de 5k en efectivo", "gané 80 mil en uber", "pagué 15k de gasolina"), genera la respuesta explicativa y al final un bloque JSON con la acción estructurada para que la app lo ejecute automáticamente:

\`\`\`json
{
  "action": "ADD_TRANSACTION",
  "data": {
    "description": "Café / Mecato",
    "amount": 5000,
    "type": "gasto",
    "category": "Comida",
    "paymentMethod": "efectivo",
    "accountId": "efectivo"
  },
  "feedbackText": "Gasto de $5.000 registrado en Efectivo"
}
\`\`\`

- Métodos de pago válidos: 'efectivo', 'debito', 'transferencia', 'tarjeta_credito', 'addi'.
- Categorías válidas: 'Comida', 'Transporte', 'Personal', 'Moto', 'Servicios', 'Tarjeta', 'Universidad', 'Gym', 'Ahorro', 'Otros'.
- Cuentas válidas: 'bancolombia', 'efectivo', 'nequi', 'nu'.
- Si solo son preguntas de asesoría o análisis, responde de forma concisa y NO incluyas bloque JSON.`;

  let rawReply = '';
  let providerUsed: 'gemini' | 'openai' = 'gemini';

  // 1. OPENAI (ChatGPT) API Key handler (if starts with sk-)
  if (apiKey.startsWith('sk-')) {
    providerUsed = 'openai';
    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((h) => ({
        role: h.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: h.parts?.[0]?.text || '',
      })),
      { role: 'user', content: userQuery },
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAiMessages,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error OpenAI HTTP ${res.status}`);
    }

    const data = await res.json();
    rawReply = data?.choices?.[0]?.message?.content || 'No obtuve respuesta de ChatGPT.';
  } else {
    // 2. GOOGLE GEMINI Handler with Multi-Model Fallback
    providerUsed = 'gemini';
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Tengo cargado todo tu contexto financiero de SVR Finanzas. Dime, ¿en qué te asesoro o qué movimiento registramos hoy?' }],
      },
      ...chatHistory,
      {
        role: 'user',
        parts: [{ text: userQuery }],
      },
    ];

    const candidateModels = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent',
    ];

    let lastErrorMsg = '';
    let successData: any = null;

    for (const baseUrl of candidateModels) {
      try {
        const endpoint = `${baseUrl}?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
            },
          }),
        });

        if (res.ok) {
          successData = await res.json();
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastErrorMsg = errData?.error?.message || `HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Error de red';
      }
    }

    if (!successData) {
      throw new Error(lastErrorMsg || 'No se pudo conectar a los modelos de Gemini.');
    }

    rawReply = successData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No obtuve respuesta de Gemini.';
  }

  // Check if response contains an action JSON block
  let replyText = rawReply;
  let action: GeminiResponse['action'] = undefined;

  const jsonMatch = rawReply.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const parsedAction = JSON.parse(jsonMatch[1]);
      if (parsedAction.action) {
        action = {
          type: parsedAction.action,
          data: parsedAction.data,
          feedbackText: parsedAction.feedbackText || 'Acción completada con IA',
        };
        replyText = rawReply.replace(/```json[\s\S]*?```/, '').trim();
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  return { replyText, action, providerUsed };
}

