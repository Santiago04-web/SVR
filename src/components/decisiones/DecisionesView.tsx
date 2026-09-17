import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Trash2,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { simulateScenario, ScenarioSimulationResult } from '../../domain/scenarioEngine';
import { formatCOP } from '../../utils/formatters';
import { Category, PaymentMethod, Scenario } from '../../types/finance';
import { getTodayISO } from '../../utils/dates';

import { PlannedPurchasesSection } from './PlannedPurchasesSection';

export const DecisionesView: React.FC = () => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    scenarios,
    addScenario,
    deleteScenario,
    addTransaction,
  } = useFinanceStore();

  // Preset question shortcuts
  const PRESET_QUESTIONS = [
    {
      title: '⚡ ¿Pagar Addi por adelantado?',
      name: 'Pago Anticipado Deuda Addi',
      amount: 140553,
      category: 'Servicios' as Category,
      paymentMethod: 'debito' as PaymentMethod,
    },
    {
      title: '¿Puedo comprar un teclado de $200.000?',
      name: 'Comprar teclado mechanical',
      amount: 200000,
      category: 'Personal' as Category,
      paymentMethod: 'debito' as PaymentMethod,
    },
    {
      title: '¿Puedo comprar el perfume este mes?',
      name: 'Perfume Sauvage',
      amount: 450000,
      category: 'Personal' as Category,
      paymentMethod: 'tarjeta_credito' as PaymentMethod,
      installments: 3,
    },
    {
      title: '¿Comprar casco para la moto?',
      name: 'Casco certificado Shaft ($379.000)',
      amount: 379000,
      category: 'Moto' as Category,
      paymentMethod: 'debito' as PaymentMethod,
    },
  ];

  const [scenarioName, setScenarioName] = useState('Comprar teclado');
  const [expenseDelta, setExpenseDelta] = useState('200000');
  const [incomeDelta, setIncomeDelta] = useState('0');
  const [category, setCategory] = useState<Category>('Personal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [installments, setInstallments] = useState('1');

  const [activeSimulation, setActiveSimulation] = useState<ScenarioSimulationResult | null>(
    null
  );

  const handleRunSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const exp = parseFloat(expenseDelta) || 0;
    const inc = parseFloat(incomeDelta) || 0;

    const candidateScenario: Scenario = {
      id: `sandbox-${Date.now()}`,
      name: scenarioName || 'Escenario Simulado',
      expenseDelta: exp,
      incomeDelta: inc,
      category,
      paymentMethod,
      installments: parseInt(installments) || 1,
      date: getTodayISO(),
    };

    const result = simulateScenario(
      candidateScenario,
      transactions,
      obligations,
      creditCards,
      goals,
      initialBalance
    );

    setActiveSimulation(result);
  };

  const handlePresetClick = (q: (typeof PRESET_QUESTIONS)[0]) => {
    setScenarioName(q.name);
    setExpenseDelta(q.amount.toString());
    setIncomeDelta('0');
    setCategory(q.category);
    setPaymentMethod(q.paymentMethod);
    setInstallments((q.installments || 1).toString());

    const candidateScenario: Scenario = {
      id: `sandbox-${Date.now()}`,
      name: q.name,
      expenseDelta: q.amount,
      incomeDelta: 0,
      category: q.category,
      paymentMethod: q.paymentMethod,
      installments: q.installments || 1,
      date: getTodayISO(),
    };

    const result = simulateScenario(
      candidateScenario,
      transactions,
      obligations,
      creditCards,
      goals,
      initialBalance
    );

    setActiveSimulation(result);
  };

  const handleSaveScenario = () => {
    if (!activeSimulation) return;
    addScenario(activeSimulation.scenario);
  };

  const handleConfirmAndExecute = () => {
    if (!activeSimulation) return;
    const s = activeSimulation.scenario;
    if (s.expenseDelta > 0) {
      addTransaction({
        description: s.name,
        amount: s.expenseDelta,
        type: 'gasto',
        category: s.category,
        date: getTodayISO(),
        paymentMethod: s.paymentMethod,
        installments:
          s.installments && s.installments > 1
            ? { current: 1, total: s.installments }
            : undefined,
        status: 'completado',
      });
    }
    setActiveSimulation(null);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Centro de Decisiones
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulador sandbox e inteligencia de compras planeadas en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Compras Personales Planeadas & Evaluador Inteligente de Medios de Pago */}
      <PlannedPurchasesSection />

      {/* Quick Questions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Preguntas Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(q)}
              className="glass-card p-4 rounded-xl text-left hover:border-indigo-500/40 transition-all group"
            >
              <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                {q.title}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatCOP(q.amount)} ({q.paymentMethod})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Sandbox Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Controls */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            Configurar Escenario
          </h3>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nombre del Escenario / Compra
              </label>
              <input
                type="text"
                required
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Monto Gasto (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={expenseDelta}
                  onChange={(e) => setExpenseDelta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Monto Ingreso (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={incomeDelta}
                  onChange={(e) => setIncomeDelta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                >
                  <option value="Personal">Personal</option>
                  <option value="Comida">Comida</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Moto">Moto</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                >
                  <option value="debito">Débito</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="addi">Addi</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'tarjeta_credito' && (
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Play size={16} fill="white" />
              <span>Simular Impacto Financiero</span>
            </button>
          </form>
        </div>

        {/* Side-by-Side Comparison Output */}
        <div className="lg:col-span-7 space-y-4">
          {activeSimulation ? (
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase font-extrabold text-indigo-400">
                    Resultado de Simulación
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {activeSimulation.scenario.name}
                  </h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    activeSimulation.canAfford
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeSimulation.canAfford ? (
                    <>
                      <CheckCircle2 size={15} /> Viable
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={15} /> No Recomendado
                    </>
                  )}
                </div>
              </div>

              {/* Recommendation message */}
              <div
                className={`p-4 rounded-xl text-xs font-medium border ${
                  activeSimulation.canAfford
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                {activeSimulation.recommendation}
              </div>

              {/* Comparison Matrix */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* BEFORE */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-xs uppercase font-bold text-slate-400 block border-b border-slate-800 pb-2">
                    SITUACIÓN ACTUAL
                  </span>
                  <div>
                    <span className="text-[11px] text-slate-400">Saldo Disponible</span>
                    <div className="text-base font-bold text-white">
                      {formatCOP(activeSimulation.currentSummary.saldoDisponible)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Comprometido</span>
                    <div className="text-base font-bold text-amber-400">
                      {formatCOP(activeSimulation.currentSummary.comprometido)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Realmente Libre</span>
                    <div className="text-lg font-black text-emerald-400">
                      {formatCOP(activeSimulation.currentSummary.realmenteLibre)}
                    </div>
                  </div>
                </div>

                {/* AFTER */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                  <span className="text-xs uppercase font-bold text-indigo-400 block border-b border-indigo-500/20 pb-2">
                    DESPUÉS DE LA COMPRA
                  </span>
                  <div>
                    <span className="text-[11px] text-slate-400">Saldo Disponible</span>
                    <div className="text-base font-bold text-white">
                      {formatCOP(activeSimulation.simulatedSummary.saldoDisponible)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Comprometido</span>
                    <div className="text-base font-bold text-amber-400">
                      {formatCOP(activeSimulation.simulatedSummary.comprometido)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Realmente Libre</span>
                    <div
                      className={`text-lg font-black ${
                        activeSimulation.simulatedSummary.realmenteLibre >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatCOP(activeSimulation.simulatedSummary.realmenteLibre)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleSaveScenario}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Save size={15} />
                  <span>Guardar Escenario Temporal</span>
                </button>
                <button
                  onClick={handleConfirmAndExecute}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirmar y Ejecutar Realmente</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-2xl text-center space-y-3 text-slate-400">
              <Sparkles size={36} className="mx-auto text-indigo-400 opacity-60" />
              <h4 className="text-base font-bold text-white">
                Prueba un escenario de simulación
              </h4>
              <p className="text-xs max-w-sm mx-auto">
                Selecciona una pregunta rápida arriba o configura una compra personalizada a la izquierda para evaluar su impacto exacto.
              </p>
            </div>
          )}

          {/* Saved Scenarios List */}
          {scenarios.length > 0 && (
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Escenarios Guardados ({scenarios.length})
              </h4>
              <div className="space-y-2">
                {scenarios.map((scen) => (
                  <div
                    key={scen.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{scen.name}</h5>
                      <span className="text-[10px] text-slate-400">
                        {formatCOP(scen.expenseDelta)} ({scen.paymentMethod})
                      </span>
                    </div>
                    <button
                      onClick={() => deleteScenario(scen.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
