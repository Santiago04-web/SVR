import { Transaction, Obligation, Budget, Goal, SmartInsight } from '../types/finance';
import { calculateFinancialSummary } from './calculations';
import { formatCOP } from '../utils/formatters';

export function generateSmartInsights(
  transactions: Transaction[],
  obligations: Obligation[],
  budgets: Budget[],
  goals: Goal[],
  initialBalance: number = 0
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const summary = calculateFinancialSummary(transactions, obligations, [], goals, initialBalance);

  // 1. Check pending obligations for current period
  const pendingObligations = obligations.filter((o) => !o.isPaid);
  const totalPendingObligations = pendingObligations.reduce((sum, o) => sum + o.amount, 0);

  if (totalPendingObligations > 0) {
    insights.push({
      id: 'pending-obligations',
      type: 'warning',
      title: 'Obligaciones Pendientes',
      message: `Este mes tienes ${formatCOP(totalPendingObligations)} de obligaciones pendientes.`,
      actionText: 'Ver Pagos',
      actionRoute: 'calendario',
    });
  }

  // 2. Projected balance to end of month
  const projectedEndMonth = summary.saldoDisponible - totalPendingObligations;
  if (projectedEndMonth > 0) {
    insights.push({
      id: 'cashflow-projection',
      type: 'info',
      title: 'Flujo de Caja Proyectado',
      message: `Si mantienes tus ingresos y cumples tus pagos, tu saldo proyectado al final del mes sería ${formatCOP(projectedEndMonth)}.`,
    });
  } else if (projectedEndMonth < 0) {
    insights.push({
      id: 'cashflow-danger',
      type: 'warning',
      title: 'Alerta de Riesgo en Saldo',
      message: `Tus obligaciones pendientes (${formatCOP(totalPendingObligations)}) superan tu saldo disponible actual (${formatCOP(summary.saldoDisponible)}).`,
    });
  }

  // 3. Category budget alerts
  budgets.forEach((budget) => {
    const currentMonthExpenses = transactions
      .filter(
        (t) =>
          t.category === budget.category &&
          t.type === 'gasto' &&
          t.status === 'completado'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const percentUsed = (currentMonthExpenses / (budget.limitAmount || 1)) * 100;

    if (percentUsed >= 90) {
      insights.push({
        id: `budget-danger-${budget.category}`,
        type: 'warning',
        title: `Presupuesto Crítico: ${budget.category}`,
        message: `Has consumido el ${Math.round(percentUsed)}% del presupuesto de ${budget.category} (${formatCOP(currentMonthExpenses)} de ${formatCOP(budget.limitAmount)}).`,
        actionText: 'Ajustar Presupuesto',
        actionRoute: 'presupuesto',
      });
    }
  });

  // 4. Truly free money recommendation
  if (summary.realmenteLibre > 500_000 && goals.length > 0) {
    insights.push({
      id: 'savings-opportunity',
      type: 'success',
      title: 'Capacidad de Ahorro Detectada',
      message: `Tienes ${formatCOP(summary.realmenteLibre)} realmente libres este mes. Considera abonar a tus objetivos de ahorro.`,
      actionText: 'Ver Objetivos',
      actionRoute: 'objetivos',
    });
  }

  return insights;
}
