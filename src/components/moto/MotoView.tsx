import React, { useState } from 'react';
import { Bike, Plus, Fuel, Wrench, ShieldAlert, Gauge, Trash2, Edit2 } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { formatDateShort, getTodayISO } from '../../utils/dates';
import { VehicleLogType } from '../../types/finance';
import { Modal } from '../ui/Modal';

export const MotoView: React.FC = () => {
  const { vehicleLogs, addVehicleLog, deleteVehicleLog, addTransaction } = useFinanceStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<VehicleLogType>('gasolina');
  const [odometerInput, setOdometerInput] = useState('65200');
  const [gallons, setGallons] = useState('');

  // Editable current odometer
  const [currentOdometer, setCurrentOdometer] = useState(65200);
  const [isEditingOdo, setIsEditingOdo] = useState(false);
  const [newOdoVal, setNewOdoVal] = useState('65200');

  const TARGET_OIL_CHANGE_KM = 67500;

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(cost) || 0;
    if (!description) return;

    const odoNum = parseFloat(odometerInput);
    if (!isNaN(odoNum) && odoNum > currentOdometer) {
      setCurrentOdometer(odoNum);
    }

    addVehicleLog({
      date: getTodayISO(),
      type,
      description,
      cost: costNum,
      odometerKm: !isNaN(odoNum) ? odoNum : undefined,
      gallons: parseFloat(gallons) || undefined,
    });

    if (costNum > 0) {
      addTransaction({
        description: `[Moto] ${description}`,
        amount: costNum,
        type: 'gasto',
        category: 'Moto',
        date: getTodayISO(),
        paymentMethod: 'debito',
        status: 'completado',
      });
    }

    setDescription('');
    setCost('');
    setIsAddModalOpen(false);
  };

  const kmToNextOilChange = Math.max(0, TARGET_OIL_CHANGE_KM - currentOdometer);
  const totalMotoSpent = vehicleLogs.reduce((sum, v) => sum + (v.cost || 0), 0);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bike className="text-amber-400" />
            Módulo de Vehículo (Bajaj Pulsar 135 LS 2019)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Control de kilometraje, gasolina, SOAT (10 OCT), Tecnomecánica (20 NOV) y aceite
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Registrar Gasto Moto</span>
        </button>
      </div>

      {/* Primary Moto Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Odometer */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between relative group">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kilometraje Actual
            </span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>{currentOdometer.toLocaleString('es-CO')} km</span>
              <button
                onClick={() => {
                  setNewOdoVal(currentOdometer.toString());
                  setIsEditingOdo(true);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                title="Actualizar kilometraje de la moto"
              >
                <Edit2 size={15} />
              </button>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Gauge size={24} />
          </div>
        </div>

        {/* Oil Status to 67.500 km */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-indigo-500/30">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Próximo Cambio de Aceite
            </span>
            <div className="text-2xl font-black text-white mt-1">
              Faltan {kmToNextOilChange.toLocaleString('es-CO')} km
            </div>
            <span className="text-[11px] text-slate-400">
              Meta cambio: <strong className="text-indigo-300">67.500 km</strong>
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300">
            <Wrench size={24} />
          </div>
        </div>

        {/* Total Spent */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gasto Acumulado Moto
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {formatCOP(totalMotoSpent)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Fuel size={24} />
          </div>
        </div>
      </div>

      {/* Vehicle Log Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Historial & Trámites Bajaj Pulsar 135 LS
        </h3>

        <div className="space-y-2">
          {vehicleLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
                  {log.type === 'gasolina' ? (
                    <Fuel size={18} />
                  ) : log.type === 'aceite' ? (
                    <Wrench size={18} />
                  ) : (
                    <ShieldAlert size={18} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{log.description}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatDateShort(log.date)}</span>
                    {log.odometerKm && <span>• {log.odometerKm.toLocaleString('es-CO')} km</span>}
                    {log.isPendingConfirmation && (
                      <span className="text-amber-400 font-bold">• Valor por definir</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm font-black text-white">
                  {log.cost > 0 ? formatCOP(log.cost) : 'Pendiente'}
                </div>
                <button
                  onClick={() => deleteVehicleLog(log.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Odometer Modal */}
      {isEditingOdo && (
        <Modal
          isOpen={isEditingOdo}
          onClose={() => setIsEditingOdo(false)}
          title="Actualizar Kilometraje de la Moto"
          subtitle="Ingresa el kilometraje actual que marca el tablero de tu Pulsar 135"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Kilometraje Actual (km)
              </label>
              <input
                type="number"
                value={newOdoVal}
                onChange={(e) => setNewOdoVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingOdo(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(newOdoVal);
                  if (!isNaN(val)) setCurrentOdometer(val);
                  setIsEditingOdo(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Guardar Kilometraje
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Vehicle Log Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registrar Gasto de Moto"
        subtitle="Agrega una tanqueda de gasolina, cambio de aceite o mantenimiento"
      >
        <form onSubmit={handleAddLogSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tipo de Evento
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleLogType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
            >
              <option value="gasolina">⛽ Gasolina / Tanqueda</option>
              <option value="aceite">🔧 Cambio de Aceite</option>
              <option value="mantenimiento">🛠️ Mantenimiento / Repuesto</option>
              <option value="soat">📜 SOAT</option>
              <option value="tecnomecanica">🔍 Tecnomecánica</option>
              <option value="lavado">🚿 Lavado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Descripción
            </label>
            <input
              type="text"
              required
              placeholder="ej. Tanqueda Terpel, Aceite Motul 7100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Costo (COP)
              </label>
              <input
                type="number"
                placeholder="50000"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Kilometraje (km)
              </label>
              <input
                type="number"
                placeholder="65200"
                value={odometerInput}
                onChange={(e) => setOdometerInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
