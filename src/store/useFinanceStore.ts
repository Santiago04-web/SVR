import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Transaction,
  CreditCard,
  Obligation,
  Budget,
  Goal,
  VehicleLog,
  Scenario,
  Debt,
  BankAccount,
  PlannedPurchase,
  PaymentMethod,
} from '../types/finance';
import {
  INITIAL_BASE_BALANCE,
  INITIAL_RESERVED_AMOUNT,
  SEED_CREDIT_CARDS,
  SEED_OBLIGATIONS,
  SEED_TRANSACTIONS,
  SEED_BUDGETS,
  SEED_GOALS,
  SEED_VEHICLE_LOGS,
  SEED_DEBTS,
  SEED_ACCOUNTS,
  SEED_PLANNED_PURCHASES,
} from './seedData';
import { getTodayISO } from '../utils/dates';

interface FinanceState {
  initialBalance: number;
  dineroApartado: number;
  isPrivacyMode: boolean;
  accounts: BankAccount[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  obligations: Obligation[];
  budgets: Budget[];
  goals: Goal[];
  vehicleLogs: VehicleLog[];
  debts: Debt[];
  scenarios: Scenario[];
  plannedPurchases: PlannedPurchase[];
  activeView: string;

  // Actions
  togglePrivacyMode: () => void;
  setActiveView: (view: string) => void;
  setInitialBalance: (amount: number) => void;
  setDineroApartado: (amount: number) => void;

  // Accounts Management
  updateAccountBalance: (id: string, balance: number) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number) => void;

  // Planned Purchases
  addPlannedPurchase: (purchase: Omit<PlannedPurchase, 'id'>) => void;
  updatePlannedPurchase: (purchase: PlannedPurchase) => void;
  deletePlannedPurchase: (id: string) => void;
  executePlannedPurchase: (
    id: string,
    paymentMethod: PaymentMethod,
    installments?: number
  ) => void;

  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;

  // Obligations
  addObligation: (obligation: Omit<Obligation, 'id'>) => void;
  updateObligation: (obligation: Obligation) => void;
  markObligationPaid: (id: string, isPaid?: boolean) => void;
  deleteObligation: (id: string) => void;

  // Credit Cards
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  deleteCreditCard: (id: string) => void;

  // Budgets
  updateBudget: (budget: Budget) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoalAmount: (id: string, currentAmount: number) => void;
  deleteGoal: (id: string) => void;

  // Vehicle Logs
  addVehicleLog: (log: Omit<VehicleLog, 'id'>) => void;
  deleteVehicleLog: (id: string) => void;

  // Debts Management
  aboneDebt: (debtId: string, amount: number, accountId?: string, customNote?: string) => void;
  updateDebt: (debt: Debt) => void;

  // Storage & Export/Import
  exportJSON: () => string;
  importJSON: (jsonStr: string) => boolean;
  exportCSV: () => string;
  resetToSeedData: () => void;
  clearAllData: () => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      initialBalance: INITIAL_BASE_BALANCE,
      dineroApartado: INITIAL_RESERVED_AMOUNT,
      isPrivacyMode: false,
      accounts: SEED_ACCOUNTS,
      transactions: SEED_TRANSACTIONS,
      creditCards: SEED_CREDIT_CARDS,
      obligations: SEED_OBLIGATIONS,
      budgets: SEED_BUDGETS,
      goals: SEED_GOALS,
      vehicleLogs: SEED_VEHICLE_LOGS,
      debts: SEED_DEBTS,
      scenarios: [],
      plannedPurchases: SEED_PLANNED_PURCHASES,
      activeView: 'overview',

      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

      setActiveView: (view: string) => set({ activeView: view }),

      setInitialBalance: (amount: number) =>
        set((state) => {
          const updatedAccounts = state.accounts.map((a) =>
            a.isMain ? { ...a, balance: amount } : a
          );
          return { initialBalance: amount, accounts: updatedAccounts };
        }),

      setDineroApartado: (amount: number) => set({ dineroApartado: amount }),

      // Accounts Actions
      updateAccountBalance: (id: string, balance: number) =>
        set((state) => {
          const updatedAccounts = state.accounts.map((a) =>
            a.id === id ? { ...a, balance } : a
          );
          const mainAcc = updatedAccounts.find((a) => a.isMain);
          return {
            accounts: updatedAccounts,
            initialBalance: mainAcc ? mainAcc.balance : state.initialBalance,
          };
        }),

