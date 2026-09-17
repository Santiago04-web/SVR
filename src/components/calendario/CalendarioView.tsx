import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Lock,
  Target,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { formatDateShort } from '../../utils/dates';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const CalendarioView: React.FC = () => {
  const { transactions, obligations, goals } = useFinanceStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Daily events calculation
  const getDayEvents = (dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd');

    const dayTx = transactions.filter((t) => t.date === dateStr);
    const dayIncome = dayTx.filter((t) => t.type === 'ingreso');
    const dayExpenses = dayTx.filter((t) => t.type === 'gasto');
    const dayCardTx = dayTx.filter((t) => t.paymentMethod === 'tarjeta_credito');
    const dayObligations = obligations.filter((o) => o.dueDate === dateStr);
    const dayGoals = goals.filter((g) => g.targetDate === dateStr);

    return {
      hasIncome: dayIncome.length > 0,
      hasExpenses: dayExpenses.length > 0,
      hasCard: dayCardTx.length > 0,
      hasObligations: dayObligations.length > 0,
      hasGoals: dayGoals.length > 0,
      incomeList: dayIncome,
      expenseList: dayExpenses,
      obligationList: dayObligations,
      goalList: dayGoals,
    };
  };

  const selectedDayEvents = getDayEvents(selectedDate);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="text-blue-400" />
            Calendario Inteligente
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualización cromática de ingresos, gastos, tarjetas y vencimientos
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ingresos
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Gastos
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Tarjetas
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Obligaciones
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Objetivos
          </span>
        </div>
      </div>

      {/* Main Grid & Details Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 glass-card p-6 rounded-3xl space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-black text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-1">
            <span>DOM</span>
            <span>LUN</span>
            <span>MAR</span>
            <span>MIÉ</span>
            <span>JUE</span>
            <span>VIE</span>
            <span>SÁB</span>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysInMonth.map((day) => {
              const events = getDayEvents(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[64px] p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all border ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-blue-400 font-extrabold' : 'text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Dot Indicators */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {events.hasIncome && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    {events.hasExpenses && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    {events.hasCard && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                    {events.hasObligations && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    {events.hasGoals && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-xs uppercase font-extrabold text-blue-400">
              Detalles del Día
            </span>
            <h3 className="text-lg font-black text-white capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {/* Income */}
            {selectedDayEvents.incomeList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight size={14} /> Ingresos del día
                </span>
                {selectedDayEvents.incomeList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">{tx.description}</span>
                    <span className="font-extrabold text-emerald-400">
                      {formatCOP(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Expenses */}
            {selectedDayEvents.expenseList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <ArrowDownRight size={14} /> Gastos del día
                </span>
                {selectedDayEvents.expenseList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">{tx.description}</span>
                    <span className="font-extrabold text-slate-200">
                      {formatCOP(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Obligations */}
            {selectedDayEvents.obligationList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  <Lock size={14} /> Obligations / Vencimientos
                </span>
                {selectedDayEvents.obligationList.map((obl) => (
                  <div
                    key={obl.id}
                    className="p-3 rounded-xl bg-slate-950 border border-blue-500/30 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">{obl.title}</span>
                    <span className="font-extrabold text-blue-400">
                      {formatCOP(obl.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!selectedDayEvents.hasIncome &&
              !selectedDayEvents.hasExpenses &&
              !selectedDayEvents.hasObligations && (
                <div className="text-center py-8 text-xs text-slate-500">
                  Sin eventos ni movimientos registrados para esta fecha.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
