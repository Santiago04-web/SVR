import React from 'react';
import {
  Wallet,
  Lock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  EyeOff,
  Bot,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';
import { getGreeting, formatDateShort, getFormattedTodayLong, getTodayISO } from '../../utils/dates';
import { Tooltip } from '../ui/Tooltip';
import { AccountsCard } from './AccountsCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface OverviewViewProps {
  onOpenQuickAdd: () => void;
  onOpenAi?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onOpenQuickAdd, onOpenAi }) => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    accounts,
    initialBalance,
    dineroApartado,
    budgets,
    isPrivacyMode,
    togglePrivacyMode,
    setActiveView,
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

  const greeting = getGreeting();
  const todayISO = getTodayISO();
  const currentMonthStr = todayISO.substring(0, 7);

  // Obligaciones del mes actual pendientes
  const currentMonthObligations = obligations.filter(
    (o) => !o.isPaid && o.dueDate.startsWith(currentMonthStr)
  );
  const totalMonthPending = currentMonthObligations.reduce((sum, o) => sum + o.amount, 0);

  const chartData = [
    { period: '16 Sep', SaldoReal: 656000, Proyeccion: 656000 },
    { period: '30 Sep', SaldoReal: null, Proyeccion: 880000 },
    { period: '15 Oct', SaldoReal: null, Proyeccion: 1200000 },
    { period: '30 Oct', SaldoReal: null, Proyeccion: 950000 },
    { period: '15 Nov', SaldoReal: null, Proyeccion: 1350000 },
    { period: '30 Nov', SaldoReal: null, Proyeccion: 1100000 },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header & Privacy Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SVR Finanzas"
            className="w-11 h-11 rounded-2xl object-cover border border-teal-500/30 shadow-lg shadow-teal-500/10 lg:hidden"
          />
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {greeting}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
              SVR Finanzas • {getFormattedTodayLong()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Assistant Header Button */}
          {onOpenAi && (
            <button
              onClick={onOpenAi}
              className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm"
              title="Abrir Asistente IA"
            >
              <Bot size={18} className="text-purple-400" />
              <span className="hidden sm:inline">IA Asistente</span>
            </button>
          )}

          {/* Eye Privacy Button for Mobile / Header */}
          <button
            onClick={togglePrivacyMode}
            className={`p-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all ${
              isPrivacyMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
            title="Modo Privacidad (Ocultar cifras)"
          >
            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="hidden sm:inline">
              {isPrivacyMode ? 'Oculto' : 'Privacidad'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Financial Triad Cards - STRICT MATHEMATICAL ACCURACY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Disponible */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              Saldo disponible
              <Tooltip content="Suma total de tu dinero real disponible en todas tus cuentas (Bancolombia, Nequi, Efectivo, Nu)." />
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCOP(summary.saldoDisponible, false, isPrivacyMode)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight size={14} />
            <span>4 Cuentas combinadas al día</span>
          </div>
        </div>

        {/* Dinero Apartado */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden group border border-amber-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
              Dinero apartado
              <Tooltip content="Dinero que actualmente tienes pero ya reservaste para una obligación específica." />
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Lock size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {formatCOP(summary.dineroApartado, false, isPrivacyMode)}
          </div>
          <div className="mt-3 text-xs text-amber-300 font-semibold flex items-center gap-1">
            <Lock size={14} />
            <span>{summary.dineroApartado > 0 ? 'Reserva activa' : 'Sin reservas pendientes'}</span>
          </div>
        </div>

        {/* Realmente libre */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden border border-emerald-500/30 group bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              Realmente libre
              <Tooltip content="Saldo disponible total menos dinero apartado." />
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {formatCOP(summary.realmenteLibre, false, isPrivacyMode)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
            <span>Margen mecatos/diario</span>
            <span className="font-bold text-emerald-400">
              {formatCOP(summary.puedesGastarHoy, false, isPrivacyMode)} / día
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por Bancos y Bolsillos */}
      <AccountsCard />

      {/* OBLIGACIONES DEL MES ACTUAL */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              OBLIGACIONES DEL MES ACTUAL (SEPTIEMBRE)
            </h3>
            <p className="text-xs text-slate-400">
              Total pendiente este mes: <span className="text-amber-400 font-bold">{formatCOP(totalMonthPending, false, isPrivacyMode)}</span> (Pagos del 17 al 30 de Sep)
            </p>
          </div>
          <button
            onClick={() => setActiveView('calendario')}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Ver Calendario Completo →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {currentMonthObligations.map((obl) => (
            <div
              key={obl.id}
              className="glass-card p-4 rounded-xl space-y-2 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {obl.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {formatDateShort(obl.dueDate)}
                </span>
              </div>
              <div className="text-base font-black text-white">
                {formatCOP(obl.amount, false, isPrivacyMode)}
              </div>
              <div className="text-[11px] text-slate-400">
                {obl.category} • Vence en el mes
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proyección (Totalmente Separada del Saldo Real) */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" />
              PROYECCIÓN DE CRECIMIENTO (SIMULACIÓN)
            </h3>
            <p className="text-xs text-slate-400">
              Basada en Nómina ($1.360.000/mes) + Uber estimado - Obligaciones reales.
            </p>
          </div>
          <button
            onClick={() => setActiveView('proyecciones')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all self-start sm:self-auto"
          >
            Ver Proyección Completa →
          </button>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(value: any) => [formatCOP(Number(value), false, isPrivacyMode), 'Saldo Proyectado']}
              />
              <Area
                type="monotone"
                dataKey="Proyeccion"
                stroke="#818cf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#projGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white tracking-tight">
            ACTIVIDAD RECIENTE
          </h3>
          <button
            onClick={() => setActiveView('movimientos')}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Ver Movimientos →
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden p-6 text-center space-y-3">
          {transactions.length === 0 ? (
            <>
              <Clock size={32} className="mx-auto text-slate-600" />
              <h4 className="text-sm font-bold text-white">Sin movimientos registrados hoy (16 Sep)</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tu saldo inicial disponible es <strong>$507.000</strong>. Cada vez que hagas Uber o realices un gasto, usa el botón <strong>'+'</strong> para registrarlo y tu saldo se actualizará automáticamente.
              </p>
              <button
                onClick={onOpenQuickAdd}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
              >
                <Plus size={16} />
                <span>Registrar Primer Movimiento</span>
              </button>
            </>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 flex items-center justify-between text-left"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{tx.description}</h5>
                    <span className="text-[10px] text-slate-400">{tx.category}</span>
                  </div>
                  <div
                    className={`text-xs font-bold ${
                      tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {formatCOP(tx.amount, true, isPrivacyMode)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
