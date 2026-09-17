import React from 'react';
import {
  PieChart,
  ArrowDown,
  ArrowRight,
  Lock,
  Sparkles,
  Wallet,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP, formatCompactCOP, formatPercentage } from '../../utils/formatters';
import { getTodayISO, getRemainingDaysInMonth } from '../../utils/dates';

const NOMINA_QUINCENAL = 680000;
const NOMINA_MENSUAL = NOMINA_QUINCENAL * 2;

export const PresupuestoView: React.FC = () => {
  const {
    obligations,
    transactions,
    accounts,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
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

  const todayISO = getTodayISO();
  const currentMonth = todayISO.substring(0, 7);
  const daysLeft = getRemainingDaysInMonth();

  // Total líquido en cuentas
  const totalLiquido = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Obligaciones de ESTE MES
  const mesObligaciones = obligations.filter(
    (o) => o.dueDate.startsWith(currentMonth) && o.amount > 0
  );
  const mesPendientes = mesObligaciones.filter((o) => !o.isPaid);
  const mesPagadas = mesObligaciones.filter((o) => o.isPaid);

  const totalObligMes = mesObligaciones.reduce((s, o) => s + o.amount, 0);
  const totalPagado = mesPagadas.reduce((s, o) => s + o.amount, 0);
  const totalPendiente = mesPendientes.reduce((s, o) => s + o.amount, 0);

  // Ingresos esperados este mes
  const ingresoNomina = NOMINA_MENSUAL;
  const ingresoUberEstimado = 50000 * 4 * 4; // ~$800k/mes estimado (4 días/sem × $50k × 4 sem)
  const totalIngresosEstimados = ingresoNomina + ingresoUberEstimado;

  // Lo que realmente queda libre
  const libreTrasMes = totalLiquido + NOMINA_QUINCENAL - totalPendiente; // Solo cuenta 1 nómina restante (30 Sep)
  const margenDiario = Math.max(0, Math.floor(libreTrasMes / Math.max(1, daysLeft)));

  // Porcentaje de obligaciones cubiertas con liquidez actual
  const porcentajeCubierto = totalPendiente > 0
    ? Math.min(100, Math.round((totalLiquido / totalPendiente) * 100))
    : 100;

  // Categorize obligations
  const groupedObligations: Record<string, typeof mesPendientes> = {};
  mesPendientes.forEach((o) => {
    if (!groupedObligations[o.category]) groupedObligations[o.category] = [];
    groupedObligations[o.category].push(o);
  });

  const categoryColors: Record<string, string> = {
    'Universidad': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    'Comida': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'Transporte': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Servicios': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'Tarjeta': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    'Gym': 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    'Personal': 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    'Moto': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };

  const mask = isPrivacyMode;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <PieChart className="text-teal-400" />
          ¿A Dónde Va Tu Plata?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Flujo real de tu dinero este mes: Ingresos → Obligaciones Fijas → Lo Que Te Queda
        </p>
      </div>

      {/* FLUJO PRINCIPAL: 3 bloques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bloque 1: INGRESOS */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Ingresos del Mes</h3>
              <p className="text-[10px] text-slate-400">Nómina + Uber estimado</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">💼 Nómina (2 quincenas)</span>
              <span className="text-xs font-bold text-emerald-400">{formatCOP(ingresoNomina, false, mask)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">🚗 Uber/Didi (estimado)</span>
              <span className="text-xs font-bold text-emerald-300">{formatCOP(ingresoUberEstimado, false, mask)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">TOTAL ESTIMADO</span>
                <span className="text-lg font-black text-emerald-400">{formatCOP(totalIngresosEstimados, false, mask)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: OBLIGACIONES FIJAS */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-amber-400 tracking-wider">Obligaciones Fijas</h3>
              <p className="text-[10px] text-slate-400">Sí o sí hay que pagarlas</p>
            </div>
          </div>

          <div className="text-2xl font-black text-amber-400">
            {formatCOP(totalObligMes, false, mask)}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Pagadas
              </span>
              <span className="text-emerald-400 font-bold">{formatCOP(totalPagado, false, mask)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} /> Pendientes
              </span>
              <span className="text-amber-400 font-bold">{formatCOP(totalPendiente, false, mask)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${totalObligMes > 0 ? (totalPagado / totalObligMes) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {formatPercentage(totalObligMes > 0 ? (totalPagado / totalObligMes) * 100 : 0)} pagado del mes
          </p>
        </div>

        {/* Bloque 3: LO QUE TE QUEDA */}
        <div className={`glass-card p-5 rounded-2xl border space-y-3 ${
          libreTrasMes > 0
            ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900'
            : 'border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-900'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${libreTrasMes > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${libreTrasMes > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Lo Que Te Queda
              </h3>
              <p className="text-[10px] text-slate-400">Después de pagar todo con nómina del 30</p>
            </div>
          </div>

          <div className={`text-2xl font-black ${libreTrasMes > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCOP(libreTrasMes, false, mask)}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Margen diario restante</span>
              <span className={`font-bold ${margenDiario >= 10000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatCOP(margenDiario, false, mask)}/día
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Para mecatos/desayunos</span>
              <span className="text-slate-400 font-semibold">
                {daysLeft} días restantes
              </span>
            </div>
          </div>

          {libreTrasMes < 0 && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
              ⚠️ Necesitas ingresos de Uber para cubrir el déficit de {formatCOP(Math.abs(libreTrasMes), false, mask)}
            </div>
          )}
        </div>
      </div>

      {/* FLUJO VISUAL: Arrow */}
      <div className="flex items-center justify-center gap-3 text-slate-500 text-xs font-bold">
        <span className="text-emerald-400">INGRESOS</span>
        <ArrowRight size={16} />
        <span className="text-amber-400">OBLIGACIONES</span>
        <ArrowRight size={16} />
        <span className={libreTrasMes > 0 ? 'text-emerald-400' : 'text-rose-400'}>LIBRE</span>
      </div>

      {/* DESGLOSE DE OBLIGACIONES DEL MES */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight mb-1">
          Desglose de Obligaciones — Septiembre
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Cada obligación con su % del total y estado de cobertura con tu liquidez actual ({formatCOP(totalLiquido, false, mask)})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(groupedObligations).map(([category, obls]) => {
            const catTotal = obls.reduce((s, o) => s + o.amount, 0);
            const catPercent = totalPendiente > 0 ? Math.round((catTotal / totalPendiente) * 100) : 0;
            const colors = categoryColors[category] || 'text-slate-400 bg-slate-800/50 border-slate-700';

            return (
              <div
                key={category}
                className={`glass-card p-4 rounded-2xl border space-y-3 ${colors.split(' ').slice(2).join(' ')}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-bold ${colors.split(' ')[0]}`}>
                      {category}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {catPercent}% de tus obligaciones
                    </span>
                  </div>
                  <span className="text-base font-black text-white">
                    {formatCOP(catTotal, false, mask)}
                  </span>
                </div>

                {/* Individual obligations in this category */}
                <div className="space-y-1.5">
                  {obls.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[60%]">{o.title}</span>
                      <span className="text-slate-200 font-semibold">{formatCOP(o.amount, false, mask)}</span>
                    </div>
                  ))}
                </div>

                {/* Coverage bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalLiquido >= catTotal ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, porcentajeCubierto)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESUMEN DE COBERTURA */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Banknote size={18} className="text-emerald-400" />
          ¿Cómo se cubre todo?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">💰 Tienes HOY</span>
            <div className="text-base font-black text-white">{formatCOP(totalLiquido, false, mask)}</div>
            <span className="text-[10px] text-slate-400">4 cuentas combinadas</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">📅 Nómina 30 Sep</span>
            <div className="text-base font-black text-emerald-400">{formatCOP(NOMINA_QUINCENAL, true, mask)}</div>
            <span className="text-[10px] text-slate-400">Entrada fija confirmada</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">🚗 Uber restante</span>
            <div className="text-base font-black text-emerald-300">{formatCOP(50000 * daysLeft * 0.4, true, mask)}</div>
            <span className="text-[10px] text-slate-400">~{daysLeft} días × $50k × 40% prob.</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300 font-semibold">Proyección fin de mes</span>
          <span className="text-sm font-black text-emerald-400">
            {formatCOP(totalLiquido + NOMINA_QUINCENAL + (50000 * daysLeft * 0.4) - totalPendiente, false, mask)}
          </span>
        </div>
      </div>
    </div>
  );
};

