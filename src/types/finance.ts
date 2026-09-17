export type TransactionType = 'ingreso' | 'gasto' | 'compromiso';

export type Category =
  | 'Comida'
  | 'Transporte'
  | 'Personal'
  | 'Moto'
  | 'Servicios'
  | 'Tarjeta'
  | 'Universidad'
  | 'Gym'
  | 'Gimnasio'
  | 'Suscripciones'
  | 'Vivienda'
  | 'Salud'
  | 'Educación'
  | 'Ahorro'
  | 'Otros';

export type PaymentMethod =
  | 'efectivo'
  | 'debito'
  | 'tarjeta_credito'
  | 'addi'
  | 'transferencia';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurringFrequency?: 'mensual' | 'quincenal' | 'anual';
  creditCardId?: string;
  installments?: {
    current: number;
    total: number;
  };
  notes?: string;
  status: 'completado' | 'pendiente';
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  totalLimit: number;
  cutoffDay: number; // 1-31
  paymentDueDay: number; // 1-31
  color: string;
  lastFourDigits?: string;
  monthlyFee?: number; // Cuota de manejo
}

export interface Obligation {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: Category;
  isPaid: boolean;
  creditCardId?: string;
  isPendingConfirmation?: boolean;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string; // ej. "Casco Shaft", "Addi Crédito"
  totalCost: number;
  amountPaid: number;
  pendingAmount: number;
  firstInstallmentDate: string;
  statusText: string;
  installmentsCount?: number;
}

export interface Budget {
  category: Category;
  limitAmount: number;
  period: 'mensual';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: Category;
  icon?: string;
  color?: string;
  monthlyContribution?: number;
}

export type VehicleLogType =
  | 'gasolina'
  | 'mantenimiento'
  | 'soat'
  | 'tecnomecanica'
  | 'aceite'
  | 'repuesto'
  | 'lavado'
  | 'impuesto';

export interface VehicleLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: VehicleLogType;
  description: string;
  cost: number;
  isPendingConfirmation?: boolean;
  odometerKm?: number;
  gallons?: number;
  nextDueDate?: string; // YYYY-MM-DD
}

export interface Scenario {
  id: string;
  name: string;
  incomeDelta: number;
  expenseDelta: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  category: Category;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface FinancialSummary {
  saldoDisponible: number;
  dineroApartado: number;
  comprometido: number;
  realmenteLibre: number;
  puedesGastarHoy: number;
  fondoProtegidoAhorro: number;
  ingresosMes: number;
  gastosMes: number;
  deudaTarjetasTotal: number;
  proximoPagoCuota: number;
  diasRestantesMes: number;
}

export interface SmartInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  actionText?: string;
  actionRoute?: string;
}

export type BankAccountType = 'bancolombia' | 'nequi' | 'nu' | 'efectivo' | 'davivienda' | 'otro';

export interface BankAccount {
  id: string;
  name: string;
  type: BankAccountType;
  balance: number;
  accountNumber?: string;
  color: string;
  isMain?: boolean;
}

export interface PlannedPurchase {
  id: string;
  name: string;
  estimatedCost: number;
  category: Category;
  priorityRank: number; // 1 = Necesidad (Gafas), 4 = Deseo personal
  isPendingPrice?: boolean;
  notes?: string;
  isPurchased?: boolean;
}

export interface PurchaseRecommendation {
  purchaseId: string;
  decision: 'COMPRAR_DEBITO' | 'USAR_CREDITO' | 'ESPERAR_NOMINA' | 'AHORRAR_PRIMERO';
  decisionBadge: string;
  decisionColor: string;
  impactSummary: string;
  explanation: string;
  suggestedDateText: string;
  creditVsDebitAdvice: string;
  suggestedInstallments?: number;
  saldoAfterPurchase: number;
  marginPerDayAfter: number;
  riskLevel: 'bajo' | 'medio' | 'alto';
}