      transferBetweenAccounts: (fromId: string, toId: string, amount: number) =>
        set((state) => {
          if (amount <= 0) return state;
          const updatedAccounts = state.accounts.map((a) => {
            if (a.id === fromId) return { ...a, balance: Math.max(0, a.balance - amount) };
            if (a.id === toId) return { ...a, balance: a.balance + amount };
            return a;
          });
          const mainAcc = updatedAccounts.find((a) => a.isMain);
          return {
            accounts: updatedAccounts,
            initialBalance: mainAcc ? mainAcc.balance : state.initialBalance,
          };
        }),

      // Planned Purchases Actions
      addPlannedPurchase: (newP) =>
        set((state) => ({
          plannedPurchases: [
            ...state.plannedPurchases,
            { ...newP, id: `plan-${Date.now()}` },
          ],
        })),

      updatePlannedPurchase: (updatedP) =>
        set((state) => ({
          plannedPurchases: state.plannedPurchases.map((p) =>
            p.id === updatedP.id ? updatedP : p
          ),
        })),

      deletePlannedPurchase: (id) =>
        set((state) => ({
          plannedPurchases: state.plannedPurchases.filter((p) => p.id !== id),
        })),

      executePlannedPurchase: (id, paymentMethod, installments = 1) =>
        set((state) => {
          const item = state.plannedPurchases.find((p) => p.id === id);
          if (!item || item.estimatedCost <= 0) return state;

          const today = getTodayISO();

          // 1. Add completed expense transaction
          const newTx: Transaction = {
            id: `tx-${Date.now()}`,
            description: `Compra Planeada: ${item.name}`,
            amount: item.estimatedCost,
            type: 'gasto',
            category: item.category || 'Personal',
            date: today,
            paymentMethod,
            installments:
              paymentMethod === 'tarjeta_credito' && installments > 1
                ? { current: 1, total: installments }
                : undefined,
            status: 'completado',
          };

          // 2. Mark planned purchase as purchased
          const updatedPlans = state.plannedPurchases.map((p) =>
            p.id === id ? { ...p, isPurchased: true } : p
          );

          // 3. Update account balance if paid via debit/efectivo
          const updatedAccounts = state.accounts.map((a) => {
            if (
              (a.type === 'efectivo' && paymentMethod === 'efectivo') ||
              (a.isMain && paymentMethod === 'debito')
            ) {
              return { ...a, balance: Math.max(0, a.balance - item.estimatedCost) };
            }
            return a;
          });

          const mainAcc = updatedAccounts.find((a) => a.isMain);

          return {
            transactions: [newTx, ...state.transactions],
            plannedPurchases: updatedPlans,
            accounts: updatedAccounts,
            initialBalance: mainAcc ? mainAcc.balance : state.initialBalance,
          };
        }),

      // Transactions
      addTransaction: (newT) =>
        set((state) => {
          const transaction: Transaction = {
            ...newT,
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          };

          const delta = newT.type === 'ingreso' ? newT.amount : -newT.amount;

          const updatedAccounts = state.accounts.map((a) => {
            // Match explicitly by accountId if supplied
            if (newT.accountId && a.id === newT.accountId) {
              return { ...a, balance: Math.max(0, a.balance + delta) };
            }
            // Otherwise match by payment method or account type
            if (!newT.accountId) {
              if (a.type === 'efectivo' && newT.paymentMethod === 'efectivo') {
                return { ...a, balance: Math.max(0, a.balance + delta) };
              }
              if (a.id === 'nequi' && newT.paymentMethod === 'transferencia') {
                return { ...a, balance: Math.max(0, a.balance + delta) };
              }
              if (a.isMain && (newT.paymentMethod === 'debito' || newT.paymentMethod === 'transferencia')) {
                return { ...a, balance: Math.max(0, a.balance + delta) };
              }
            }
            return a;
          });

          const mainAcc = updatedAccounts.find((a) => a.isMain);

          return {
            transactions: [transaction, ...state.transactions],
            accounts: updatedAccounts,
            initialBalance: mainAcc ? mainAcc.balance : state.initialBalance,
          };
        }),

