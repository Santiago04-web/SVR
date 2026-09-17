import React, { useState, useEffect } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Calendar,
  Lock,
  Trash2,
  Flame,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  ArrowRight,
  DollarSign,
  Wallet,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateCardCycleInfo } from '../../domain/creditCardEngine';
import { formatCOP, formatPercentage } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { formatDateShort } from '../../utils/dates';
import type { Debt } from '../../types/finance';

export const TarjetasView: React.FC = () => {
  const {
    creditCards,
    transactions,
    debts,
    accounts,
    addCreditCard,
    deleteCreditCard,
    aboneDebt,
    syncDebts,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'deudas' | 'tarjetas'>('deudas');

  // Auto-sync debts if not all 5 are loaded
  useEffect(() => {
    if (!debts || debts.length < 5) {
      syncDebts();
    }
  }, [debts, syncDebts]);

  // Add Card State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [cutoffDay, setCutoffDay] = useState('25');
  const [paymentDueDay, setPaymentDueDay] = useState('15');
  const [lastFour, setLastFour] = useState('');

  // Abono Modal State
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('bancolombia');
  const [abonoSuccessMsg, setAbonoSuccessMsg] = useState<string | null>(null);

  const totalOriginalDebt = debts.reduce((sum, d) => sum + d.totalCost, 0);
  const totalPaidDebt = debts.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalPendingDebt = debts.reduce((sum, d) => sum + d.pendingAmount, 0);
  const globalProgress = totalOriginalDebt > 0 ? (totalPaidDebt / totalOriginalDebt) * 100 : 0;

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(totalLimit);
    if (!name || isNaN(limitNum)) return;

    addCreditCard({
      name,
      bank: bank || name,
      totalLimit: limitNum,
      cutoffDay: parseInt(cutoffDay) || 25,
      paymentDueDay: parseInt(paymentDueDay) || 15,
      color: 'from-purple-600 to-indigo-800',
      lastFourDigits: lastFour || '0000',
    });

    setName('');
    setBank('');
    setTotalLimit('');
    setLastFour('');
    setIsAddModalOpen(false);
  };

  const handleExecuteAbono = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(abonoAmount);
    if (!selectedDebt || isNaN(amt) || amt <= 0) return;

    aboneDebt(selectedDebt.id, amt, selectedAccount);
    setAbonoSuccessMsg(`¡Abono de ${formatCOP(amt)} registrado con éxito!`);
    setTimeout(() => {
      setAbonoSuccessMsg(null);
      setSelectedDebt(null);
      setAbonoAmount('');
    }, 1800);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Flame className="text-amber-400" />
            Deudas & Tarjetas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ruta de amortización rápida para liquidar deudas y liberar flujo de caja
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('deudas')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'deudas'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={15} />
            <span>Plan de Deudas ({debts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tarjetas')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'tarjetas'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CardIcon size={15} />
            <span>Tarjetas de Crédito ({creditCards.length})</span>
          </button>

          <button
            onClick={() => syncDebts()}
            title="Recargar las 5 deudas con sus datos oficiales"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-all text-xs flex items-center gap-1"
          >
            <RefreshCw size={14} />
            <span className="hidden md:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEUDAS & PLAN DE AMORTIZACIÓN */}
      {activeTab === 'deudas' && (
        <div className="space-y-6">
          {/* Global Summary Card */}
          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/20 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  Progreso Global de Liquidación
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Has pagado el {globalProgress.toFixed(1)}% de tus deudas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Al terminar de pagar todas estas deudas, liberarás más de <strong>$846.000/mes</strong> en tu sueldo.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Deuda Restante Total</span>
                <div className="text-2xl font-black text-amber-400">
                  {formatCOP(totalPendingDebt)}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {formatCOP(totalPaidDebt)} ya amortizados
                </span>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Total Amortizado: {formatCOP(totalPaidDebt)}</span>
                <span className="text-amber-400">Meta: $0 Deudas</span>
              </div>
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 rounded-full transition-all duration-700 shadow-lg shadow-amber-500/20"
                  style={{ width: `${Math.min(100, Math.max(2, globalProgress))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Individual Debts Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {debts.map((debt) => {
              const progress = debt.totalCost > 0 ? (debt.amountPaid / debt.totalCost) * 100 : 0;
              const isPaidOff = debt.pendingAmount === 0;

              return (
                <div
                  key={debt.id}
                  className={`glass-card p-6 rounded-3xl space-y-4 border transition-all ${
                    isPaidOff
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-amber-500/40 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>{debt.name}</span>
                        {isPaidOff && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                            SALDADA
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {debt.statusText}
                      </p>
                    </div>

                    <button
                      disabled={isPaidOff}
                      onClick={() => {
                        setSelectedDebt(debt);
                        setAbonoAmount(debt.pendingAmount.toString());
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Abonar / Liquidar
                    </button>
                  </div>

                  {/* Amounts Breakdown */}
                  <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Monto Total</span>
                      <div className="text-xs font-black text-slate-200 mt-0.5">
                        {formatCOP(debt.totalCost)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Abonado</span>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">
                        {formatCOP(debt.amountPaid)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Pendiente</span>
                      <div className="text-xs font-black text-amber-400 mt-0.5">
                        {formatCOP(debt.pendingAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-400">Progreso de Pago</span>
                      <span className={progress >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TARJETAS DE CRÉDITO */}
      {activeTab === 'tarjetas' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Agregar Tarjeta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creditCards.map((card) => {
              const info = calculateCardCycleInfo(card, transactions);
              return (
                <div
                  key={card.id}
                  className="glass-card p-6 rounded-3xl space-y-6 relative overflow-hidden border border-slate-700/80"
                >
                  <div
                    className={`p-5 rounded-2xl bg-gradient-to-r ${card.color} shadow-xl relative overflow-hidden text-white flex flex-col justify-between h-44`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm tracking-wide uppercase opacity-90">
                        {card.bank}
                      </span>
                      <button
                        onClick={() => deleteCreditCard(card.id)}
                        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-lg font-black tracking-tight">{card.name}</h4>
                      <p className="text-xs font-mono opacity-80 mt-0.5">
                        •••• •••• •••• {card.lastFourDigits || '4821'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/20 pt-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider opacity-75">
                          Cupo Utilizado
                        </span>
                        <div className="text-base font-extrabold">
                          {formatCOP(info.usedQuota)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider opacity-75">
                          Cupo Total
                        </span>
                        <div className="text-sm font-bold opacity-95">
                          {formatCOP(card.totalLimit)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Uso de Cupo</span>
                        <span className="text-purple-400">
                          {formatPercentage(info.utilizationPercentage)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, info.utilizationPercentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={13} className="text-purple-400" /> Fecha de Corte
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          Día {card.cutoffDay} ({formatDateShort(info.nextCutoffDate)})
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Lock size={13} className="text-amber-400" /> Próximo Pago
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          Día {card.paymentDueDay} ({formatDateShort(info.nextPaymentDueDate)})
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs">
                      <span className="text-purple-200 font-semibold">
                        Cuota mensual sumada ({info.activeInstallmentsCount} compras):
                      </span>
                      <span className="text-sm font-black text-purple-400">
                        {formatCOP(info.monthlyInstallmentSum)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Realizar Abono a Deuda */}
      {selectedDebt && (
        <Modal
          isOpen={!!selectedDebt}
          onClose={() => setSelectedDebt(null)}
          title={`Abonar a ${selectedDebt.name}`}
          subtitle={`Saldo pendiente actual: ${formatCOP(selectedDebt.pendingAmount)}`}
        >
          {abonoSuccessMsg ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-center font-bold text-xs animate-in fade-in">
              {abonoSuccessMsg}
            </div>
          ) : (
            <form onSubmit={handleExecuteAbono} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto a Abonar (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={selectedDebt.pendingAmount}
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setAbonoAmount('50000')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white"
                  >
                    +$50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount('100000')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white"
                  >
                    +$100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount(selectedDebt.pendingAmount.toString())}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 hover:text-white"
                  >
                    Liquidar Todo ({formatCOP(selectedDebt.pendingAmount)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descontar de la Cuenta:
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatCOP(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Confirmar y Descontar
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Modal: Agregar Tarjeta */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Nueva Tarjeta"
        subtitle="Configura los parámetros financieros de tu tarjeta de crédito"
      >
        <form onSubmit={handleAddCardSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre de la Tarjeta
            </label>
            <input
              type="text"
              required
              placeholder="ej. Visa Oro, Master Black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Banco / Entidad
              </label>
              <input
                type="text"
                placeholder="ej. Nu, Bancolombia"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cupo Total (COP)
              </label>
              <input
                type="number"
                required
                placeholder="3000000"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Día de Corte
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Día de Pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Últimos 4 dígitos
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="4821"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
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
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
            >
              Guardar Tarjeta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
