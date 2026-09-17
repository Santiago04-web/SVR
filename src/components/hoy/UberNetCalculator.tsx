import React, { useState } from 'react';
import { Car, Fuel, Calculator, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dates';

export const UberNetCalculator: React.FC = () => {
  const { addTransaction, addVehicleLog } = useFinanceStore();

  const [uberGross, setUberGross] = useState('70000');
  const [gasolineExpense, setGasolineExpense] = useState('15000');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const grossVal = parseFloat(uberGross) || 0;
  const gasVal = parseFloat(gasolineExpense) || 0;
  const netProfit = Math.max(0, grossVal - gasVal);

  const handleRegisterJornada = (e: React.FormEvent) => {
    e.preventDefault();
    if (grossVal <= 0) return;

    const today = getTodayISO();

    // 1. Add Uber income transaction
    addTransaction({
      description: 'Uber Jornada (Bruto)',
      amount: grossVal,
      type: 'ingreso',
      category: 'Transporte',
      date: today,
      paymentMethod: 'efectivo',
      status: 'completado',
    });

    // 2. Add Gasoline expense if > 0
    if (gasVal > 0) {
      addTransaction({
        description: 'Gasolina Jornada Uber',
        amount: gasVal,
        type: 'gasto',
        category: 'Moto',
        date: today,
        paymentMethod: 'debito',
        status: 'completado',
      });

      addVehicleLog({
        date: today,
        type: 'gasolina',
        description: 'Gasolina Jornada Uber',
        cost: gasVal,
      });
    }

    setSuccessNotice(
      `🎉 Jornada registrada: +${formatCOP(grossVal)} Uber, -${formatCOP(gasVal)} Gasolina. Ganancia libre: ${formatCOP(netProfit)}`
    );

    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 space-y-4 bg-gradient-to-b from-slate-900 to-indigo-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm">
          <Calculator size={18} />
          <span>Calculadora Neta de Jornada Uber</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Smart Auto-Sync
        </span>
      </div>

      <form onSubmit={handleRegisterJornada} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Car size={13} className="text-emerald-400" /> Uber Bruto ($)
            </label>
            <input
              type="number"
              required
              min="0"
              value={uberGross}
              onChange={(e) => setUberGross(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Fuel size={13} className="text-rose-400" /> Gasolina Moto ($)
            </label>
            <input
              type="number"
              min="0"
              value={gasolineExpense}
              onChange={(e) => setGasolineExpense(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500"
            />
          </div>
        </div>

        {/* Net Profit Display */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Ganancia Libre Neta de la Jornada:</span>
          <span className="text-base font-black text-emerald-400">
            {formatCOP(netProfit)}
          </span>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <ArrowUpRight size={16} />
          <span>Registrar Jornada Completa (Ingreso + Gasolina)</span>
        </button>
      </form>

      {successNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
};