      updateTransaction: (updatedT) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === updatedT.id ? updatedT : t)),
        })),

      deleteTransaction: (id) =>
        set((state) => {
          const txToDelete = state.transactions.find((t) => t.id === id);
          let updatedAccounts = state.accounts;

          if (txToDelete && txToDelete.status === 'completado') {
            // Reverse the effect on the account
            const reverseDelta = txToDelete.type === 'ingreso' ? -txToDelete.amount : txToDelete.amount;
            updatedAccounts = state.accounts.map((a) => {
              if (txToDelete.accountId && a.id === txToDelete.accountId) {
                return { ...a, balance: Math.max(0, a.balance + reverseDelta) };
              }
              if (!txToDelete.accountId) {
                if (a.type === 'efectivo' && txToDelete.paymentMethod === 'efectivo') {
                  return { ...a, balance: Math.max(0, a.balance + reverseDelta) };
                }
                if (a.isMain && (txToDelete.paymentMethod === 'debito' || txToDelete.paymentMethod === 'transferencia')) {
                  return { ...a, balance: Math.max(0, a.balance + reverseDelta) };
                }
              }
              return a;
            });
          }

          const mainAcc = updatedAccounts.find((a) => a.isMain);

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
            initialBalance: mainAcc ? mainAcc.balance : state.initialBalance,
          };
        }),

      // Obligations
      addObligation: (newO) =>
        set((state) => {
          const obligation: Obligation = {
            ...newO,
            id: `obl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          };
          return { obligations: [...state.obligations, obligation] };
        }),

      updateObligation: (updatedO) =>
        set((state) => ({
          obligations: state.obligations.map((o) => (o.id === updatedO.id ? updatedO : o)),
        })),

      markObligationPaid: (id, isPaid = true) =>
        set((state) => ({
          obligations: state.obligations.map((o) => (o.id === id ? { ...o, isPaid } : o)),
        })),

      deleteObligation: (id) =>
        set((state) => ({
          obligations: state.obligations.filter((o) => o.id !== id),
        })),

      // Credit Cards
      addCreditCard: (newC) =>
        set((state) => ({
          creditCards: [...state.creditCards, { ...newC, id: `card-${Date.now()}` }],
        })),

      deleteCreditCard: (id) =>
        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        })),

      // Budgets
      updateBudget: (updatedB) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.category === updatedB.category ? updatedB : b
          ),
        })),

      // Goals
      addGoal: (newG) =>
        set((state) => ({
          goals: [...state.goals, { ...newG, id: `goal-${Date.now()}` }],
        })),

      updateGoalAmount: (id, currentAmount) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      // Vehicle Logs
      addVehicleLog: (newV) =>
        set((state) => ({
          vehicleLogs: [{ ...newV, id: `veh-${Date.now()}` }, ...state.vehicleLogs],
        })),

      deleteVehicleLog: (id) =>
        set((state) => ({
          vehicleLogs: state.vehicleLogs.filter((v) => v.id !== id),
        })),

      // Scenarios
      addScenario: (newS) =>
        set((state) => ({
          scenarios: [...state.scenarios, { ...newS, id: `scen-${Date.now()}` }],
        })),

      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),

      // Storage & Export/Import
      exportJSON: () => {
        const state = get();
        const exportData = {
          initialBalance: state.initialBalance,
          dineroApartado: state.dineroApartado,
          accounts: state.accounts,
          transactions: state.transactions,
          creditCards: state.creditCards,
          obligations: state.obligations,
          budgets: state.budgets,
          goals: state.goals,
          vehicleLogs: state.vehicleLogs,
          debts: state.debts,
          plannedPurchases: state.plannedPurchases,
          exportDate: new Date().toISOString(),
          version: 'v10',
        };
        return JSON.stringify(exportData, null, 2);
      },

      importJSON: (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);
          if (data.initialBalance !== undefined) {
            set({
              initialBalance: data.initialBalance || INITIAL_BASE_BALANCE,
              dineroApartado: data.dineroApartado || 0,
              accounts: data.accounts || SEED_ACCOUNTS,
              transactions: data.transactions || [],
              creditCards: data.creditCards || [],
              obligations: data.obligations || [],
              budgets: data.budgets || [],
              goals: data.goals || [],
              vehicleLogs: data.vehicleLogs || [],
              debts: data.debts || [],
              plannedPurchases: data.plannedPurchases || SEED_PLANNED_PURCHASES,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      exportCSV: () => {
        const state = get();
        const headers = [
          'ID',
          'Fecha',
          'Descripción',
          'Monto',
          'Tipo',
          'Categoría',
          'Método Pago',
          'Estado',
        ];
        const rows = state.transactions.map((t) => [
          t.id,
          t.date,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount,
          t.type,
          t.category,
          t.paymentMethod,
          t.status,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      },

      // Debts Actions
      aboneDebt: (debtId, amount, accountId = 'bancolombia', customNote) =>
        set((state) => {
          const debt = state.debts.find((d) => d.id === debtId);
          if (!debt || amount <= 0) return state;

          const newPaid = debt.amountPaid + amount;
          const newPending = Math.max(0, debt.pendingAmount - amount);

          const updatedDebts = state.debts.map((d) =>
            d.id === debtId
              ? {
                  ...d,
                  amountPaid: newPaid,
                  pendingAmount: newPending,
                  statusText:
                    newPending === 0
                      ? '🎉 ¡DEUDA 100% SALDADA!'
                      : d.statusText,
                }
              : d
          );

          // Register transaction
          const newTx: Transaction = {
            id: `tx-abono-${Date.now()}`,
            description: customNote || `Abono a deuda: ${debt.name}`,
            amount,
            type: 'gasto',
            category: 'Servicios',
            date: getTodayISO(),
            paymentMethod: accountId === 'efectivo' ? 'efectivo' : 'debito',
            accountId,
            status: 'completado',
          };

          // Deduct from account
          const updatedAccounts = state.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: Math.max(0, a.balance - amount) } : a
          );

          return {
            debts: updatedDebts,
            transactions: [newTx, ...state.transactions],
            accounts: updatedAccounts,
          };
        }),

      updateDebt: (updatedDebt) =>
        set((state) => ({
          debts: state.debts.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)),
        })),

      resetToSeedData: () => {
        set({
          initialBalance: INITIAL_BASE_BALANCE,
          dineroApartado: INITIAL_RESERVED_AMOUNT,
          accounts: SEED_ACCOUNTS,
          transactions: SEED_TRANSACTIONS,
          creditCards: SEED_CREDIT_CARDS,
          obligations: SEED_OBLIGATIONS,
          budgets: SEED_BUDGETS,
          goals: SEED_GOALS,
          vehicleLogs: SEED_VEHICLE_LOGS,
          debts: SEED_DEBTS,
          plannedPurchases: SEED_PLANNED_PURCHASES,
          scenarios: [],
        });
      },

      clearAllData: () => {
        set({
          initialBalance: 0,
          dineroApartado: 0,
          accounts: [],
          transactions: [],
          creditCards: [],
          obligations: [],
          budgets: [],
          goals: [],
          vehicleLogs: [],
          debts: [],
          plannedPurchases: [],
          scenarios: [],
        });
      },
    }),
    {
      name: 'svr-finanzas-storage-main',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          const mainData = localStorage.getItem(name);
          if (mainData) return mainData;

          // Automatic fallback migration to recover any past transactions from previous keys
          const legacyKeys = [
            'app-gastos-finance-store-v13',
            'app-gastos-finance-store-v12',
            'app-gastos-finance-store-v11',
            'app-gastos-finance-store-v10',
            'app-gastos-finance-store-v9',
            'app-gastos-finance-store-v8',
            'app-gastos-finance-store-v7',
          ];

          for (const key of legacyKeys) {
            const legacyData = localStorage.getItem(key);
            if (legacyData) {
              try {
                const parsed = JSON.parse(legacyData);
                if (parsed?.state?.transactions?.length > 0 || parsed?.state?.accounts?.length > 0) {
                  localStorage.setItem(name, legacyData);
                  return legacyData;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
          return null;
        },
        setItem: (name: string, value: string) => {
          localStorage.setItem(name, value);
          // Also keep in v13 for backward safety
          localStorage.setItem('app-gastos-finance-store-v13', value);
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure new structured debts exist in state if missing or outdated
          if (!state.debts || state.debts.length < SEED_DEBTS.length) {
            state.debts = SEED_DEBTS;
          }
        }
      },
    }
  )
);

