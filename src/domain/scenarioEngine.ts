import { Transaction, Obligation, CreditCard, Goal, Scenario, FinancialSummary, BankAccount } from '../types/finance';
import { calculateFinancialSummary } from './calculations';
import { formatCOP } from '../utils/formatters';
import { getTodayISO, getRemainingDaysInMonth } from '../utils/dates';

export interface ScenarioSimulationResult {
  scenario: Scenario;
  currentSummary: FinancialSummary;
  simulatedSummary: FinancialSummary;
  deltaAvailable: number;
  deltaCommitted: number;
  deltaTrulyFree: number;
  canAfford: boolean;
  impactOnDailySpend: number;
  recommendation: string;
  verdictType: 'danger' | 'warning' | 'caution' | 'success';
  verdictTitle: string;
  details: {
    pendingObligationsThisMonth: number;
    cashBufferAfterExpense: number;
    projectedQuincenaSurplus: number;
    reasoningBullets: string[];
  };
}

export function simulateScenario(
  scenario: Scenario,
  transactions: Transaction[],
  obligations: Obligation[],
  creditCards: CreditCard[],
  goals: Goal[],
  initialBalance: number = 507000,
  dineroApartado: number = 0,
  accounts?: BankAccount[]
): ScenarioSimulationResult {
  const todayStr = getTodayISO();
  const currentMonth = todayStr.substring(0, 7);

  const currentSummary = calculateFinancialSummary(
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
    accounts
  );

  // Pending obligations for this month that have not been paid yet
  const pendingObligationsThisMonth = obligations
    .filter((o) => !o.isPaid && o.dueDate.startsWith(currentMonth))
    .reduce((sum, o) => sum + o.amount, 0);

  const allPendingObligations = obligations
    .filter((o) => !o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);

  // Clone transactions & obligations for non-mutating sandbox simulation
  const simulatedTransactions = [...transactions];
  const simulatedObligations = [...obligations];
  const installmentsCount = Math.max(1, scenario.installments || 1);

  let simulatedDineroApartado = dineroApartado;

  if (scenario.paymentMethod === 'tarjeta_credito' || scenario.paymentMethod === 'addi') {
    // Adds a pending card/credit obligation
    const singleInstallment = scenario.expenseDelta / installmentsCount;
    simulatedObligations.push({
      id: `sim-${Date.now()}`,
      title: `${scenario.name} (Simulado)`,
      amount: singleInstallment,
      dueDate: scenario.date,
      category: scenario.category,
      isPaid: false,
    });
  } else {
    // Immediate cash / debit expense
    if (scenario.expenseDelta > 0) {
      simulatedTransactions.push({
        id: `sim-${Date.now()}`,
        description: `${scenario.name} (Simulado)`,
        amount: scenario.expenseDelta,
        type: 'gasto',
        category: scenario.category,
        date: scenario.date,
        paymentMethod: scenario.paymentMethod,
        status: 'completado',
      });
    }

    if (scenario.incomeDelta > 0) {
      simulatedTransactions.push({
        id: `sim-${Date.now()}`,
        description: `${scenario.name} (Simulado)`,
        amount: scenario.incomeDelta,
        type: 'ingreso',
        category: scenario.category,
        date: scenario.date,
        paymentMethod: scenario.paymentMethod,
        status: 'completado',
      });
    }
  }

  // If using accounts, adjust the main liquid balance for the simulation
  let simulatedAccounts: BankAccount[] | undefined = undefined;
  if (accounts && accounts.length > 0) {
    simulatedAccounts = accounts.map((acc) => {
      if (acc.isMain || acc.id === 'bancolombia') {
        const netDelta = (scenario.incomeDelta || 0) - (scenario.paymentMethod === 'debito' || scenario.paymentMethod === 'efectivo' ? (scenario.expenseDelta || 0) : 0);
        return { ...acc, balance: Math.max(0, acc.balance + netDelta) };
      }
      return { ...acc };
    });
  }

  const simulatedSummary = calculateFinancialSummary(
    simulatedTransactions,
    simulatedObligations,
    creditCards,
    goals,
    initialBalance,
    simulatedDineroApartado,
    simulatedAccounts
  );

  const deltaAvailable = simulatedSummary.saldoDisponible - currentSummary.saldoDisponible;
  const deltaCommitted = simulatedSummary.comprometido - currentSummary.comprometido;
  const deltaTrulyFree = simulatedSummary.realmenteLibre - currentSummary.realmenteLibre;
  const impactOnDailySpend = simulatedSummary.puedesGastarHoy - currentSummary.puedesGastarHoy;

  // Real financial cushion calculation:
  // Liquid cash after expense vs remaining fixed obligations before next quincena
  const liquidAfterExpense = currentSummary.saldoDisponible - (scenario.paymentMethod === 'debito' || scenario.paymentMethod === 'efectivo' ? scenario.expenseDelta : 0);
  const cashBufferAfterExpense = liquidAfterExpense - pendingObligationsThisMonth;
  
  // Quincena standard (680.000 on 30th)
  const quincenaEsperada = 680000;
  const projectedQuincenaSurplus = liquidAfterExpense + quincenaEsperada - pendingObligationsThisMonth;

  let canAfford = true;
  let verdictType: 'danger' | 'warning' | 'caution' | 'success' = 'success';
  let verdictTitle = 'Compra Viable';
  let recommendation = '';
  const reasoningBullets: string[] = [];

  const lowerName = scenario.name.toLowerCase();
  const isAddiPrepay = lowerName.includes('addi') || lowerName.includes('adelantad') || lowerName.includes('prepago');

  if (isAddiPrepay) {
    // Special deep analysis for Addi prepayment
    canAfford = false;
    verdictType = 'warning';
    verdictTitle = 'Innecesario y Desaconsejado';
    recommendation = `⚠️ No es recomendable pagar Addi por adelantado en este momento. La deuda de Addi ($140.553) tiene 0% de interés y su primera cuota vence el 4 de Noviembre. Si pagas $140.553 hoy en efectivo/débito, descapitalizas tu liquidez (${formatCOP(currentSummary.saldoDisponible)}) cuando aún tienes ${formatCOP(pendingObligationsThisMonth)} en obligaciones fijas pendientes este mes (Universidad $350k, Mercado $250k, Almuerzos $200k). Conserva tu efectivo y paga las cuotas normales mes a mes.`;
    
    reasoningBullets.push(`Costo financiero cero: Addi te financia a 0% de interés en 3 cuotas ($46.851/mes). Prepagarlo no te ahorra ningún peso.`);
    reasoningBullets.push(`Protección de liquidez: Tienes ${formatCOP(pendingObligationsThisMonth)} en pagos fijos pendientes antes de la quincena del 30 de Septiembre.`);
    reasoningBullets.push(`Estrategia recomendada: Mantén el dinero en Bancolombia/Nu para emergencias y deja que las 3 cuotas se paguen automáticamente a partir de Noviembre.`);
  } else if (scenario.paymentMethod === 'debito' || scenario.paymentMethod === 'efectivo') {
    if (scenario.expenseDelta > currentSummary.saldoDisponible) {
      canAfford = false;
      verdictType = 'danger';
      verdictTitle = 'Fondos Insuficientes';
      recommendation = `🚨 No tienes suficiente saldo líquido disponible (${formatCOP(currentSummary.saldoDisponible)}) para pagar este gasto de ${formatCOP(scenario.expenseDelta)}. Generaría un descubierto inmediato de ${formatCOP(Math.abs(currentSummary.saldoDisponible - scenario.expenseDelta))}.`;
      reasoningBullets.push(`Saldo disponible actual: ${formatCOP(currentSummary.saldoDisponible)}.`);
      reasoningBullets.push(`Faltante directo: ${formatCOP(scenario.expenseDelta - currentSummary.saldoDisponible)}.`);
    } else if (cashBufferAfterExpense < 0) {
      canAfford = false;
      verdictType = 'warning';
      verdictTitle = 'Riesgo Alto de Liquidez';
      recommendation = `⚠️ Aunque tienes el dinero en la cuenta, realizar esta compra te dejaría con ${formatCOP(liquidAfterExpense)}, insuficiente para cubrir los ${formatCOP(pendingObligationsThisMonth)} en obligaciones fijas pendientes de este mes antes de que llegue la quincena.`;
      reasoningBullets.push(`Obligaciones pendientes este mes: ${formatCOP(pendingObligationsThisMonth)}.`);
      reasoningBullets.push(`Déficit temporal antes de quincena: ${formatCOP(Math.abs(cashBufferAfterExpense))}.`);
      reasoningBullets.push(`Solución: Espera al pago de la quincena del 30 (${formatCOP(quincenaEsperada)}) para realizar la compra sin comprometer arriendo/mercado/universidad.`);
    } else if (cashBufferAfterExpense < 100000) {
      canAfford = true;
      verdictType = 'caution';
      verdictTitle = 'Viable con Margen Ajustado';
      recommendation = `⚡ Compra viable pero con margen muy estrecho. Después de pagar tus compromisos del mes, solo te quedarán ${formatCOP(cashBufferAfterExpense)} de reserva de emergencia.`;
      reasoningBullets.push(`Saldo restante tras obligaciones: ${formatCOP(cashBufferAfterExpense)}.`);
      reasoningBullets.push(`Tope diario recomendado: Reducir mecatos a un máximo de ${formatCOP(simulatedSummary.puedesGastarHoy)}/día.`);
    } else {
      canAfford = true;
      verdictType = 'success';
      verdictTitle = 'Compra Totalmente Viable';
      recommendation = `✅ Compra viable y saludable. Mantendrás ${formatCOP(cashBufferAfterExpense)} de margen libre después de cubrir todas las obligaciones del mes (${formatCOP(pendingObligationsThisMonth)}).`;
      reasoningBullets.push(`Reserva libre garantizada: ${formatCOP(cashBufferAfterExpense)}.`);
      reasoningBullets.push(`Presupuesto diario seguro: ${formatCOP(simulatedSummary.puedesGastarHoy)}/día.`);
    }
  } else if (scenario.paymentMethod === 'tarjeta_credito') {
    const cuotaMensual = scenario.expenseDelta / installmentsCount;
    if (cuotaMensual > 150000) {
      canAfford = true;
      verdictType = 'caution';
      verdictTitle = 'Cuota Mensual Elevada';
      recommendation = `⚡ A ${installmentsCount} cuotas, sumarás ${formatCOP(cuotaMensual)}/mes a tus gastos fijos. Asegúrate de que tu quincena pueda absorber este pago mensual recurrente sin ahogar el presupuesto de comida y transporte.`;
      reasoningBullets.push(`Impacto mensual recurrente: +${formatCOP(cuotaMensual)} durante ${installmentsCount} meses.`);
      reasoningBullets.push(`Consejo: Si puedes diferir a menos cuotas cuando tengas ingresos extraordinarios (Uber/Didi), reducirás el costo total.`);
    } else {
      canAfford = true;
      verdictType = 'success';
      verdictTitle = 'Crédito Manejable';
      recommendation = `✅ Impacto mensual moderado (+${formatCOP(cuotaMensual)}/mes a ${installmentsCount} cuotas). Es compatible con tu flujo de caja quincenal.`;
      reasoningBullets.push(`Cuota mensual proyectada: ${formatCOP(cuotaMensual)}/mes.`);
      reasoningBullets.push(`Recomendación: Pagar puntual antes del día 15 para evitar intereses de mora.`);
    }
  }

  return {
    scenario,
    currentSummary,
    simulatedSummary,
    deltaAvailable,
    deltaCommitted,
    deltaTrulyFree,
    canAfford,
    impactOnDailySpend,
    recommendation,
    verdictType,
    verdictTitle,
    details: {
      pendingObligationsThisMonth,
      cashBufferAfterExpense,
      projectedQuincenaSurplus,
      reasoningBullets,
    },
  };
}

