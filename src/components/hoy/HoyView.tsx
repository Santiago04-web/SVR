import React from 'react';
import {
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Coins,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO, formatDateShort } from '../../utils/dates';
import { UberNetCalculator } from './UberNetCalculator';

export const HoyView: React.FC = () => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    accounts,
    initialBalance,
    dineroApartado,
    isPrivacyMode,
    togglePrivacyMode,
    markObligationPaid,
  } = useFinanceStore();

  const summary = calculateFinancialSummary(
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
    accounts
  );

  const todayISO = getTodayISO();

  // Transactions belonging to today
  const todayTransactions = transactions.filter((t) => t.date === todayISO);
  const todayIncome = todayTransactions
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter((t) => t.type === 'gasto')
    .reduce((sum, t) => sum + t.amount, 0);

  // Next immediate obligation
  const nextObligation = obligations
    .filter((o) => !o.isPaid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">HOY</h2>
            <p className="text-xs text-slate-400 font-medium">
              Consulta diaria rápida (Bancolombia)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePrivacyMode}
            className={`p-2 rounded-xl transition-all ${
              isPrivacyMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Modo Privacidad"
          >
            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {formatDateShort(todayISO)}
          </span>
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-700/80 space-y-4 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
            Saldo Disponible Bancolombia
          </span>
          <div className="text-4xl font-black text-white tracking-tight mt-1">
            {formatCOP(summary.saldoDisponible, false, isPrivacyMode)}
          </div>
          {summary.dineroApartado > 0 && (
            <div className="text-xs text-amber-400 mt-1 font-semibold flex items-center justify-center gap-1">
              <Lock size={13} /> {formatCOP(summary.dineroApartado, false, isPrivacyMode)} dinero apartado
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-2">
          <Coins size={18} className="text-emerald-400" />
          <span className="text-xs text-slate-300">Puedes gastar hoy:</span>
          <span className="text-base font-extrabold text-emerald-400">
            {formatCOP(summary.puedesGastarHoy, false, isPrivacyMode)}
          </span>
        </div>
      </div>

      {/* Uber Net Calculator Widget */}
      <UberNetCalculator />

      {/* Today's Cashflow summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
            <span>Hoy entra</span>
            <ArrowUpRight size={16} />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCOP(todayIncome, true, isPrivacyMode)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {todayTransactions.filter((t) => t.type === 'ingreso').length} registro(s)
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold mb-1">
            <span>Hoy sale</span>
            <ArrowDownRight size={16} />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCOP(-todayExpense, true, isPrivacyMode)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {todayTransactions.filter((t) => t.type === 'gasto').length} registro(s)
          </div>
        </div>
      </div>

      {/* Next Immediate Obligation Card */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold text-slate-400 flex items-center gap-1.5">
            <Calendar size={15} className="text-amber-400" />
            Próximo Pago Inmediato
          </span>
          {nextObligation && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
              {formatDateShort(nextObligation.dueDate)}
            </span>
          )}
        </div>

        {nextObligation ? (
          <div className="flex items-center justify-between pt-1">
            <div>
              <h4 className="text-base font-bold text-white">
                {nextObligation.title}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Categoría: {nextObligation.category}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-white">
                {nextObligation.amount > 0
                  ? formatCOP(nextObligation.amount, false, isPrivacyMode)
                  : 'Pendiente confirmar'}
              </div>
              {nextObligation.amount > 0 && (
                <button
                  onClick={() => markObligationPaid(nextObligation.id, true)}
                  className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                >
                  <CheckCircle2 size={13} />
                  <span>Marcar Pagado</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            🎉 ¡No hay pagos pendientes!
          </div>
        )}
      </div>
    </div>
  );
};
