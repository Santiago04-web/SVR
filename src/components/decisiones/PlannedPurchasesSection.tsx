import React, { useState } from 'react';
import {
  ShoppingBag,
  Glasses,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  CreditCard as CreditCardIcon,
  Wallet,
  Edit3,
  Plus,
  Trash2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { analyzePlannedPurchase } from '../../domain/purchaseAnalyzer';
import { formatCOP } from '../../utils/formatters';
import { PlannedPurchase, PaymentMethod } from '../../types/finance';

export const PlannedPurchasesSection: React.FC = () => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    accounts,
    initialBalance,
    dineroApartado,
    debts,
    plannedPurchases,
    updatePlannedPurchase,
    deletePlannedPurchase,
    executePlannedPurchase,
    addPlannedPurchase,
    isPrivacyMode,
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

  // Edit price modal state
  const [editingItem, setEditingItem] = useState<PlannedPurchase | null>(null);
  const [newCostInput, setNewCostInput] = useState('');

  // Execute purchase modal state
  const [executingItem, setExecutingItem] = useState<PlannedPurchase | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('debito');
  const [selectedInstallments, setSelectedInstallments] = useState('3');

  // Add new purchase state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  // Sort purchases by Priority Rank (1 = Gafas/Necesidad first, then 2,3,4)
  const activePurchases = (plannedPurchases || [])
    .filter((p) => !p.isPurchased)
    .sort((a, b) => a.priorityRank - b.priorityRank);

  const totalKnownCost = activePurchases
    .filter((p) => !p.isPendingPrice && p.estimatedCost > 0)
    .reduce((sum, p) => sum + p.estimatedCost, 0);

  const handleOpenEditPrice = (item: PlannedPurchase) => {
    setEditingItem(item);
    setNewCostInput(item.estimatedCost ? item.estimatedCost.toString() : '');
  };

  const handleSavePrice = () => {
    if (!editingItem) return;
    const val = parseFloat(newCostInput);
    if (!isNaN(val) && val >= 0) {
      updatePlannedPurchase({
        ...editingItem,
        estimatedCost: val,
        isPendingPrice: val === 0,
      });
    }
    setEditingItem(null);
  };

  const handleConfirmExecute = () => {
    if (!executingItem) return;
    const inst = parseInt(selectedInstallments) || 1;
    executePlannedPurchase(executingItem.id, selectedMethod, inst);
    setExecutingItem(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const cost = parseFloat(newItemCost) || 0;
    addPlannedPurchase({
      name: newItemName,
      estimatedCost: cost,
      category: 'Personal',
      priorityRank: 4,
      isPendingPrice: cost === 0,
    });
    setNewItemName('');
    setNewItemCost('');
    setIsAddingNew(false);
  };

  // Interactive selected installment & method per item
  const [itemSimulations, setItemSimulations] = useState<
    Record<string, { method: PaymentMethod; installments: number }>
  >({});

  const getItemMode = (item: PlannedPurchase, defaultRecommendation: any) => {
    if (itemSimulations[item.id]) {
      return itemSimulations[item.id];
    }
    // Default based on AI recommendation
    if (defaultRecommendation.decision === 'COMPRAR_DEBITO') {
      return { method: 'debito' as PaymentMethod, installments: 1 };
    }
    const inst = defaultRecommendation.suggestedInstallments || 3;
    return { method: 'tarjeta_credito' as PaymentMethod, installments: inst };
  };

  const setItemMode = (itemId: string, method: PaymentMethod, installments: number) => {
    setItemSimulations((prev) => ({
      ...prev,
      [itemId]: { method, installments },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Compras Personales & Simulador de Cuotas
              </h3>
              <p className="text-xs text-slate-400">
                Elige cuotas interactivas, calcula el % de tu quincena y mira opciones de pago anticipado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Conocido
              </span>
              <span className="text-base font-extrabold text-indigo-400">
                {isPrivacyMode ? '$ ••••••' : formatCOP(totalKnownCost)} + Gafas
              </span>
            </div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Añadir Compra</span>
            </button>
          </div>
        </div>

        {/* Priority Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 font-extrabold text-[11px] border border-red-500/30">
              PRIORIDAD 1 (NECESIDAD)
            </span>
            <span>👓 Gafas (Salud)</span>
          </div>
          <span className="text-slate-400 hidden md:inline">
            💡 Puedes comprar en cuotas bajas y pagarlas antes de tiempo desde tu app bancaria cuando te entre dinero extra.
          </span>
        </div>
      </div>

      {/* Grid of Planned Purchases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePurchases.map((item) => {
          const recommendation = analyzePlannedPurchase(
            item,
            summary,
            obligations,
            creditCards,
            debts,
            accounts
          );

          const isUrgentNecessity = item.priorityRank === 1;
          const currentMode = getItemMode(item, recommendation);
          const isDebito = currentMode.method === 'debito';
          const selectedInst = isDebito ? 1 : currentMode.installments;
          const cuotaAmount = selectedInst > 0 ? Math.round(item.estimatedCost / selectedInst) : item.estimatedCost;
          const pctQuincena = Math.round((cuotaAmount / 680000) * 100);

          return (
            <div
              key={item.id}
              className={`glass-card p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                isUrgentNecessity
                  ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-950'
                  : 'border-slate-800 hover:border-indigo-500/30'
              }`}
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {isUrgentNecessity && (
                      <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider border border-amber-500/40">
                        Prioridad 1 • Necesidad
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditPrice(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Editar precio"
                    >
                      <Edit3 size={14} />
                    </button>
                    {!isUrgentNecessity && (
                      <button
                        onClick={() => deletePlannedPurchase(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        title="Eliminar de la lista"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <h4 className="text-base font-extrabold text-white">{item.name}</h4>
                  <span className="text-lg font-black text-indigo-400">
                    {item.isPendingPrice || item.estimatedCost === 0
                      ? 'Por definir'
                      : isPrivacyMode
                      ? '$ ••••••'
                      : formatCOP(item.estimatedCost)}
                  </span>
                </div>
              </div>

              {/* SIMULADOR INTERACTIVO DE CUOTAS */}
              {item.estimatedCost > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>SELECCIONA O ESCRIBE TUS CUOTAS:</span>
                    <span className="text-indigo-400 font-extrabold">
                      {isDebito
                        ? '🟢 Débito (1 pago)'
                        : `💳 ${selectedInst} ${selectedInst === 1 ? 'cuota' : 'cuotas'} de ${formatCOP(cuotaAmount)}/mes`}
                    </span>
                  </div>

                  {/* Chips selector + Custom number stepper */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <button
                      onClick={() => setItemMode(item.id, 'debito', 1)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                        isDebito
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      Débito
                    </button>
                    {[1, 2, 3, 6, 12, 24].map((num) => {
                      const isSelected = !isDebito && selectedInst === num;
                      return (
                        <button
                          key={num}
                          onClick={() => setItemMode(item.id, 'tarjeta_credito', num)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          {num} {num === 1 ? 'ct.' : 'cts.'}
                        </button>
                      );
                    })}

                    {/* Custom editable cuotas stepper */}
                    <div className="flex items-center gap-1 ml-auto bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold">Personalizar:</span>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={isDebito ? '' : selectedInst}
                        placeholder="ej. 8"
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setItemMode(item.id, 'tarjeta_credito', val);
                          }
                        }}
                        className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-center font-black text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">cts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Analysis Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                {/* Metric Summary Box */}
                {item.estimatedCost > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cuota mensual:</span>
                      <strong className="text-white font-black text-sm">
                        {isDebito ? formatCOP(item.estimatedCost) : formatCOP(cuotaAmount)}/mes
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Impacto Quincena:</span>
                      <strong className={`font-black text-sm ${pctQuincena > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isDebito ? '100% de golpe' : `${pctQuincena}% quincena`}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Estrategia de Prepago / Pago Anticipado */}
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    {isDebito ? (
                      <span>
                        <strong>Pagar a Débito:</strong> Descuenta el dinero de inmediato de tus cuentas ({formatCOP(summary.saldoDisponible)}). Mantienes 0 deudas en tarjetas.
                      </span>
                    ) : selectedInst === 1 ? (
                      <span>
                        <strong>1 Cuota (Sin Intereses):</strong> Tu saldo hoy no se toca. Se factura el día 30 y pagas el 15 del siguiente mes. 0 intereses si pagas a tiempo.
                      </span>
                    ) : (
                      <span>
                        <strong>Estrategia de Pago Anticipado:</strong> Puedes diferir a {selectedInst} cuotas ({formatCOP(cuotaAmount)}/mes) para proteger tu liquidez hoy. Y si te va bien en Uber o te entra dinero extra, <strong>puedes pagarla completa antes</strong> desde la app bancaria sin penalización.
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha Sugerida */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400 shrink-0" />
                  <span>
                    {isDebito
                      ? '📅 Sugerencia: Comprar hoy si tu saldo cubre obligaciones'
                      : '📅 Sugerencia: Comprar cerca al corte (día 30) para 45 días de gracia'}
                  </span>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 flex items-center gap-2">
                {item.isPendingPrice || item.estimatedCost === 0 ? (
                  <button
                    onClick={() => handleOpenEditPrice(item)}
                    className="w-full py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 size={14} />
                    <span>Ingresar Precio de Gafas</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedMethod(currentMode.method);
                      setSelectedInstallments(selectedInst.toString());
                      setExecutingItem(item);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 size={15} />
                    <span>
                      Decidir & Comprar ({isDebito ? 'Débito' : `${selectedInst} ${selectedInst === 1 ? 'cuota' : 'cuotas'}`})
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Edit Price */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 rounded-3xl max-w-sm w-full border border-slate-800 space-y-4">
            <h4 className="text-base font-bold text-white">
              Ingresar/Editar Precio: {editingItem.name}
            </h4>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Valor estimado ($):
              </label>
              <input
                type="number"
                value={newCostInput}
                onChange={(e) => setNewCostInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                placeholder="Ej. 250000"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrice}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Execution */}
      {executingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 rounded-3xl max-w-sm w-full border border-slate-800 space-y-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                Confirmar Compra: {executingItem.name}
              </h4>
              <p className="text-xs text-slate-400">
                Monto: {formatCOP(executingItem.estimatedCost)}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  Medio de Pago:
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="debito">💳 Débito (Bancolombia)</option>
                  <option value="tarjeta_credito">
                    💳 Tarjeta Crédito (Visa Clásica)
                  </option>
                  <option value="efectivo">💵 Efectivo (Bolsillo / Uber)</option>
                </select>
              </div>

              {selectedMethod === 'tarjeta_credito' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">
                      Número de Cuotas:
                    </label>
                    <span className="text-xs font-black text-indigo-400">
                      {parseInt(selectedInstallments) > 0
                        ? `${formatCOP(Math.round(executingItem.estimatedCost / parseInt(selectedInstallments)))}/mes`
                        : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {[1, 2, 3, 6, 12, 24].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setSelectedInstallments(n.toString())}
                        className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                          selectedInstallments === n.toString()
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">O escribe cuotas exactas:</span>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={selectedInstallments}
                      onChange={(e) => setSelectedInstallments(e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-black text-white focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">cuotas</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setExecutingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExecute}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/20"
              >
                <Check size={14} />
                <span>Registrar Compra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add New Purchase */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateNew}
            className="glass-card p-6 rounded-3xl max-w-sm w-full border border-slate-800 space-y-4"
          >
            <h4 className="text-base font-bold text-white">
              Añadir Compra Planeada
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  Nombre del objeto / artículo:
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="Ej. Chaqueta de cuero"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  Precio estimado ($):
                </label>
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="Ej. 180000"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
