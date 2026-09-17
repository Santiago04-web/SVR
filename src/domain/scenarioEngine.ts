import { Transaction, Obligation, CreditCard, Goal, Scenario, FinancialSummary } from '../types/finance';
import { calculateFinancialSummary } from './calculations';
import { formatCOP } from '../utils/formatters';

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
}

export function simulateScenario(
  scenario: Scenario,
  transactions: Transaction[],
  obligations: Obligation[],
  creditCards: CreditCard[],
  goals: Goal[],
  initialBalance: number = 0
): ScenarioSimulationResult {
  const currentSummary = calculateFinancialSummary(
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance
  );

  // Clone transactions & obligations for non-mutating sandbox simulation
  const simulatedTransactions = [...transactions];
  const simulatedObligations = [...obligations];

  const installmentsCount = scenario.installments || 1;

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

  const simulatedSummary = calculateFinancialSummary(
    simulatedTransactions,
    simulatedObligations,
    creditCards,
    goals,
    initialBalance
  );

  const deltaAvailable = simulatedSummary.saldoDisponible - currentSummary.saldoDisponible;
  const deltaCommitted = simulatedSummary.comprometido - currentSummary.comprometido;
  const deltaTrulyFree = simulatedSummary.realmenteLibre - currentSummary.realmenteLibre;
  const impactOnDailySpend = simulatedSummary.puedesGastarHoy - currentSummary.puedesGastarHoy;

  const canAfford = simulatedSummary.realmenteLibre >= 0;

  let recommendation = '';
  if (!canAfford) {
    recommendation = `⚠️ No es recomendable realizar este gasto ahora. Dejaría tu saldo realmente libre en un déficit de ${formatCOP(Math.abs(simulatedSummary.realmenteLibre))}.`;
  } else if (simulatedSummary.realmenteLibre < 100_000) {
    recommendation = `⚡ Puedes realizar la compra, pero reducirá tu margen libre a solo ${formatCOP(simulatedSummary.realmenteLibre)}. Dejarás muy poco margen para imprevistos.`;
  } else {
    recommendation = `✅ Compra viable. Después de este gasto mantendrás ${formatCOP(simulatedSummary.realmenteLibre)} de dinero realmente libre y un cupo diario de ${formatCOP(simulatedSummary.puedesGastarHoy)}/día.`;
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
  };
}
