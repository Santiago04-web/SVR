import {
  PlannedPurchase,
  PurchaseRecommendation,
  FinancialSummary,
  Obligation,
  CreditCard,
  Debt,
  BankAccount,
} from '../types/finance';
import { formatCOP } from '../utils/formatters';
import { getFormattedTodayLong, getTodayISO, getRemainingDaysInMonth } from '../utils/dates';

/**
 * Motor de Análisis de Compras v2
 * 
 * Lógica real basada en:
 * 1. Saldo líquido TOTAL (todas las cuentas)
 * 2. Obligaciones pendientes del mes actual (sí o sí hay que pagarlas)
 * 3. Nómina quincenal esperada ($680k neto el 30 de cada mes y 15 de cada mes)
 * 4. Cupo disponible en tarjeta de crédito
 * 5. Deudas actuales (Addi, Casco)
 * 6. Margen diario para mecatos después de la compra
 */

const NOMINA_QUINCENAL = 680000;
const MIN_DAILY_MARGIN = 5000;
const MIN_SAFE_BALANCE = 100000;

export function analyzePlannedPurchase(
  purchase: PlannedPurchase,
  summary: FinancialSummary,
  obligations: Obligation[],
  creditCards: CreditCard[],
  debts: Debt[],
  accounts?: BankAccount[]
): PurchaseRecommendation {
  // Precio pendiente
  if (purchase.isPendingPrice || purchase.estimatedCost <= 0) {
    return {
      purchaseId: purchase.id,
      decision: 'AHORRAR_PRIMERO',
      decisionBadge: '⌛ INGRESAR PRECIO',
      decisionColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      impactSummary: 'Precio pendiente. Ingresa el valor para recibir recomendación.',
      explanation:
        'Tan pronto ingreses el costo exacto, la IA calculará si es mejor pagar a débito, crédito en cuotas, o esperar a la nómina.',
      suggestedDateText: '📅 Ingresa el precio para calcular fecha óptima',
      creditVsDebitAdvice:
        '💡 Ingresa el precio y la IA te dirá la mejor opción.',
      saldoAfterPurchase: summary.realmenteLibre,
      marginPerDayAfter: summary.puedesGastarHoy,
      riskLevel: 'bajo',
    };
  }

  const cost = purchase.estimatedCost;
  const todayISO = getTodayISO();
  const currentMonth = todayISO.substring(0, 7);
  const daysLeft = Math.max(1, getRemainingDaysInMonth());

  // Liquidez real (todas las cuentas)
  const totalLiquido = accounts && accounts.length > 0
    ? accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    : summary.saldoDisponible;

  // Obligaciones pendientes ESTE MES
  const obligacionesMesPendientes = obligations
    .filter((o) => !o.isPaid && o.dueDate.startsWith(currentMonth) && o.amount > 0)
    .reduce((sum, o) => sum + o.amount, 0);

  // Saldo si paga a débito HOY
  const saldoTrasDébito = totalLiquido - cost;
  const marginDiarioTrasDébito = Math.floor(Math.max(0, saldoTrasDébito) / daysLeft);

  // Tarjeta de crédito
  const mainCard = creditCards[0];
  const cupoCredito = mainCard ? mainCard.totalLimit : 0;
  const deudaActualCredito = debts
    .filter(d => d.pendingAmount > 0)
    .reduce((sum, d) => sum + d.pendingAmount, 0);
  const cupoLibre = Math.max(0, cupoCredito - deudaActualCredito);
  const tieneCredito = cupoLibre >= cost;

  // Cuotas crédito
  const cuota3 = Math.round(cost / 3);
  const cuota6 = Math.round(cost / 6);

  // ¿Puede pagar a débito HOY sin riesgo?
  const puedeDebitoSeguro = saldoTrasDébito >= (obligacionesMesPendientes - NOMINA_QUINCENAL + MIN_SAFE_BALANCE);
  const debitoNoApretaDiario = marginDiarioTrasDébito >= MIN_DAILY_MARGIN;

  // CASO 1: Compra pequeña (<= $80k) con liquidez
  if (cost <= 80000 && puedeDebitoSeguro && debitoNoApretaDiario) {
    return {
      purchaseId: purchase.id,
      decision: 'COMPRAR_DEBITO',
      decisionBadge: '🟢 COMPRAR AHORA (DÉBITO)',
      decisionColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      impactSummary: `Compra pequeña. Tu saldo pasa de ${formatCOP(totalLiquido)} a ${formatCOP(saldoTrasDébito)}.`,
      explanation:
        `${formatCOP(cost)} es manejable con tu liquidez actual. Después de pagar, te quedan ${formatCOP(marginDiarioTrasDébito)}/día para mecatos. Tus obligaciones del mes (${formatCOP(obligacionesMesPendientes)}) siguen cubiertas con la nómina del 30.`,
      suggestedDateText: `📅 Disponible HOY (${getFormattedTodayLong()})`,
      creditVsDebitAdvice:
        '💡 Débito es mejor: Para montos pequeños, pagar de contado evita cuotas y mantiene tu tarjeta libre para emergencias.',
      saldoAfterPurchase: saldoTrasDébito,
      marginPerDayAfter: marginDiarioTrasDébito,
      riskLevel: 'bajo',
    };
  }

  // CASO 2: Compra mediana ($80k - $200k)
  if (cost <= 200000) {
    if (puedeDebitoSeguro && debitoNoApretaDiario) {
      return {
        purchaseId: purchase.id,
        decision: 'COMPRAR_DEBITO',
        decisionBadge: '🟢 DÉBITO O 💳 3 CUOTAS',
        decisionColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
        impactSummary: `Débito: saldo baja a ${formatCOP(saldoTrasDébito)}. Crédito: ${formatCOP(cuota3)}/mes × 3.`,
        explanation:
          `Puedes pagar de contado (${formatCOP(cost)}) y te quedan ${formatCOP(marginDiarioTrasDébito)}/día. O puedes diferir a 3 cuotas (${formatCOP(cuota3)}/mes = ${Math.round((cuota3 / NOMINA_QUINCENAL) * 100)}% de tu quincena) si prefieres no descapitalizarte.`,
        suggestedDateText: `📅 Disponible HOY (${getFormattedTodayLong()})`,
        creditVsDebitAdvice:
          `💡 Ambas opciones son viables. Débito = sin deudas. Crédito 3 cuotas = mantienes liquidez.`,
        saldoAfterPurchase: saldoTrasDébito,
        marginPerDayAfter: marginDiarioTrasDébito,
        riskLevel: 'bajo',
      };
    }

    if (tieneCredito) {
      return {
        purchaseId: purchase.id,
        decision: 'USAR_CREDITO',
        decisionBadge: '💳 CRÉDITO 3 CUOTAS',
        decisionColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
        impactSummary: `3 cuotas de ${formatCOP(cuota3)}/mes. Tu saldo HOY no se toca.`,
        explanation:
          `A débito tu saldo bajaría a ${formatCOP(Math.max(0, saldoTrasDébito))} (${marginDiarioTrasDébito < MIN_DAILY_MARGIN ? '⚠️ Muy apretado' : 'ajustado'}). Con crédito: ${formatCOP(cuota3)}/mes = solo ${Math.round((cuota3 / NOMINA_QUINCENAL) * 100)}% de tu quincena. Cupo libre: ${formatCOP(cupoLibre)}.`,
        suggestedDateText: `📅 Comprar cerca al corte (día ${mainCard?.cutoffDay || 30}) para máximo plazo`,
        creditVsDebitAdvice:
          `💡 Crédito es mejor: ${formatCOP(cuota3)}/mes se paga fácil con tu quincena. A débito quedarías apretado.`,
        suggestedInstallments: 3,
        saldoAfterPurchase: totalLiquido,
        marginPerDayAfter: Math.floor(totalLiquido / daysLeft),
        riskLevel: 'bajo',
      };
    }

    return buildWaitRecommendation(purchase, cost, totalLiquido, obligacionesMesPendientes, daysLeft);
  }

  // CASO 3: Compra grande ($200k - $500k)
  if (cost <= 500000) {
    if (tieneCredito) {
      const useSix = cuota3 > NOMINA_QUINCENAL * 0.15;

      return {
        purchaseId: purchase.id,
        decision: 'USAR_CREDITO',
        decisionBadge: useSix ? '💳 CRÉDITO 6 CUOTAS' : '💳 CRÉDITO 3 CUOTAS',
        decisionColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
        impactSummary: useSix
          ? `6 cuotas de ${formatCOP(cuota6)}/mes (${Math.round((cuota6 / NOMINA_QUINCENAL) * 100)}% quincena).`
          : `3 cuotas de ${formatCOP(cuota3)}/mes (${Math.round((cuota3 / NOMINA_QUINCENAL) * 100)}% quincena).`,
        explanation:
          `${formatCOP(cost)} a débito ${saldoTrasDébito < 0 ? 'NO ALCANZA' : `dejaría tu saldo en ${formatCOP(saldoTrasDébito)}`}. Con crédito a ${useSix ? '6' : '3'} cuotas: ${formatCOP(useSix ? cuota6 : cuota3)}/mes es manejable con tu nómina de ${formatCOP(NOMINA_QUINCENAL)}.${purchase.priorityRank === 1 ? ' ⚠️ Es NECESIDAD — no la pospongas.' : ''}`,
        suggestedDateText: `📅 Comprar entre el 28-30 del mes (cerca al corte día ${mainCard?.cutoffDay || 30})`,
        creditVsDebitAdvice:
          `💡 Crédito a ${useSix ? '6' : '3'} cuotas: Mantienes tu liquidez y pagas ${formatCOP(useSix ? cuota6 : cuota3)}/mes cómodamente.`,
        suggestedInstallments: useSix ? 6 : 3,
        saldoAfterPurchase: totalLiquido,
        marginPerDayAfter: Math.floor(totalLiquido / daysLeft),
        riskLevel: 'medio',
      };
    }

    return {
      purchaseId: purchase.id,
      decision: 'AHORRAR_PRIMERO',
      decisionBadge: '🔴 AHORRAR PRIMERO',
      decisionColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      impactSummary: `Necesitas ${formatCOP(cost)} pero no alcanza a débito y no hay cupo de crédito.`,
      explanation:
        `Tu saldo (${formatCOP(totalLiquido)}) menos obligaciones (${formatCOP(obligacionesMesPendientes)}) no deja margen. Ahorra de Uber/nómina hasta reunir el monto.`,
      suggestedDateText: `📅 Ahorra ~${formatCOP(Math.round(cost / 3))}/quincena durante 6 semanas`,
      creditVsDebitAdvice:
        '💡 Abre una cajita en Nu para ir ahorrando. Si es urgente, cotiza financiación directa (Addi/Sistecrédito).',
      saldoAfterPurchase: totalLiquido,
      marginPerDayAfter: Math.floor(totalLiquido / daysLeft),
      riskLevel: 'alto',
    };
  }

  // CASO 4: Compra muy grande (>$500k)
  if (tieneCredito) {
    return {
      purchaseId: purchase.id,
      decision: 'USAR_CREDITO',
      decisionBadge: '💳 CRÉDITO 6 CUOTAS',
      decisionColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      impactSummary: `6 cuotas de ${formatCOP(cuota6)}/mes = ${Math.round((cuota6 / NOMINA_QUINCENAL) * 100)}% de tu quincena.`,
      explanation:
        `${formatCOP(cost)} es MUCHO para débito (tu saldo es ${formatCOP(totalLiquido)}). Con 6 cuotas: ${formatCOP(cuota6)}/mes.${purchase.priorityRank === 1 ? ' ⚠️ Es NECESIDAD — compra ya.' : ' Evalúa si realmente lo necesitas ahora.'}`,
      suggestedDateText: `📅 Comprar entre el 28-30 del mes (cerca al corte día ${mainCard?.cutoffDay || 30})`,
      creditVsDebitAdvice:
        `💡 Crédito obligatorio: A débito perderías el ${Math.round((cost / totalLiquido) * 100)}% de tu dinero de golpe.`,
      suggestedInstallments: 6,
      saldoAfterPurchase: totalLiquido,
      marginPerDayAfter: Math.floor(totalLiquido / daysLeft),
      riskLevel: cost > cupoLibre ? 'alto' : 'medio',
    };
  }

  return {
    purchaseId: purchase.id,
    decision: 'ESPERAR_NOMINA',
    decisionBadge: '⏳ AHORRAR + PLANEAR',
    decisionColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    impactSummary: `${formatCOP(cost)} excede tu liquidez y cupo de crédito.`,
    explanation:
      `Tu saldo (${formatCOP(totalLiquido)}) + cupo (${formatCOP(cupoLibre)}) no cubren ${formatCOP(cost)}. Ahorra ${formatCOP(Math.round(cost / 4))}/quincena durante 2 meses.`,
    suggestedDateText: `📅 Meta: ~2 meses ahorrando (~${formatCOP(Math.round(cost / 4))}/quincena)`,
    creditVsDebitAdvice:
      '💡 Abre una cajita en Nu para ir guardando. O busca crédito Addi/Sistecrédito en la tienda.',
    saldoAfterPurchase: totalLiquido,
    marginPerDayAfter: Math.floor(totalLiquido / daysLeft),
    riskLevel: 'alto',
  };
}

function buildWaitRecommendation(
  purchase: PlannedPurchase,
  cost: number,
  totalLiquido: number,
  obligacionesMes: number,
  daysLeft: number
): PurchaseRecommendation {
  return {
    purchaseId: purchase.id,
    decision: 'ESPERAR_NOMINA',
    decisionBadge: '⏳ ESPERAR A NÓMINA',
    decisionColor: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
    impactSummary: `A débito tu saldo baja a ${formatCOP(Math.max(0, totalLiquido - cost))} — muy apretado.`,
    explanation:
      `Tienes ${formatCOP(totalLiquido)} pero con obligaciones de ${formatCOP(obligacionesMes)} este mes. Espera la nómina del 30 (+${formatCOP(NOMINA_QUINCENAL)}) para comprar con más colchón.`,
    suggestedDateText: '📅 Espera a la nómina del 30 de este mes',
    creditVsDebitAdvice:
      '💡 Esperar la nómina te da más respiro. Si es urgente, usa crédito a 3 cuotas.',
    saldoAfterPurchase: Math.max(0, totalLiquido - cost),
    marginPerDayAfter: Math.max(0, Math.floor((totalLiquido - cost) / daysLeft)),
    riskLevel: 'medio',
  };
}
