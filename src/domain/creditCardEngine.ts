import { CreditCard, Transaction } from '../types/finance';

export interface CardCycleInfo {
  cardId: string;
  cardName: string;
  totalLimit: number;
  usedQuota: number;
  availableQuota: number;
  utilizationPercentage: number;
  currentStatementBalance: number; // Balance of current cycle
  nextCutoffDate: string; // YYYY-MM-DD
  nextPaymentDueDate: string; // YYYY-MM-DD
  activeInstallmentsCount: number;
  monthlyInstallmentSum: number;
}

export function calculateCardCycleInfo(
  card: CreditCard,
  transactions: Transaction[],
  referenceDate = new Date()
): CardCycleInfo {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed

  // Filter transactions belonging to this card
  const cardTransactions = transactions.filter(
    (t) => t.creditCardId === card.id || t.paymentMethod === 'tarjeta_credito'
  );

  // Total quota used by unpaid / installment transactions
  let usedQuota = 0;
  let currentStatementBalance = 0;
  let activeInstallmentsCount = 0;
  let monthlyInstallmentSum = 0;

  cardTransactions.forEach((t) => {
    if (t.installments) {
      const totalCuotas = t.installments.total;
      const currentCuota = t.installments.current;
      const singleInstallmentCost = t.amount / totalCuotas;
      
      const remainingCuotas = Math.max(0, totalCuotas - currentCuota + 1);
      usedQuota += singleInstallmentCost * remainingCuotas;
      monthlyInstallmentSum += singleInstallmentCost;
      activeInstallmentsCount += 1;
      currentStatementBalance += singleInstallmentCost;
    } else {
      usedQuota += t.amount;
      currentStatementBalance += t.amount;
    }
  });

  const availableQuota = Math.max(0, card.totalLimit - usedQuota);
  const utilizationPercentage = Math.min(
    100,
    (usedQuota / (card.totalLimit || 1)) * 100
  );

  // Next cutoff date calculation
  const cutoffDateObj = new Date(currentYear, currentMonth, card.cutoffDay);
  if (cutoffDateObj < referenceDate) {
    cutoffDateObj.setMonth(cutoffDateObj.getMonth() + 1);
  }

  // Next payment due date calculation
  const paymentDueDateObj = new Date(
    cutoffDateObj.getFullYear(),
    cutoffDateObj.getMonth(),
    card.paymentDueDay
  );
  if (paymentDueDateObj <= cutoffDateObj) {
    paymentDueDateObj.setMonth(paymentDueDateObj.getMonth() + 1);
  }

  const formatISO = (d: Date) => d.toISOString().split('T')[0];

  return {
    cardId: card.id,
    cardName: card.name,
    totalLimit: card.totalLimit,
    usedQuota,
    availableQuota,
    utilizationPercentage,
    currentStatementBalance,
    nextCutoffDate: formatISO(cutoffDateObj),
    nextPaymentDueDate: formatISO(paymentDueDateObj),
    activeInstallmentsCount,
    monthlyInstallmentSum,
  };
}
