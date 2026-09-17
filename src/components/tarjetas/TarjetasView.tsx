import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus, Calendar, Lock, AlertCircle, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateCardCycleInfo } from '../../domain/creditCardEngine';
import { formatCOP, formatPercentage } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { formatDateShort } from '../../utils/dates';

export const TarjetasView: React.FC = () => {
  const { creditCards, transactions, addCreditCard, deleteCreditCard } = useFinanceStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [cutoffDay, setCutoffDay] = useState('25');
  const [paymentDueDay, setPaymentDueDay] = useState('15');
  const [lastFour, setLastFour] = useState('');

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
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CardIcon className="text-purple-400" />
            Tarjetas & Créditos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de cupos, fechas de corte, cuotas y compromisos de tarjetas
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Agregar Tarjeta</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creditCards.map((card) => {
          const info = calculateCardCycleInfo(card, transactions);
          return (
            <div
              key={card.id}
              className="glass-card p-6 rounded-3xl space-y-6 relative overflow-hidden border border-slate-700/80"
            >
              {/* Credit Card Graphic Header */}
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

              {/* Progress & Cycles Info */}
              <div className="space-y-4">
                {/* Quota Progress bar */}
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

                {/* Dates & Installment summaries */}
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

                {/* Monthly Installments total for this card */}
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

      {/* Add Card Modal */}
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
              placeholder="ej. Nu Card, Bancolombia Visa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Banco / Emisor
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
