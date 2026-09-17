import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dates';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

const NOMINA_QUINCENAL = 680000;
const NOMINA_MENSUAL = NOMINA_QUINCENAL * 2;
const UBER_MENSUAL_EST = 50000 * 4 * 4; // ~$800k/mes (4 días/sem × $50k)
const GASTO_DIARIO_EST = 10000; // mecatos/desayunos

const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const ProyeccionesView: React.FC = () => {
  const { obligations, accounts, isPrivacyMode } = useFinanceStore();

  const [monthsAhead, setMonthsAhead] = useState<number>(6);
  const mask = isPrivacyMode;

  const todayISO = getTodayISO();
  const todayDate = new Date(todayISO);
  const currentYear = todayDate.getFullYear();
  const currentMonth = todayDate.getMonth(); // 0-indexed

  // Saldo actual real (todas las cuentas)
  const saldoActual = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Generar proyección mes a mes con obligaciones REALES
  const projectionData: {
    month: string;
    ingresos: number;
    obligaciones: number;
    gastosVariable: number;
    saldo: number;
    libre: number;
  }[] = [];

  let accumSaldo = saldoActual;

  for (let i = 0; i < monthsAhead; i++) {
    const projMonth = (currentMonth + i) % 12;
    const projYear = currentYear + Math.floor((currentMonth + i) / 12);
    const monthStr = `${projYear}-${String(projMonth + 1).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[projMonth]} ${projYear}`;

    // Obligaciones REALES de este mes (del store)
    const mesObligaciones = obligations
      .filter((o) => o.dueDate.startsWith(monthStr) && o.amount > 0)
      .reduce((s, o) => s + o.amount, 0);

    // Para meses sin obligaciones registradas, estimar con promedio
    const obligEstimadas = mesObligaciones > 0 ? mesObligaciones : 900000; // ~$900k/mes promedio

    // Ingresos: Nómina fija + Uber estimado
    const ingresos = NOMINA_MENSUAL + UBER_MENSUAL_EST;

    // Gastos variables (mecatos, desayunos, imprevistos ~$300k/mes)
    const gastosVariable = GASTO_DIARIO_EST * 30;

    // Primer mes es especial: solo queda media quincena
    const ingresosReales = i === 0 ? NOMINA_QUINCENAL + (UBER_MENSUAL_EST * 0.5) : ingresos;
    const obligReales = i === 0 ? obligations
      .filter((o) => !o.isPaid && o.dueDate.startsWith(monthStr) && o.amount > 0)
      .reduce((s, o) => s + o.amount, 0) : obligEstimadas;

    const netFlow = ingresosReales - obligReales - gastosVariable;
    accumSaldo += netFlow;

    const libre = Math.max(0, accumSaldo - 200000); // Colchón de $200k siempre

    projectionData.push({
      month: label,
      ingresos: Math.round(ingresosReales),
      obligaciones: Math.round(obligReales),
      gastosVariable: Math.round(gastosVariable),
      saldo: Math.round(accumSaldo),
      libre: Math.round(libre),
    });
  }

  const finalSaldo = projectionData[projectionData.length - 1]?.saldo || 0;
  const isGrowing = finalSaldo > saldoActual;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="text-indigo-400" />
            Proyecciones Financieras
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulación basada en tu nómina ({formatCOP(NOMINA_MENSUAL, false, mask)}/mes), Uber estimado ({formatCOP(UBER_MENSUAL_EST, false, mask)}/mes), y obligaciones reales
          </p>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonthsAhead(m)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                monthsAhead === m
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m} Meses
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Hoy</span>
          <div className="text-lg font-black text-white">{formatCOP(saldoActual, false, mask)}</div>
          <span className="text-[10px] text-slate-400">4 cuentas</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Ingresos/Mes</span>
          <div className="text-lg font-black text-emerald-400">{formatCOP(NOMINA_MENSUAL + UBER_MENSUAL_EST, false, mask)}</div>
          <span className="text-[10px] text-slate-400">Nómina + Uber</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400">Obligaciones/Mes</span>
          <div className="text-lg font-black text-amber-400">~{formatCOP(900000, false, mask)}</div>
          <span className="text-[10px] text-slate-400">Promedio mensual</span>
        </div>
        <div className={`glass-card p-4 rounded-2xl border space-y-1 ${isGrowing ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          <span className="text-[10px] uppercase font-bold text-indigo-400">Saldo en {monthsAhead} meses</span>
          <div className={`text-lg font-black ${isGrowing ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCOP(finalSaldo, false, mask)}
          </div>
          <span className={`text-[10px] ${isGrowing ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isGrowing ? '📈' : '📉'} {formatCOP(finalSaldo - saldoActual, true, mask)}
          </span>
        </div>
      </div>

      {/* Main Projection Chart */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Evolución Proyectada de Saldo
            </h3>
            <p className="text-xs text-slate-400">
              Línea sólida = Saldo total • Área verde = Dinero libre (sin colchón de $200k)
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(val: any, name?: any) => [
                  formatCOP(Number(val)),
                  name === 'saldo' ? 'Saldo Total' : 'Libre',
                ]}
              />
              <Area
                type="monotone"
                dataKey="libre"
                stroke="#10b981"
                fill="#10b98120"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#818cf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Projections Table */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h4 className="text-sm font-bold text-white tracking-tight">
          Desglose Mes a Mes
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                <th className="py-2.5 px-3">Mes</th>
                <th className="py-2.5 px-3">Ingresos</th>
                <th className="py-2.5 px-3">Obligaciones</th>
                <th className="py-2.5 px-3">Gastos Diarios</th>
                <th className="py-2.5 px-3 text-right">Saldo Proyectado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projectionData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 font-bold text-white">{row.month}</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">
                    {formatCOP(row.ingresos, false, mask)}
                  </td>
                  <td className="py-3 px-3 text-amber-400">
                    {formatCOP(row.obligaciones, false, mask)}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {formatCOP(row.gastosVariable, false, mask)}
                  </td>
                  <td className={`py-3 px-3 text-right font-extrabold ${row.saldo >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                    {formatCOP(row.saldo, false, mask)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          💡 <strong>Nota:</strong> Las proyecciones usan tus obligaciones reales registradas en la app.
          Para los meses sin obligaciones cargadas, se estima ~$900k/mes. Los ingresos de Uber
          son estimados — ajústalos registrando tus ganancias reales cada día.
        </div>
      </div>
    </div>
  );
};

