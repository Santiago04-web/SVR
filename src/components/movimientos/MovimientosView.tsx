import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { formatDateShort } from '../../utils/dates';
import { Modal } from '../ui/Modal';

interface MovimientosViewProps {
  onOpenQuickAdd: () => void;
}

export const MovimientosView: React.FC<MovimientosViewProps> = ({ onOpenQuickAdd }) => {
  const { transactions, deleteTransaction, exportCSV } = useFinanceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDownloadCSV = () => {
    const csvContent = exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `movimientos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ReceiptText className="text-emerald-400" />
            Movimientos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historial completo de ingresos, gastos y cuotas de tarjetas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">Todos los tipos</option>
            <option value="ingreso">🟢 Ingresos</option>
            <option value="gasto">🔴 Gastos</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">Todas las categorías</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Personal">Personal</option>
            <option value="Moto">Moto</option>
            <option value="Servicios">Servicios</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Suscripciones">Suscripciones</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800/80">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Filter size={32} className="mx-auto text-slate-600" />
            <h4 className="text-sm font-bold text-white">No se encontraron movimientos</h4>
            <p className="text-xs text-slate-500">
              Prueba cambiar los filtros de búsqueda o agrega un nuevo movimiento.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'ingreso'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tx.type === 'ingreso' ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <ArrowDownRight size={20} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {tx.description}
                    </h4>
                    {tx.installments && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Cuota {tx.installments.current}/{tx.installments.total}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-300">{tx.category}</span>
                    <span>•</span>
                    <span>{formatDateShort(tx.date)}</span>
                    <span>•</span>
                    <span className="capitalize">{tx.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={`text-sm font-extrabold ${
                    tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                  }`}
                >
                  {formatCOP(tx.amount, true)}
                </div>

                <button
                  onClick={() => setDeleteCandidateId(tx.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar movimiento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteCandidateId !== null}
        onClose={() => setDeleteCandidateId(null)}
        title="Confirmar eliminación"
        subtitle="¿Estás seguro de que deseas eliminar este movimiento?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Esta acción eliminará el registro de tus cálculos locales de forma permanente.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteCandidateId(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (deleteCandidateId) {
                  deleteTransaction(deleteCandidateId);
                  setDeleteCandidateId(null);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
