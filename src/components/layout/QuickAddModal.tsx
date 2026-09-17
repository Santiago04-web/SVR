import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useFinanceStore } from '../../store/useFinanceStore';
import type { Category, PaymentMethod, TransactionType } from '../../types/finance';
import { getTodayISO } from '../../utils/dates';
import { parseBankNotification } from '../../domain/bankParser';
import { Sparkles, CheckCircle2, Zap, Car, Fuel, Utensils, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCOP } from '../../utils/formatters';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, creditCards } = useFinanceStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('gasto');
  const [category, setCategory] = useState<Category>('Comida');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [installments, setInstallments] = useState('1');
  const [date, setDate] = useState(getTodayISO());

  // Smart SMS paste state
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  const categories: Category[] = [
    'Comida',
    'Transporte',
    'Personal',
    'Moto',
    'Servicios',
    'Tarjeta',
    'Universidad',
    'Gym',
    'Suscripciones',
    'Vivienda',
    'Salud',
    'Educación',
    'Ahorro',
    'Otros',
  ];

  // Sleek 1-Tap Presets Grid with Lucide Icons
  const QUICK_SHORTCUTS = [
    {
      title: 'Uber $50k',
      subtitle: 'Ingreso Uber',
      amount: 50000,
      type: 'ingreso' as TransactionType,
      cat: 'Transporte' as Category,
      pm: 'efectivo' as PaymentMethod,
      icon: Car,
      color: 'emerald',
    },
    {
      title: 'Uber $70k',
      subtitle: 'Ingreso Uber',
      amount: 70000,
      type: 'ingreso' as TransactionType,
      cat: 'Transporte' as Category,
      pm: 'efectivo' as PaymentMethod,
      icon: Car,
      color: 'emerald',
    },
    {
      title: 'Gasolina $15k',
      subtitle: 'Moto Terpel',
      amount: 15000,
      type: 'gasto' as TransactionType,
      cat: 'Moto' as Category,
      pm: 'debito' as PaymentMethod,
      icon: Fuel,
      color: 'rose',
    },
    {
      title: 'Gasolina $50k',
      subtitle: 'Tanqueda Full',
      amount: 50000,
      type: 'gasto' as TransactionType,
      cat: 'Moto' as Category,
      pm: 'debito' as PaymentMethod,
      icon: Fuel,
      color: 'rose',
    },
    {
      title: 'Almuerzo $15k',
      subtitle: 'Almuerzo Día',
      amount: 15000,
      type: 'gasto' as TransactionType,
      cat: 'Comida' as Category,
      pm: 'efectivo' as PaymentMethod,
      icon: Utensils,
      color: 'rose',
    },
  ];

  const handleApplyShortcut = (sc: (typeof QUICK_SHORTCUTS)[0]) => {
    addTransaction({
      description: sc.subtitle,
      amount: sc.amount,
      type: sc.type,
      category: sc.cat,
      date: getTodayISO(),
      paymentMethod: sc.pm,
      status: 'completado',
    });
    onClose();
  };

  const handleSmartParse = () => {
    const parsed = parseBankNotification(pastedText);
    if (parsed && parsed.amount > 0) {
      setDescription(parsed.description);
      setAmount(parsed.amount.toString());
      setCategory(parsed.category);
      setPaymentMethod(parsed.paymentMethod);
      setType(parsed.type);

      if (parsed.lastFourDigits) {
        const matchingCard = creditCards.find(
          (c) => c.lastFourDigits === parsed.lastFourDigits
        );
        if (matchingCard) setCreditCardId(matchingCard.id);
      }

      setParseNotice(
        `✨ Detectado: ${parsed.description} (${formatCOP(parsed.amount)}) en ${parsed.category}`
      );
      setPasteMode(false);
      setPastedText('');
    } else {
      setParseNotice('⚠️ No se pudo extraer la información del texto pegado.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || !description.trim()) {
      return;
    }

    addTransaction({
      description: description.trim(),
      amount: numericAmount,
      type,
      category,
      date,
      paymentMethod,
      creditCardId: paymentMethod === 'tarjeta_credito' ? creditCardId : undefined,
      installments:
        paymentMethod === 'tarjeta_credito' && parseInt(installments) > 1
          ? { current: 1, total: parseInt(installments) }
          : undefined,
      status: 'completado',
    });

    // Reset fields
    setDescription('');
    setAmount('');
    setParseNotice(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento"
      subtitle="Acciones rápidas de 1-Tap, pegar SMS bancario o registro manual"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 pt-1">
        {/* Sleek 1-Tap Shortcuts Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" /> REGISTROS RÁPIDOS EN 1-TAP
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_SHORTCUTS.map((sc, idx) => {
              const Icon = sc.icon;
              const isIncome = sc.type === 'ingreso';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyShortcut(sc)}
                  className={`p-2.5 rounded-2xl border text-left transition-all group flex items-center justify-between ${
                    isIncome
                      ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {sc.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {sc.subtitle}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`shrink-0 ${
                      isIncome ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Bank SMS Banner Launcher */}
        {!pasteMode ? (
          <button
            type="button"
            onClick={() => setPasteMode(true)}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-between hover:border-purple-400 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span>Pegar Notificación Bancaria (Bancolombia, Nu, Davivienda, Addi)</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Auto-Detectar
            </span>
          </button>
        ) : (
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/40 rounded-2xl space-y-2.5">
            <label className="block text-xs font-bold text-purple-300">
              Pega aquí el SMS o notificación de tu banco:
            </label>
            <textarea
              rows={2}
              placeholder="ej: Bancolombia: Compraste $40.000,00 en DISTRACOM APOLO con tu T.Deb *1329..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteMode(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSmartParse}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20"
              >
                Procesar Notificación
              </button>
            </div>
          </div>
        )}

        {parseNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{parseNotice}</span>
          </div>
        )}

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('gasto')}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                type === 'gasto'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('ingreso')}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                type === 'ingreso'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🟢 Ingreso
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Descripción / Comercio
            </label>
            <input
              type="text"
              required
              placeholder="ej. Uber, Mercado, Gasolina"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Monto (COP)
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="debito">Débito / Cuenta</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_credito">Tarjeta de Crédito</option>
                <option value="addi">Addi / Crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          {/* Credit Card Specific Options */}
          {paymentMethod === 'tarjeta_credito' && (
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Seleccionar Tarjeta
                </label>
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} (..{card.lastFourDigits})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Número de Cuotas
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Guardar Movimiento
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
