import { formatCOP } from '../utils/formatters';
import { getTodayISO } from '../utils/dates';
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

  const systemPrompt = `Eres SVR AI, el asesor financiero personal y copiloto de vida de Santiago en Colombia. Eres inteligente, empático, sensato y conversacional (hablas en español colombiano natural, sin rodeos y sin exageraciones).

FECHA Y CONTEXTO REAL DE HOY:
- Fecha de hoy: ${getTodayISO()} (18 de Septiembre de 2026).
- Próxima quincena (Nómina fija Logigho): 30 de Septiembre ($680.000 netos).
- Saldo líquido real disponible HOY: ${formatCOP(summary.saldoDisponible)} (entre Bancolombia, Efectivo, Nequi, etc.).

ESTADO REAL DE CUENTAS:
${accountsInfo}

INGRESOS:
- Nómina fija neta: $680.000 quincenales ($1.360.000/mes) los días 15 y 30.
- Ingresos extra Uber/Didi: Promedio $50.000 netos por jornada.

OBLIGACIONES Y DEUDAS CLAVE:
1. 🎓 Universidad: En Septiembre NO DEBE NADA (la cuota de $350k de Septiembre ya se pagó el 10 de Sep). La próxima cuota es el 10 de Octubre.
2. 🏍️ Moto Pulsar ($2.000.000 total): $100.000 quincenales (9 pagadas, 11 pendientes).
3. 🪪 Licencia ($1.450.000 total): $150.000 quincenales (1 pagada, saldo $1.3M).
4. 🪖 Casco Shaft ($505.000): $126k abonados, saldo $379k (cuotas los 22 de cada mes, inicia 22 Oct).
5. ⚡ Addi ($140.553): 3 cuotas a 0% interés, inicia 4 Noviembre.
6. Gastos de vida pendientes hasta el 30 Sep: Almuerzos quincenales ($200k), Mercado ($250k), Gasolina moto ($50k), Celular ($35k), Cuota manejo ($20.9k).

REGLAS DE TONO Y PERSONALIDAD:
- Sé sensato y realista, NUNCA exagerado ni alarmista: Si Santiago tiene más de $400.000 disponibles y pregunta si puede comprar un desayuno de $10.000 o algo de comer, ¡OBVIAMENTE SÍ PUEDE! La alimentación y la salud van primero. No le digas que está en números rojos ni le prohíbas comer.
- Si Santiago tiene dolor de cabeza o malestar, apóyalo como un buen parcero y asesor: recomiéndale opciones suaves y sanas sin complicarle la vida.
- NO repitas como un robot al final de cada mensaje "dime cuánto costó para registrarlo" a menos que sea pertinente.
- NO abuses de los asteriscos **. Escribe con texto limpio y fluido.

REGISTRO AUTOMÁTICO DE TRANSACCIONES (MUY IMPORTANTE):
Cuando el usuario mencione que compró algo, gastó dinero o recibió ingresos (ej: "me compré dos panes de bono y un jugo hit por 10 mil en efectivo", "pagué 40k de gasolina en bancolombia", "gané 80 mil en uber"):
1. Confirma amablemente la compra.
2. Genera OBLIGATORIAMENTE al final de tu respuesta el bloque JSON para que la app lo registre automáticamente en el sistema:

\`\`\`json
{
  "action": "ADD_TRANSACTION",
  "data": {
    "description": "Pandebonos y Jugo Hit",
    "amount": 10000,
    "type": "gasto",
    "category": "Comida",
    "paymentMethod": "efectivo",
    "accountId": "efectivo"
  },
  "feedbackText": "Gasto de $10.000 registrado en Efectivo"
}
\`\`\`

- Métodos de pago: 'efectivo', 'debito', 'nequi', 'tarjeta_credito'.
- Categorías: 'Comida', 'Transporte', 'Personal', 'Moto', 'Servicios', 'Tarjeta', 'Universidad', 'Gym', 'Otros'.`;

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

