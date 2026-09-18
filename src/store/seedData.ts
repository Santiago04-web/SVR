import type {
  Transaction,
  CreditCard,
  Obligation,
  Budget,
  Goal,
  VehicleLog,
  Debt,
  PlannedPurchase,
} from '../types/finance';

// Saldo disponible REAL en Bancolombia HOY (18 de septiembre de 2026)
export const INITIAL_BASE_BALANCE = 490000;

// Dinero actualmente APARTADO
export const INITIAL_RESERVED_AMOUNT = 0;

export const SEED_ACCOUNTS = [
  {
    id: 'bancolombia',
    name: 'Bancolombia (Principal)',
    type: 'bancolombia' as const,
    balance: 490000,
    color: '#00c853',
    isMain: true,
  },
  {
    id: 'efectivo',
    name: 'Efectivo (Bolsillo / Uber)',
    type: 'efectivo' as const,
    balance: 28000,
    color: '#f59e0b',
  },
  {
    id: 'nequi',
    name: 'Nequi',
    type: 'nequi' as const,
    balance: 31000,
    color: '#ec4899',
  },
  {
    id: 'nu',
    name: 'Cuenta Nu (Cajitas)',
    type: 'nu' as const,
    balance: 3000,
    color: '#8b5cf6',
  },
];


export const SEED_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-bancolombia-visa',
    name: 'Bancolombia Visa Clásica',
    bank: 'Bancolombia',
    totalLimit: 2400000,
    cutoffDay: 30,
    paymentDueDay: 15,
    color: 'from-amber-500 to-yellow-700',
    lastFourDigits: '9102',
    monthlyFee: 20900,
  },
];

export const SEED_DEBTS: Debt[] = [
  {
    id: 'debt-moto-cuotas',
    name: '🏍️ Moto (Préstamo $2M)',
    totalCost: 2000000,
    amountPaid: 900000,
    pendingAmount: 1100000,
    firstInstallmentDate: '2026-05-15',
    installmentsCount: 20,
    statusText: '$100.000 quincenales (desde 15 Mayo). 9 pagadas ($900k), 11 pendientes ($1.1M)',
  },
  {
    id: 'debt-licencia',
    name: '🪪 Licencia de Conducción ($1.45M)',
    totalCost: 1450000,
    amountPaid: 150000,
    pendingAmount: 1300000,
    firstInstallmentDate: '2026-09-15',
    installmentsCount: 10,
    statusText: '$150.000 quincenales (desde 15 Sep). 1 pagada ($150k), faltan ~$1.3M',
  },
  {
    id: 'debt-casco',
    name: '🪖 Casco de Moto (Shaft)',
    totalCost: 505000,
    amountPaid: 126000,
    pendingAmount: 379000,
    firstInstallmentDate: '2026-10-22',
    statusText: 'Costo $505k, abonados $126k. Saldo $379k. Cuotas los días 22 (inicia 22 Oct)',
  },
  {
    id: 'debt-addi-140k',
    name: '⚡ Addi — Crédito 7 Sep',
    totalCost: 140553,
    amountPaid: 0,
    pendingAmount: 140553,
    firstInstallmentDate: '2026-11-04',
    installmentsCount: 3,
    statusText: '3 cuotas (~$46.851/mes). Primera cuota el 4 de noviembre de 2026 (0% interés)',
  },
  {
    id: 'debt-universidad-semestre',
    name: '🎓 Universidad (Semestre $2.6M)',
    totalCost: 2600000,
    amountPaid: 1200000,
    pendingAmount: 1400000,
    firstInstallmentDate: '2026-07-10',
    installmentsCount: 6,
    statusText: '10 Jul ($500k bono) + 10 Ago ($350k) + 10 Sep ($350k) PAGADOS ($1.2M). Faltan $1.4M (Oct, Nov, Dic)',
  },
];

