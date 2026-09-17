import React from 'react';
import { Modal } from '../ui/Modal';
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
  Flame,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView } = useFinanceStore();

  const menuItems = [
    { id: 'overview', label: 'Overview / Dashboard', icon: LayoutDashboard },
    { id: 'hoy', label: 'Modo "Hoy"', icon: Zap },
    { id: 'decisiones', label: 'Centro de Decisiones', icon: HelpCircle },
    { id: 'movimientos', label: 'Movimientos', icon: ReceiptText },
    { id: 'tarjetas', label: 'Deudas & Tarjetas', icon: Flame },
    { id: 'presupuesto', label: 'Presupuesto por Categoría', icon: PieChart },
    { id: 'calendario', label: 'Calendario Inteligente', icon: CalendarDays },
    { id: 'objetivos', label: 'Objetivos Financieros', icon: Target },
    { id: 'proyecciones', label: 'Proyecciones', icon: TrendingUp },
    { id: 'moto', label: 'Módulo Moto', icon: Bike },
    { id: 'configuracion', label: 'Configuración & Backup', icon: Settings },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Menú de Navegación">
      <div className="grid grid-cols-1 gap-2 pt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
