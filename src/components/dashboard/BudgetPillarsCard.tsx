import React from 'react';
import {
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Coffee,
  PiggyBank,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';

export const BudgetPillarsCard: React.FC = () => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
    plannedPurchases,
    isPrivacyMode,
  } = useFinanceStore();

  const summary = calculateFinancialSummary(
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado
  );

  const pendingObligations = obligations
    .filter((o) => !o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);

  const totalWishlistKnown = (plannedPurchases || [])
    .filter((p) => !p.isPurchased && p.estimatedCost > 0)
    .reduce((sum, p) => sum + p.estimatedCost, 0);

  return (
    <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Estructura de 5 Pilares de Dinero Inteligente</span>
              <Sparkles size={16} className="text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Protección de liquidez: Tope controlado de $10.000/día para mecatos (Almuerzos fijos en Pilar 1)
            </p>
          </div>
        </div>

        <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Fondo Protegido Reservado
          </span>
          <span className="text-sm font-black text-emerald-400">
            {isPrivacyMode ? '$ ••••••' : formatCOP(summary.fondoProtegidoAhorro)}
          </span>
        </div>
      </div>

      {/* 5 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Pilar 1: Obligaciones */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pilar 1 • Fijos
            </span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-base font-black text-white">
            {isPrivacyMode ? '$ ••••••' : formatCOP(pendingObligations)}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Mercado, Universidad, Movistar, Almuerzos y Cuota manejo.
          </p>
        </div>

        {/* Pilar 2: Deudas */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pilar 2 • Deudas
            </span>
            <CreditCard size={16} />
          </div>
          <div className="text-base font-black text-white">
            $140.553 Addi
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Reserva para Addi ($46.851/mes) y Casco de Moto.
          </p>
        </div>

        {/* Pilar 3: Compras Planeadas */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pilar 3 • Compras
            </span>
            <ShoppingBag size={16} />
          </div>
          <div className="text-base font-black text-white">
            {isPrivacyMode ? '$ ••••••' : formatCOP(totalWishlistKnown)}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            👓 Gafas ($500k), Camisetas & Jeans de la Wishlist.
          </p>
        </div>

        {/* Pilar 4: Bolsillo Diario */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2 bg-gradient-to-b from-slate-950 to-emerald-950/30">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pilar 4 • Diario
            </span>
            <Coffee size={16} />
          </div>
          <div className="text-base font-black text-emerald-400">
            {isPrivacyMode ? '$ ••••••' : formatCOP(summary.puedesGastarHoy)}/día
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-tight">
            Mecatos y desayunos de calle (Almuerzos $200k en Pilar 1).
          </p>
        </div>

        {/* Pilar 5: Ahorro Protegido */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/20 space-y-2">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pilar 5 • Ahorro
            </span>
            <PiggyBank size={16} />
          </div>
          <div className="text-base font-black text-white">
            {isPrivacyMode ? '$ ••••••' : formatCOP(summary.fondoProtegidoAhorro)}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Acumulado protegido en Nequi/Nu/Bancolombia.
          </p>
        </div>
      </div>
    </div>
  );
};
