import { Obligation, CreditCard, Debt, Category, PaymentMethod } from '../types/finance';
import { formatCOP } from '../utils/formatters';

export interface ParsedAiAction {
  type: 'PAY_OBLIGATION' | 'ADD_EXPENSE' | 'ADD_INCOME' | 'RESERVE_MONEY' | 'UNKNOWN';
  description: string;
  amount: number;
  targetEntity?: string;
  obligationId?: string;
  category?: Category;
  paymentMethod?: PaymentMethod;
  feedbackText: string;
}

export function parseColombianAmount(text: string): number | null {
  const clean = text.toLowerCase();

  // Check for "50 mil", "50k", "1.5 mil"
  const milMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/);
  if (milMatch) {
    const num = parseFloat(milMatch[1].replace(',', '.'));
    return Math.round(num * 1000);
  }

  // Check for formatted amounts like $140.553, 50.000, 50000
  const numberMatch = clean.match(/(?:\$)?\s*(\d{1,3}(?:\.\d{3})+|\d{4,})/);
  if (numberMatch) {
    const numStr = numberMatch[1].replace(/\./g, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Check for small direct numbers like "gasté 15000"
  const smallMatch = clean.match(/(?:\$)?\s*(\d+)/);
  if (smallMatch) {
    const num = parseInt(smallMatch[1], 10);
    if (!isNaN(num) && num >= 1000) return num;
  }

  return null;
}

export function parseAiNaturalCommand(
  input: string,
  obligations: Obligation[]
): ParsedAiAction | null {
  const qLower = input.toLowerCase().trim();
  const amount = parseColombianAmount(qLower);

  if (!amount) return null;

  // 1. ABONAR / PAGAR OBLIGACIÓN (e.g., "abone 50 mil de addi", "pague addi 140.553")
  if (
    qLower.includes('abon') ||
    qLower.includes('pagu') ||
    qLower.includes('pagad') ||
    qLower.includes('cancel')
  ) {
    // Check if obligation mentioned
    const matchedObl = obligations.find(
      (o) =>
        qLower.includes(o.title.toLowerCase()) ||
        (o.title.toLowerCase().includes('addi') && qLower.includes('addi')) ||
        (o.title.toLowerCase().includes('universidad') && qLower.includes('universidad')) ||
        (o.title.toLowerCase().includes('gym') && qLower.includes('gym')) ||
        (o.title.toLowerCase().includes('movistar') && qLower.includes('movistar')) ||
        (o.title.toLowerCase().includes('elena') && qLower.includes('elena'))
    );

    if (matchedObl || qLower.includes('addi')) {
      const oblName = matchedObl ? matchedObl.title : 'Addi';
      const isFull = matchedObl ? amount >= matchedObl.amount : amount >= 140553;

      return {
        type: 'PAY_OBLIGATION',
        description: `Abono a ${oblName}`,
        amount,
        targetEntity: oblName,
        obligationId: matchedObl?.id,
        category: 'Servicios',
        paymentMethod: 'debito',
        feedbackText: isFull
          ? `⚡ ¡Acción realizada! Marqué como pagada totalmente la obligación de **${oblName}** por ${formatCOP(
              amount
            )}.`
          : `⚡ ¡Acción realizada! Registré un abono de **${formatCOP(
              amount
            )}** a **${oblName}** y desconté el valor de tu saldo disponible.`,
      };
    }

    // Generic Expense (e.g. "pagué 15k de gasolina")
    if (qLower.includes('gasolina') || qLower.includes('tanque')) {
      return {
        type: 'ADD_EXPENSE',
        description: 'Gasolina Moto',
        amount,
        category: 'Moto',
        paymentMethod: 'debito',
        feedbackText: `⛽ ¡Acción realizada! Registré un gasto de **${formatCOP(amount)}** en Gasolina.`,
      };
    }

    if (qLower.includes('almuerzo') || qLower.includes('comida')) {
      return {
        type: 'ADD_EXPENSE',
        description: 'Almuerzo / Comida',
        amount,
        category: 'Comida',
        paymentMethod: 'debito',
        feedbackText: `🍽️ ¡Acción realizada! Registré un gasto de **${formatCOP(amount)}** en Comida.`,
      };
    }

    return {
      type: 'ADD_EXPENSE',
      description: 'Gasto registrado vía IA',
      amount,
      category: 'Otros',
      paymentMethod: 'debito',
      feedbackText: `💸 ¡Acción realizada! Registré un gasto de **${formatCOP(amount)}**.`,
    };
  }

  // 2. GANANCIA / INGRESO (e.g. "gané 80 mil en uber", "+70k uber")
  if (
    qLower.includes('gan') ||
    qLower.includes('ingres') ||
    qLower.includes('uber') ||
    qLower.includes('hice')
  ) {
    const isUber = qLower.includes('uber');
    return {
      type: 'ADD_INCOME',
      description: isUber ? 'Uber Jornada (vía IA)' : 'Ingreso registrado vía IA',
      amount,
      category: 'Transporte',
      paymentMethod: 'efectivo',
      feedbackText: `🚗 ¡Acción realizada! Registré un ingreso de **+${formatCOP(
        amount
      )}** ${isUber ? 'de Uber' : ''} a tu saldo disponible.`,
    };
  }

  // 3. APARTAR DINERO (e.g. "aparte 80 mil", "separar 50k")
  if (qLower.includes('apart') || qLower.includes('separ') || qLower.includes('reserv')) {
    return {
      type: 'RESERVE_MONEY',
      description: 'Dinero Apartado',
      amount,
      feedbackText: `🔒 ¡Acción realizada! He actualizado tu dinero apartado a **${formatCOP(amount)}**.`,
    };
  }

  return null;
}

export function generateIntelligentAiReply(
  query: string,
  summary: {
    saldoDisponible: number;
    dineroApartado: number;
    realmenteLibre: number;
    puedesGastarHoy: number;
  },
  obligations: Obligation[],
  creditCards: CreditCard[],
  debts: Debt[]
): string {
  const qLower = query.toLowerCase().trim();

  // Addi / Créditos
  if (qLower.includes('addi') || qLower.includes('credito') || qLower.includes('deuda')) {
    const addiDebt = debts.find((d) => d.name.toLowerCase().includes('addi'));
    const totalPending = addiDebt ? addiDebt.pendingAmount : 140553;
    return `⚡ **Crédito Addi:** Tienes una deuda de **${formatCOP(
      totalPending
    )}** en 3 cuotas (~$46.851/mes). La 1ª cuota vence el **4 de Noviembre de 2026**. Tu saldo libre actual es **${formatCOP(
      summary.realmenteLibre
    )}**. Si decides pagar anticipado, liberarás $46.851/mes de tu presupuesto futuro.`;
  }

  // Moto / Pulsar / SOAT / Tecno
  if (
    qLower.includes('moto') ||
    qLower.includes('soat') ||
    qLower.includes('tecno') ||
    qLower.includes('pulsar') ||
    qLower.includes('casco')
  ) {
    const cascoDebt = debts.find((d) => d.name.toLowerCase().includes('casco'));
    return `🏍️ **Estado Moto Pulsar 135 LS (2019):**\n• **SOAT:** Vence el 10 OCT 2026 (valor pendiente de confirmación).\n• **Tecnomecánica:** Vence el 20 NOV 2026.\n• **Casco Shaft:** ${
      cascoDebt ? formatCOP(cascoDebt.pendingAmount) : '$379.000'
    } pendiente (1ª cuota en NOV).\n• **Descuentos de nómina:** La moto ($100k/quincena) y licencia ($150k/quincena) ya te los descuentan directamente antes de recibir tu pago neto de $680.000.`;
  }

  // Saldo / Cuánto puedo gastar / Bancolombia
  if (
    qLower.includes('saldo') ||
    qLower.includes('libre') ||
    qLower.includes('cuanto me queda') ||
    qLower.includes('puedo gastar') ||
    qLower.includes('bancolombia')
  ) {
    return `💰 **Resumen de Liquidez Real:**\n• **Saldo en Bancolombia:** ${formatCOP(
      summary.saldoDisponible
    )}\n• **Dinero Apartado:** ${formatCOP(summary.dineroApartado)}\n• **Realmente Libre:** ${formatCOP(
      summary.realmenteLibre
    )}\n• **Límite diario recomendado:** ${formatCOP(
      summary.puedesGastarHoy
    )}/día hasta tu próxima quincena.`;
  }

  // Uber
  if (qLower.includes('uber') || qLower.includes('ganancia') || qLower.includes('jornada')) {
    return `🚗 **Uber e Ingresos Extra:** Tu promedio estimado es de **$50.000 netos/jornada** (4 días/semana = ~$200.000/semana). Puedes dictarme tus jornadas directamente diciendo: *"gané 70k en uber y gasté 15k de gasolina"* y lo registraré automáticamente.`;
  }

  // Universidad
  if (qLower.includes('universidad') || qLower.includes('u') || qLower.includes('estudio')) {
    return `🎓 **Universidad:** La cuota mensual es de **$350.000** con vencimiento el día 30 de cada mes. No afecta tu saldo actual de $507.000 hasta que la pagues o apartes el dinero.`;
  }

  // Tarjeta de crédito
  if (qLower.includes('tarjeta') || qLower.includes('visa') || qLower.includes('cuota de manejo')) {
    const card = creditCards[0];
    return `💳 **Bancolombia Visa Clásica:**\n• Cupo total: ${formatCOP(
      card?.totalLimit || 2400000
    )}\n• Deuda actual: $0 (Sin compras a crédito pendientes)\n• Corte: Día 30 | Vencimiento: Día 15\n• Cuota de manejo: $20.900/mes (vence el 30 Sep).`;
  }

  // Septiembre / Cierre de mes / Quincena
  if (
    qLower.includes('septiembre') ||
    qLower.includes('cierre') ||
    qLower.includes('quincena') ||
    qLower.includes('nomina')
  ) {
    return `🗓️ **Cierre de Septiembre:**\n• Recibes **$680.000** netos el 30 Sep.\n• Obligaciones pendientes de fin de mes: Almuerzos ($200k), Mercado grande ($250k), Movistar ($35k), Universidad ($350k) y Cuota de manejo ($20.900).\n• Con tu nómina y jornadas de Uber mantienes un margen positivo holgado.`;
  }

  // Saludo / Ayuda
  if (qLower.includes('hola') || qLower.includes('quien eres') || qLower.includes('ayuda')) {
    return `🤖 **¡Hola! Soy tu Asistente Financiero Antigravity (Local y 100% Privado).**\n\nPuedo responder cualquier duda de tu presupuesto o **ejecutar órdenes directas**, por ejemplo:\n• *"abone 50 mil de addi"*\n• *"gané 80k en uber"*\n• *"pagué 15k de gasolina"*\n• *"¿cuánto dinero tengo libre hoy?"*`;
  }

  // Generic Intelligent Fallback
  return `💡 **Análisis Financiero Antigravity:** Actualmente cuentas con **${formatCOP(
    summary.realmenteLibre
  )}** realmente libres (${formatCOP(
    summary.puedesGastarHoy
  )}/día). Si quieres registrar un gasto o abono, solo dime por ejemplo: *"abone 50 mil a addi"* o *"pagué 15k de gasolina"*.`;
}