export const SEED_OBLIGATIONS: Obligation[] = [
  // --- OBLIGACIONES RESTANTES DE SEPTIEMBRE (Del 16 al 30 de Septiembre 2026) ---
  {
    id: 'obl-universidad-sep',
    title: '🎓 Universidad Septiembre',
    amount: 350000,
    dueDate: '2026-09-10',
    category: 'Universidad',
    isPaid: true,
    notes: 'Pagada el 10 de Septiembre ($350.000).',
  },
  {
    id: 'obl-gasolina-sep-w3',
    title: '⛽ Gasolina Moto (Semana 3 Sep)',
    amount: 50000,
    dueDate: '2026-09-22',
    category: 'Transporte',
    isPaid: false,
  },
  {
    id: 'obl-almuerzo-q2-sep',
    title: '🍽️ Almuerzo — 2ª Quincena Sep',
    amount: 200000,
    dueDate: '2026-09-30',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-mercado-grande-sep',
    title: '🛒 Mercado Grande Sep',
    amount: 250000,
    dueDate: '2026-09-30',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-movistar-sep',
    title: '📱 Movistar Plan Celular Sep',
    amount: 35000,
    dueDate: '2026-09-30',
    category: 'Servicios',
    isPaid: false,
  },
  {
    id: 'obl-cuota-manejo-sep',
    title: '💳 Cuota Manejo Bancolombia Sep',
    amount: 20900,
    dueDate: '2026-09-30',
    category: 'Tarjeta',
    isPaid: false,
  },

  // --- OBLIGACIONES DE OCTUBRE 2026 ---
  {
    id: 'obl-gym-oct',
    title: '🏋️ Gimnasio Octubre',
    amount: 110000,
    dueDate: '2026-10-10',
    category: 'Gym',
    isPaid: false,
  },
  {
    id: 'obl-soat-oct',
    title: '📜 SOAT Moto (Pulsar 135 LS)',
    amount: 343300,
    dueDate: '2026-10-10',
    category: 'Moto',
    isPaid: false,
    isPendingConfirmation: false,
    notes: 'SOAT tarifa diferencial 2026 (motos 100cc-200cc): $343.300.',
  },
  {
    id: 'obl-almuerzo-q1-oct',
    title: '🍽️ Almuerzo — 1ª Quincena Oct',
    amount: 200000,
    dueDate: '2026-10-15',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-mercado-pequeno-oct',
    title: '🛒 Mercado Pequeño Oct',
    amount: 50000,
    dueDate: '2026-10-15',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-elena-oct',
    title: '🧹 Elena Octubre',
    amount: 50000,
    dueDate: '2026-10-15',
    category: 'Personal',
    isPaid: false,
  },
  {
    id: 'obl-almuerzo-q2-oct',
    title: '🍽️ Almuerzo — 2ª Quincena Oct',
    amount: 200000,
    dueDate: '2026-10-30',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-mercado-grande-oct',
    title: '🛒 Mercado Grande Oct',
    amount: 250000,
    dueDate: '2026-10-30',
    category: 'Comida',
    isPaid: false,
  },
  {
    id: 'obl-movistar-oct',
    title: '📱 Movistar Plan Celular Oct',
    amount: 35000,
    dueDate: '2026-10-30',
    category: 'Servicios',
    isPaid: false,
  },
  {
    id: 'obl-universidad-oct',
    title: '🎓 Universidad Octubre',
    amount: 350000,
    dueDate: '2026-10-10',
    category: 'Universidad',
    isPaid: false,
  },

  // --- OBLIGACIONES DE NOVIEMBRE 2026 ---
  {
    id: 'obl-addi-140k-nov',
    title: 'Addi — Crédito (1ra de 3 cuotas)',
    amount: 46851,
    dueDate: '2026-11-04',
    category: 'Personal',
    isPaid: false,
    notes: 'Total crédito $140.553 en 3 cuotas. Primera cuota 4 NOV.',
  },
  {
    id: 'obl-universidad-nov',
    title: '🎓 Universidad Noviembre',
    amount: 350000,
    dueDate: '2026-11-10',
    category: 'Universidad',
    isPaid: false,
  },
  {
    id: 'obl-casco-nov',
    title: 'Casco Moto (Pendiente $379.000)',
    amount: 379000,
    dueDate: '2026-11-15',
    category: 'Moto',
    isPaid: false,
    isPendingConfirmation: true,
    notes: 'Costo total $505.000. $126.000 ya pagados previamente. Primera cuota en noviembre 2026 (valor por definir).',
  },
  {
    id: 'obl-tecnomecanica-nov',
    title: '🔍 Tecnomecánica Moto (Pulsar 135 LS)',
    amount: 235400,
    dueDate: '2026-11-20',
    category: 'Moto',
    isPaid: false,
    isPendingConfirmation: false,
    notes: 'Revisión tecnomecánica modelo 2019 (vence 20 NOV): $235.400.',
  },

  // --- OBLIGACIONES DE DICIEMBRE 2026 ---
  {
    id: 'obl-universidad-dic',
    title: '🎓 Universidad Diciembre (ÚLTIMA CUOTA)',
    amount: 350000,
    dueDate: '2026-12-10',
    category: 'Universidad',
    isPaid: false,
    notes: 'Última cuota de Universidad.',
  },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-uber-didi-16sep',
    description: '🚗 Jornada Uber / Didi (Anoche)',
    amount: 60000,
    type: 'ingreso',
    category: 'Transporte',
    date: '2026-09-16',
    paymentMethod: 'efectivo',
    status: 'completado',
  },
];

