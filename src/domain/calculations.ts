import type {
  Transaction,
  Obligation,
  CreditCard,
  Goal,
  FinancialSummary,
  BankAccount,
} from '../types/finance';
import { getRemainingDaysInMonth, getTodayISO } from '../utils/dates';

export function calculateFinancialSummary(
  transactions: Transaction[],
  obligations: Obligation[],
  creditCards: CreditCard[],
  goals: Goal[],
  initialBalance: number = 507000,
  dineroApartado: number = 0,
  accounts?: BankAccount[]
): FinancialSummary {
  const todayStr = getTodayISO();
  const currentYearMonth = todayStr.substring(0, 7);

  // 1. Saldo disponible HOY (Dinero real en cuentas)
  let totalIncome = 0;
  let totalExpense = 0;
  let currentMonthIncome = 0;
  let currentMonthExpense = 0;

  transactions.forEach((t) => {
    if (t.status === 'completado') {
      if (t.type === 'ingreso') {
        totalIncome += t.amount;
        if (t.date.startsWith(currentYearMonth)) {
          currentMonthIncome += t.amount;
        }
      } else if (t.type === 'gasto') {
        totalExpense += t.amount;
        if (t.date.startsWith(currentYearMonth)) {
          currentMonthExpense += t.amount;
        }
      }
    }
  });

  let saldoDisponible = 0;
  if (accounts && accounts.length > 0) {
    saldoDisponible = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  } else {
    saldoDisponible = initialBalance + totalIncome - totalExpense;
  }

  // 2. Dinero actualmente APARTADO
  const comprometido = dineroApartado;

  // 3. Dinero REALMENTE LIBRE
  const realmenteLibre = saldoDisponible - comprometido;

  // 4. Límite diario prudente (Tope máximo de $10.000/día para mecatos/desayunos, ya que Almuerzos ya son fijos)
  // El resto del saldo libre se protege en el Fondo de Reserva para Ahorro, Deudas y Compras Planeadas.
  const daysRemaining = getRemainingDaysInMonth();

  // Tope prudente: $10.000/día máximo para mecatos y desayunos ocasionales
  const puedesGastarHoy = Math.min(
    10000,
    Math.floor(Math.max(0, realmenteLibre) / daysRemaining)
  );

  const fondoProtegidoAhorro = Math.max(
    0,
    realmenteLibre - puedesGastarHoy * daysRemaining
  );

  // Deuda actual de tarjeta de crédito
  const deudaTarjetasTotal = transactions
    .filter(
      (t) =>
        t.paymentMethod === 'tarjeta_credito' &&
        t.status === 'completado' &&
        t.installments
    )
    .reduce((sum, t) => {
      const totalCuotas = t.installments?.total || 1;
      const currentCuota = t.installments?.current || 1;
      const cuotasRestantes = Math.max(0, totalCuotas - currentCuota);
      const cuotaValor = t.amount / totalCuotas;
      return sum + cuotaValor * cuotasRestantes;
    }, 0);

  const proximoPagoCuota =
    obligations
      .filter((o) => !o.isPaid && o.amount > 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.amount || 0;

  return {
    saldoDisponible,
    dineroApartado,
    comprometido,
    realmenteLibre,
    puedesGastarHoy,
    fondoProtegidoAhorro,
    ingresosMes: currentMonthIncome,
    gastosMes: currentMonthExpense,
    deudaTarjetasTotal,
    proximoPagoCuota,
    diasRestantesMes: daysRemaining,
  };
}
