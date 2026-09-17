import React, { useState } from 'react';
import { Target, Plus, Sparkles, CheckCircle2, Trash2, Zap, TrendingUp, PiggyBank, ShoppingBag } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP, formatPercentage } from '../../utils/formatters';
import { formatDateShort, getTodayISO, getRemainingDaysInMonth } from '../../utils/dates';
import { Category } from '../../types/finance';
import { Modal } from '../ui/Modal';
import confetti from 'canvas-confetti';

const NOMINA_QUINCENAL = 680000;

export const ObjetivosView: React.FC = () => {
  const {
    goals,
    addGoal,
    updateGoalAmount,
    deleteGoal,
    accounts,
    obligations,
    debts,
    plannedPurchases,
    isPrivacyMode,
  } = useFinanceStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Category>('Ahorro');
  const [monthlyContribution, setMonthlyContribution] = useState('');

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newAmountVal, setNewAmountVal] = useState('');

  const mask = isPrivacyMode;
  const todayISO = getTodayISO();
  const currentMonth = todayISO.substring(0, 7);

  // ===== AUTO-CÁLCULO: Capacidad de Ahorro Real =====
  const totalLiquido = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const obligMesPendientes = obligations
    .filter((o) => !o.isPaid && o.dueDate.startsWith(currentMonth) && o.amount > 0)
    .reduce((s, o) => s + o.amount, 0);

  // Después de pagar obligaciones + nómina
  const libreTrasMes = totalLiquido + NOMINA_QUINCENAL - obligMesPendientes;

  // Estimado de ahorro mensual posible (conservador: 15% del ingreso libre)
  const capacidadAhorroMensual = Math.max(0, Math.round(libreTrasMes * 0.35));
  // Uber ingreso extra estimado
  const uberMensualEstimado = 50000 * 4 * 4; // 4 días/sem × $50k × 4 sem
  const ahorroConUber = Math.max(0, Math.round((libreTrasMes + uberMensualEstimado * 0.3) * 0.25));

  // Deudas pendientes
  const totalDeudas = debts.reduce((s, d) => s + d.pendingAmount, 0);

  // Compras planeadas pendientes
  const totalComprasPlaneadas = (plannedPurchases || [])
    .filter((p) => !p.isPurchased && p.estimatedCost > 0)
    .reduce((s, p) => s + p.estimatedCost, 0);

  // Auto-sugerencia de aporte mensual para cada meta
  const getAutoContribution = (goal: typeof goals[0]) => {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining <= 0) return 0;
    const targetDateMs = new Date(goal.targetDate).getTime();
    const todayMs = new Date(todayISO).getTime();
    const monthsLeft = Math.max(1, Math.round((targetDateMs - todayMs) / (30 * 24 * 60 * 60 * 1000)));
    const idealMonthly = Math.round(remaining / monthsLeft);
    // No puede superar la capacidad de ahorro
    return Math.min(idealMonthly, capacidadAhorroMensual);
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    if (!title || isNaN(targetNum)) return;

    addGoal({
      title,
      targetAmount: targetNum,
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate || '2026-12-31',
      category,
      color: 'from-emerald-500 to-teal-700',
      monthlyContribution: parseFloat(monthlyContribution) || Math.round(targetNum / 10),
    });

    setTitle('');
    setTargetAmount('');
    setIsAddModalOpen(false);
  };

  const handleUpdateAmount = (id: string, current: number, target: number) => {
    const nextAmount = parseFloat(newAmountVal);
    if (isNaN(nextAmount)) return;

    updateGoalAmount(id, nextAmount);
    if (nextAmount >= target) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    setEditingGoalId(null);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Target className="text-emerald-400" />
            Objetivos Financieros
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Metas calculadas automáticamente según tu capacidad real de ahorro
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nuevo Objetivo</span>
        </button>
      </div>

      {/* AUTO-CÁLCULO: Tu Capacidad de Ahorro */}
      <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Tu Capacidad de Ahorro (Auto-calculada)
              <Sparkles size={16} className="text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Basada en: Saldo real ({formatCOP(totalLiquido, false, mask)}) + Nómina ({formatCOP(NOMINA_QUINCENAL, false, mask)}) - Obligaciones ({formatCOP(obligMesPendientes, false, mask)})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Libre tras obligaciones</span>
            <div className={`text-lg font-black ${libreTrasMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCOP(libreTrasMes, false, mask)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Puedes ahorrar/mes</span>
            <div className="text-lg font-black text-emerald-400">
              {formatCOP(ahorroConUber, false, mask)}
            </div>
            <span className="text-[10px] text-slate-400">~25% de tu excedente + Uber</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400">Deudas activas</span>
            <div className="text-lg font-black text-purple-400">
              {formatCOP(totalDeudas, false, mask)}
            </div>
            <span className="text-[10px] text-slate-400">Addi + Casco</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400">Compras planeadas</span>
            <div className="text-lg font-black text-indigo-400">
              {formatCOP(totalComprasPlaneadas, false, mask)}
            </div>
            <span className="text-[10px] text-slate-400">Wishlist pendiente</span>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const percent = Math.min(
            100,
            (goal.currentAmount / (goal.targetAmount || 1)) * 100
          );
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const autoContrib = getAutoContribution(goal);
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const monthsToGoal = autoContrib > 0 ? Math.ceil(remaining / autoContrib) : 0;

          return (
            <div
              key={goal.id}
              className="glass-card p-6 rounded-3xl space-y-5 border border-slate-700/80 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {goal.category}
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                    {goal.title}
                  </h3>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Amounts & Percentage */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-white">
                    {formatCOP(goal.currentAmount, false, mask)}
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    Meta: {formatCOP(goal.targetAmount, false, mask)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>{formatPercentage(percent)} completado</span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 size={13} /> ¡Logrado!
                    </span>
                  )}
                </div>
              </div>

              {/* Auto-calculated info */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Fecha Objetivo:</span>
                  <span className="font-bold">{formatDateShort(goal.targetDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-400" /> Aporte auto-calculado:
                  </span>
                  <span className="font-extrabold text-emerald-400">
                    {formatCOP(autoContrib, false, mask)}/mes
                  </span>
                </div>
                {!isCompleted && monthsToGoal > 0 && (
                  <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center gap-1.5">
                    <TrendingUp size={13} />
                    <span>
                      A {formatCOP(autoContrib, false, mask)}/mes llegas en <strong>~{monthsToGoal} {monthsToGoal === 1 ? 'mes' : 'meses'}</strong> (falta {formatCOP(remaining, false, mask)})
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setEditingGoalId(goal.id);
                    setNewAmountVal(goal.currentAmount.toString());
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Abonar / Actualizar Saldo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AUTO-SUGERENCIA: Objetivos Inteligentes */}
      {goals.length <= 1 && (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Objetivos Sugeridos (Basados en tu situación)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                addGoal({
                  title: '🛡️ Fondo de Emergencia',
                  targetAmount: 2000000,
                  currentAmount: 0,
                  targetDate: '2027-06-30',
                  category: 'Ahorro',
                  color: 'from-emerald-500 to-teal-700',
                  monthlyContribution: ahorroConUber,
                });
              }}
              className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-left space-y-2"
            >
              <div className="flex items-center gap-2">
                <PiggyBank size={18} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">Fondo de Emergencia</span>
              </div>
              <div className="text-sm font-black text-white">{formatCOP(2000000, false, mask)}</div>
              <p className="text-[10px] text-slate-400">
                A {formatCOP(ahorroConUber, false, mask)}/mes llegas en ~{ahorroConUber > 0 ? Math.ceil(2000000 / ahorroConUber) : '∞'} meses
              </p>
            </button>

            <button
              onClick={() => {
                addGoal({
                  title: '👓 Ahorrar para Gafas',
                  targetAmount: 500000,
                  currentAmount: 0,
                  targetDate: '2026-11-30',
                  category: 'Salud',
                  color: 'from-indigo-500 to-purple-700',
                  monthlyContribution: Math.min(ahorroConUber, 250000),
                });
              }}
              className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-left space-y-2"
            >
              <div className="flex items-center gap-2">
                <Target size={18} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400">Ahorrar para Gafas</span>
              </div>
              <div className="text-sm font-black text-white">{formatCOP(500000, false, mask)}</div>
              <p className="text-[10px] text-slate-400">
                Necesidad #1. A {formatCOP(Math.min(ahorroConUber, 250000), false, mask)}/mes → ~{Math.ceil(500000 / Math.max(1, Math.min(ahorroConUber, 250000)))} meses
              </p>
            </button>

            <button
              onClick={() => {
                addGoal({
                  title: '👕 Fondo Ropa',
                  targetAmount: 600000,
                  currentAmount: 0,
                  targetDate: '2027-03-31',
                  category: 'Personal',
                  color: 'from-pink-500 to-rose-700',
                  monthlyContribution: Math.round(ahorroConUber * 0.3),
                });
              }}
              className="p-4 rounded-xl bg-slate-950 border border-pink-500/20 hover:border-pink-500/40 transition-all text-left space-y-2"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-pink-400" />
                <span className="text-xs font-bold text-pink-400">Fondo Ropa</span>
              </div>
              <div className="text-sm font-black text-white">{formatCOP(600000, false, mask)}</div>
              <p className="text-[10px] text-slate-400">
                3 camisetas + 2 jeans. A {formatCOP(Math.round(ahorroConUber * 0.3), false, mask)}/mes → ~{Math.ceil(600000 / Math.max(1, Math.round(ahorroConUber * 0.3)))} meses
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Crear Objetivo Financiero"
        subtitle={`Tu capacidad de ahorro: ${formatCOP(ahorroConUber)}/mes`}
      >
        <form onSubmit={handleAddGoalSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre del Objetivo
            </label>
            <input
              type="text"
              required
              placeholder="ej. Ahorrar $2.000.000, Comprar computador"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Monto Meta (COP)
              </label>
              <input
                type="number"
                required
                placeholder="2000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Monto Actual Ahorrado
              </label>
              <input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Fecha Objetivo
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Aporte Mensual (o auto)
              </label>
              <input
                type="number"
                placeholder={`Auto: ${formatCOP(ahorroConUber)}`}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
            >
              Guardar Objetivo
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Amount Modal */}
      {editingGoalId && (
        <Modal
          isOpen={editingGoalId !== null}
          onClose={() => setEditingGoalId(null)}
          title="Abonar a Objetivo"
          subtitle="Ingresa el nuevo monto acumulado ahorrado"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nuevo Monto Acumulado (COP)
              </label>
              <input
                type="number"
                value={newAmountVal}
                onChange={(e) => setNewAmountVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingGoalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const g = goals.find((item) => item.id === editingGoalId);
                  if (g) handleUpdateAmount(g.id, g.currentAmount, g.targetAmount);
                }}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Actualizar Saldo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