export const SEED_BUDGETS: Budget[] = [
  { category: 'Universidad', limitAmount: 350000, period: 'mensual' },
  { category: 'Comida', limitAmount: 700000, period: 'mensual' },
  { category: 'Transporte', limitAmount: 200000, period: 'mensual' },
  { category: 'Gym', limitAmount: 110000, period: 'mensual' },
  { category: 'Personal', limitAmount: 100000, period: 'mensual' },
  { category: 'Servicios', limitAmount: 35000, period: 'mensual' },
  { category: 'Tarjeta', limitAmount: 20900, period: 'mensual' },
];

export const SEED_GOALS: Goal[] = [
  {
    id: 'goal-ahorro',
    title: 'Fondo de Emergencia / Ahorro Libre',
    targetAmount: 2000000,
    currentAmount: 0,
    targetDate: '2026-12-31',
    category: 'Ahorro',
    color: 'from-emerald-500 to-teal-700',
    monthlyContribution: 100000,
  },
];

export const SEED_VEHICLE_LOGS: VehicleLog[] = [
  {
    id: 'vlog-aceite-target',
    date: '2026-09-01',
    type: 'aceite',
    description: 'Próximo Cambio de Aceite a los 67.500 km (Bajaj Pulsar 135 LS)',
    cost: 75000,
    odometerKm: 65200,
    nextDueDate: '2026-10-01',
  },
  {
    id: 'vlog-soat',
    date: '2026-10-10',
    type: 'soat',
    description: 'SOAT Bajaj Pulsar 135 LS (Tarifa diferencial)',
    cost: 343300,
    isPendingConfirmation: false,
    nextDueDate: '2026-10-10',
  },
  {
    id: 'vlog-tecno',
    date: '2026-11-20',
    type: 'tecnomecanica',
    description: 'Tecnomecánica Bajaj Pulsar 135 LS (Modelo 2019)',
    cost: 235400,
    isPendingConfirmation: false,
    nextDueDate: '2026-11-20',
  },
];

export const SEED_PLANNED_PURCHASES: PlannedPurchase[] = [
  {
    id: 'plan-gafas',
    name: '👓 Gafas (Fórmula & Marcos)',
    estimatedCost: 500000,
    category: 'Salud',
    priorityRank: 1, // Prioridad 1 = NECESIDAD
    isPendingPrice: false,
    notes: 'Prioridad 1 (NECESIDAD). Cotización confirmada $500.000.',
  },
  {
    id: 'plan-camiseta-1',
    name: '👕 Camiseta #1',
    estimatedCost: 100000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-camiseta-2',
    name: '👕 Camiseta #2',
    estimatedCost: 100000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-camiseta-3',
    name: '👕 Camiseta #3',
    estimatedCost: 100000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-jean-1',
    name: '👖 Jean #1',
    estimatedCost: 150000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-jean-2',
    name: '👖 Jean #2',
    estimatedCost: 150000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-perfume',
    name: '🌸 Perfume',
    estimatedCost: 300000,
    category: 'Personal',
    priorityRank: 4,
  },
  {
    id: 'plan-teclado',
    name: '⌨️ Teclado mecánico 60%',
    estimatedCost: 200000,
    category: 'Personal',
    priorityRank: 4,
  },
];
