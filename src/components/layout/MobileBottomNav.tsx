import React from 'react';
import {
  LayoutDashboard,
  Zap,
  ReceiptText,
  CreditCard,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';

interface MobileBottomNavProps {
  onOpenMenuModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenuModal }) => {
  const { activeView, setActiveView } = useFinanceStore();

  const mainItems = [
    { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
    { id: 'hoy', label: 'Hoy', icon: Zap },
    { id: 'movimientos', label: 'Movimientos', icon: ReceiptText },
    { id: 'decisiones', label: 'Decisiones', icon: HelpCircle },
    { id: 'tarjetas', label: 'Tarjetas', icon: CreditCard },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
      {mainItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="text-[11px]">{item.label}</span>
          </button>
        );
      })}

      {/* More menu launcher */}
      <button
        onClick={onOpenMenuModal}
        className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 font-medium"
      >
        <Menu size={20} />
        <span className="text-[11px]">Más</span>
      </button>
    </div>
  );
};
