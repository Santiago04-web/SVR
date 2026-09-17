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
  // Normalize string and handle common typos / Colombian slang
  const clean = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const card = creditCards[0] || {
    name: 'Bancolombia Visa Clásica',
    totalLimit: 2400000,
    lastFourDigits: '9102',
    cutoffDay: 30,
    paymentDueDay: 15,
    monthlyFee: 20900,
  };

  const pendingObligationsThisMonth = obligations
    .filter((o) => !o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);

  // 1. TARJETA DE CRÉDITO & CUPO / MÁXIMO PARA GASTAR CON TARJETA
  const isCardQuery =
    (clean.includes('tarjeta') || clean.includes('credito') || clean.includes('crdito') || clean.includes('visa') || clean.includes('tc') || clean.includes('cupo')) &&
    !clean.includes('addi');

  if (isCardQuery) {
    if (
      clean.includes('maximo') ||
      clean.includes('cuanto puedo') ||
      clean.includes('limite') ||
      clean.includes('gastar') ||
      clean.includes('comprar') ||
      clean.includes('capacidad')
    ) {
      return `💳 **Análisis de Capacidad con tu Tarjeta de Crédito (${card.name}):**

• **Cupo total bancario:** ${formatCOP(card.totalLimit)} (Disponible al 100%).
• **Tope prudente recomendado (Sin ahogarte):** Máximo **$450.000** diferido a 3 o 4 cuotas.
• **¿Por qué este tope?:** Tu sueldo neto quincenal es de $680.000 ($1.360.000/mes). Con tus obligaciones fijas actuales (~${formatCOP(pendingObligationsThisMonth)} en Universidad, Mercado y Moto), una cuota de tarjeta superior a **$150.000/mes** te dejaría sin margen libre para imprevistos.

💡 **Estrategia SVR:**
1. Si compras algo menor a **$100.000** (mecatos, ropa rápida, gasolina): Paga a **1 cuota** (0% intereses) y págalo todo el día 15.
2. Si compras algo grande (**Perfume, Gafas, etc.**): Diferir a 3 cuotas máximo para que la cuota quede en ~$100k-$150k/mes.`;
    }

    return `💳 **Estado de tu Tarjeta de Crédito:**
• **Tarjeta:** ${card.name} (..${card.lastFourDigits || '9102'})
• **Cupo disponible:** ${formatCOP(card.totalLimit)}
• **Fecha de Corte:** Día ${card.cutoffDay} de cada mes
• **Fecha Límite de Pago:** Día ${card.paymentDueDay} del mes siguiente
• **Cuota de Manejo:** ${formatCOP(card.monthlyFee || 20900)}/mes`;
  }

  // 2. ADDI / CRÉDITO ADDI ESPECÍFICO
  if (clean.includes('addi')) {
    const addiDebt = debts.find((d) => d.name.toLowerCase().includes('addi'));
    const totalPending = addiDebt ? addiDebt.pendingAmount : 140553;

    if (clean.includes('adelantad') || clean.includes('pagar') || clean.includes('prepago') || clean.includes('abono')) {
      return `⚡ **Estrategia sobre Deuda Addi (${formatCOP(totalPending)}):**
• **Costo financiero:** 0% de interés (Crédito a 3 cuotas de ~$46.851/mes).
• **Vencimiento 1ª cuota:** 4 de Noviembre de 2026.
• **Recomendación:** **NO es necesario prepagarlo hoy.** Conserva tu liquidez actual (${formatCOP(summary.saldoDisponible)}) para tus pagos de septiembre (Universidad $350k, Mercado $250k). Pagar Addi por adelantado no te ahorra intereses y te descapitaliza antes de quincena.`;
    }

    return `⚡ **Crédito Addi:** Tienes una deuda activa de **${formatCOP(totalPending)}** en 3 cuotas (~$46.851/mes). La 1ª cuota vence el **4 de Noviembre de 2026**.`;
  }

  // 3. MOTO, PULSAR, SOAT, TECNOMECÁNICA, CASCO
  if (
    clean.includes('moto') ||
    clean.includes('soat') ||
    clean.includes('tecno') ||
    clean.includes('pulsar') ||
    clean.includes('casco') ||
    clean.includes('aceite')
  ) {
    const cascoDebt = debts.find((d) => d.name.toLowerCase().includes('casco'));
    return `🏍️ **Módulo Moto Pulsar 135 LS (2019):**
• **SOAT:** Vence el **10 de Octubre** (${formatCOP(343300)} tarifa diferencial).
• **Tecnomecánica:** Vence el **20 de Noviembre** (${formatCOP(235400)}).
• **Casco Shaft:** ${cascoDebt ? formatCOP(cascoDebt.pendingAmount) : '$379.000'} pendiente (1ª cuota en NOV).
• **Nómina:** La cuota de moto ($100k) y licencia ($150k) ya vienen descontadas de tu nómina neta de $680.000 quincenales.`;
  }

  // 4. UBER / DIDI / INGRESOS EXTRA
  if (clean.includes('uber') || clean.includes('didi') || clean.includes('jornada') || clean.includes('extra')) {
    return `🚗 **Uber / Ingresos Extra:**
• **Meta estándar:** $50.000 netos por jornada (4 días/sem = ~$200.000/semana).
• **Registro por voz/texto:** Solo escribe: *"gané 70k en uber y gasté 15k de gasolina"* y lo registraré automáticamente en tu bolsillo de Efectivo.`;
  }

  // 5. SALDO / CUÁNTO ME QUEDA / LÍMITE DIARIO / LIQUIDEZ
  if (
    clean.includes('saldo') ||
    clean.includes('libre') ||
    clean.includes('cuanto me queda') ||
    clean.includes('cuanto tengo') ||
    clean.includes('plata') ||
    clean.includes('efectivo') ||
    clean.includes('bancolombia') ||
    clean.includes('nequi') ||
    clean.includes('nu')
  ) {
    return `💰 **Resumen de Liquidez Real (SVR Finanzas):**
• **Saldo Total en Cuentas:** ${formatCOP(summary.saldoDisponible)}
• **Dinero Apartado / Reservas:** ${formatCOP(summary.dineroApartado)}
• **Realmente Libre Hoy:** ${formatCOP(summary.realmenteLibre)}
• **Tope Diario para Mecatos:** ${formatCOP(summary.puedesGastarHoy)}/día (para proteger tus pagos fijos).`;
  }

  // 6. UNIVERSIDAD
  if (clean.includes('universidad') || clean.includes('estudio') || clean.includes('semestre')) {
    return `🎓 **Universidad:**
• Cuota mensual: **$350.000**.
• Vencimientos programados: 30 Sep, 10 Oct, 10 Nov y 10 Dic (Última cuota del semestre).`;
  }

  // 7. COMPRAS PLANEADAS / CONSEJO DE COMPRA GENERAL
  if (clean.includes('comprar') || clean.includes('teclado') || clean.includes('gafas') || clean.includes('perfume') || clean.includes('jean')) {
    return `🛍️ **Evaluación de Compras Planeadas:**
• **Prioridad 1 (Necesidad Médica):** 👓 Gafas formuladas ($500.000). Se recomienda pagarlas con nómina + ahorro.
• **Prioridad 4 (Deseos Personales):** Teclado ($200k), Perfume ($300k-$450k), Jeans ($150k c/u).
• **Consejo:** Puedes ir al **Centro de Decisiones** en el menú para simular en tiempo real cómo afectaría cada compra a tu cupo diario.`;
  }

  // 8. CIERRE DE MES / QUINCENA / NÓMINA
  if (clean.includes('quincena') || clean.includes('nomina') || clean.includes('cierre') || clean.includes('sueldo')) {
    return `🗓️ **Flujo Quincenal:**
• Tu nómina neta es de **$680.000** los días 15 y 30 de cada mes ($1.360.000/mes).
• Próximos compromisos fuertes del 30 Sep: Universidad ($350k), Mercado ($250k) y Almuerzos ($200k).`;
  }

  // 9. SALUDO / INSTRUCCIONES
  if (clean.includes('hola') || clean.includes('ayuda') || clean.includes('que puedes hacer') || clean.includes('comandos')) {
    return `🤖 **¡Hola! Soy tu Asistente Financiero Antigravity.**

Puedes consultarme cosas como:
• *"¿Cuánto es lo máximo que puedo gastar con la tarjeta de crédito?"*
• *"¿Me conviene pagar Addi por adelantado?"*
• *"¿Cuánto me queda libre hoy?"*
• O darme órdenes directas como: *"gané 60k en uber"* o *"pagué 20k de gasolina"*.`;
  }

  // 10. Fallback contextual e inteligente
  return `💡 **Asistente SVR:** Cuentas con **${formatCOP(
    summary.realmenteLibre
  )}** libres en tus cuentas. Puedes preguntarme sobre tu tarjeta de crédito, Addi, tu moto Pulsar, o dictarme gastos e ingresos en lenguaje natural.`;
}
