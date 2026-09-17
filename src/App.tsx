import React, { useState } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { SidebarNav } from './components/layout/SidebarNav';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { FloatingActionButton } from './components/layout/FloatingActionButton';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { MobileMenuModal } from './components/layout/MobileMenuModal';
import { AiAssistantModal } from './components/ui/AiAssistantModal';

// Views
import { OverviewView } from './components/dashboard/OverviewView';
import { HoyView } from './components/hoy/HoyView';
import { DecisionesView } from './components/decisiones/DecisionesView';
import { MovimientosView } from './components/movimientos/MovimientosView';
import { TarjetasView } from './components/tarjetas/TarjetasView';
import { PresupuestoView } from './components/presupuesto/PresupuestoView';
import { CalendarioView } from './components/calendario/CalendarioView';
import { ObjetivosView } from './components/objetivos/ObjetivosView';
import { ProyeccionesView } from './components/proyecciones/ProyeccionesView';
import { MotoView } from './components/moto/MotoView';
import { ConfiguracionView } from './components/configuracion/ConfiguracionView';

export function App() {
  const { activeView } = useFinanceStore();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewView
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenAi={() => setIsAiOpen(true)}
          />
        );
      case 'hoy':
        return <HoyView />;
      case 'decisiones':
        return <DecisionesView />;
      case 'movimientos':
        return <MovimientosView onOpenQuickAdd={() => setIsQuickAddOpen(true)} />;
      case 'tarjetas':
        return <TarjetasView />;
      case 'presupuesto':
        return <PresupuestoView />;
      case 'calendario':
        return <CalendarioView />;
      case 'objetivos':
        return <ObjetivosView />;
      case 'proyecciones':
        return <ProyeccionesView />;
      case 'moto':
        return <MotoView />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return (
          <OverviewView
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenAi={() => setIsAiOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Desktop Sidebar Navigation */}
      <SidebarNav
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-10 pt-12 sm:pt-6 lg:pt-10 pb-28 lg:pb-10 max-w-7xl mx-auto w-full min-h-screen">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenMenuModal={() => setIsMobileMenuOpen(true)} />

      {/* Floating '+' Action Button */}
      <FloatingActionButton onClick={() => setIsQuickAddOpen(true)} />

      {/* AI Assistant Modal */}
      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Mobile Menu Modal */}
      <MobileMenuModal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}

export default App;
