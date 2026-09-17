import React from 'react';
import {
  LayoutDashboard,
  Zap,
  HelpCircle,
  ReceiptText,
  CreditCard,
  PieChart,
  CalendarDays,
  Target,
  TrendingUp,
  Bike,
  Settings,
  Plus,
  Eye,
  EyeOff,
  Bot,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'hoy', label: 'Modo "Hoy"', icon: Zap, badge: 'Rápido' },
  { id: 'decisiones', label: 'Decisiones', icon: HelpCircle, badge: 'Smart' },
  { id: 'movimientos', label: 'Movimientos', icon: ReceiptText },
  { id: 'tarjetas', label: 'Deudas & Tarjetas', icon: Flame, badge: 'Plan' },
  { id: 'presupuesto', label: 'Presupuesto', icon: PieChart },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'objetivos', label: 'Objetivos', icon: Target },
  { id: 'proyecciones', label: 'Proyecciones', icon: TrendingUp },
  { id: 'moto', label: 'Moto', icon: Bike },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

interface SidebarNavProps {
  onOpenQuickAdd: () => void;
  onOpenAi: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onOpenQuickAdd, onOpenAi }) => {
  const { activeView, setActiveView, isPrivacyMode, togglePrivacyMode } = useFinanceStore();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 glass-panel bg-slate-950/90 border-r border-slate-800/80 p-4 z-40">
      {/* Brand Header & Privacy Toggle */}
      <div className="flex items-center justify-between mb-6 px-3 pt-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SVR Finanzas Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-teal-500/20 border border-teal-500/30"
          />
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
              SVR Finanzas
            </h1>
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
              Control Inteligente
            </span>
          </div>
        </div>

        {/* Eye Privacy Button */}
        <button
          onClick={togglePrivacyMode}
          className={`p-2 rounded-xl transition-all ${
            isPrivacyMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title={isPrivacyMode ? 'Mostrar cifras' : 'Ocultar cifras (Modo Privacidad)'}
        >
          {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Quick Add Button */}
      <button
        onClick={onOpenQuickAdd}
        className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Nuevo Movimiento</span>
      </button>

      {/* AI Assistant Button in Sidebar */}
      <button
        onClick={onOpenAi}
        className="w-full mb-5 flex items-center justify-between py-2 px-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white font-semibold text-xs transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Asistente IA</span>
        </div>
        <Sparkles size={13} className="text-amber-400 animate-pulse" />
      </button>


      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={isActive ? 'text-emerald-400' : 'text-slate-400'}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Footer Info */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Active</span>
        </div>
        {isPrivacyMode && (
          <span className="text-[10px] font-bold text-amber-400 uppercase">Privacidad ON</span>
        )}
      </div>
    </aside>
  );
};
