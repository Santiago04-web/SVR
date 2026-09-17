import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { SidebarNav } from './components/layout/SidebarNav';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { FloatingActionButton } from './components/layout/FloatingActionButton';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { MobileMenuModal } from './components/layout/MobileMenuModal';
import { cloudSyncEngine } from './services/cloudSyncEngine';

// Keep critical initial view sync
import { OverviewView } from './components/dashboard/OverviewView';

// Lazy load secondary views & heavy modals
const HoyView = lazy(() => import('./components/hoy/HoyView').then((m) => ({ default: m.HoyView })));
const DecisionesView = lazy(() => import('./components/decisiones/DecisionesView').then((m) => ({ default: m.DecisionesView })));
const MovimientosView = lazy(() => import('./components/movimientos/MovimientosView').then((m) => ({ default: m.MovimientosView })));
const TarjetasView = lazy(() => import('./components/tarjetas/TarjetasView').then((m) => ({ default: m.TarjetasView })));
const PresupuestoView = lazy(() => import('./components/presupuesto/PresupuestoView').then((m) => ({ default: m.PresupuestoView })));
const CalendarioView = lazy(() => import('./components/calendario/CalendarioView').then((m) => ({ default: m.CalendarioView })));
const ObjetivosView = lazy(() => import('./components/objetivos/ObjetivosView').then((m) => ({ default: m.ObjetivosView })));
const ProyeccionesView = lazy(() => import('./components/proyecciones/ProyeccionesView').then((m) => ({ default: m.ProyeccionesView })));
const MotoView = lazy(() => import('./components/moto/MotoView').then((m) => ({ default: m.MotoView })));
const ConfiguracionView = lazy(() => import('./components/configuracion/ConfiguracionView').then((m) => ({ default: m.ConfiguracionView })));
const AiAssistantModal = lazy(() => import('./components/ui/AiAssistantModal').then((m) => ({ default: m.AiAssistantModal })));

export function App() {
  const { activeView } = useFinanceStore();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Initialize Realtime Cloud Sync and subscribe to store updates
  useEffect(() => {
    cloudSyncEngine.init();

    const unsub = useFinanceStore.subscribe((_state, prevState) => {
      // Trigger cloud push on meaningful state mutations
      cloudSyncEngine.triggerLocalStateChanged();
    });

    return () => unsub();
  }, []);

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
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Cargando módulo...</span>
            </div>
          }
        >
          {renderActiveView()}
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenMenuModal={() => setIsMobileMenuOpen(true)} />

      {/* Floating '+' Action Button */}
      <FloatingActionButton onClick={() => setIsQuickAddOpen(true)} />

      {/* AI Assistant Modal */}
      {isAiOpen && (
        <Suspense fallback={null}>
          <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        </Suspense>
      )}

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
