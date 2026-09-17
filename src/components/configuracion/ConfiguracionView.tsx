import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sparkles,
  Key,
  ExternalLink,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { getGeminiApiKey, saveGeminiApiKey } from '../../services/geminiService';

import { CloudSyncSettings } from './CloudSyncSettings';

export const ConfiguracionView: React.FC = () => {
  const {
    initialBalance,
    setInitialBalance,
    exportJSON,
    importJSON,
    exportCSV,
    resetToSeedData,
    clearAllData,
  } = useFinanceStore();

  const [balanceInput, setBalanceInput] = useState(initialBalance.toString());
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    setApiKeyInput(getGeminiApiKey());
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiApiKey(apiKeyInput);
    setImportStatus('✨ Clave de Inteligencia Artificial (Gemini / ChatGPT) guardada correctamente');
    setTimeout(() => setImportStatus(null), 3500);
  };

  const handleSaveInitialBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput);
    if (!isNaN(val)) {
      setInitialBalance(val);
      setImportStatus('✅ Saldo base actualizado correctamente');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `app_gastos_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJSON(content);
        if (success) {
          setImportStatus('✅ Backup JSON restaurado con éxito.');
        } else {
          setImportStatus('❌ Error al procesar el archivo JSON. Formato inválido.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="text-slate-400" />
          Configuración & Sincronización
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Sincronización en tiempo real en la nube, backups y control de saldos
        </p>
      </div>

      {importStatus && (
        <div className="p-4 rounded-xl glass-panel border border-emerald-500/40 text-xs font-bold text-emerald-300 animate-in fade-in">
          {importStatus}
        </div>
      )}

      {/* Cloud Sync in Realtime */}
      <CloudSyncSettings />

      {/* Artificial Intelligence Provider Config */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Inteligencia Artificial (Gemini Pro / Flash o ChatGPT)</span>
                <Sparkles size={16} className="text-amber-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400">
                Conecta tu propia API Key gratuita de Google Gemini o tu cuenta de ChatGPT/OpenAI.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all shrink-0"
          >
            <span>Crear Key Gratis (Google AI Studio)</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                placeholder="Pega tu API Key de Gemini (AIzaSy...) o ChatGPT (sk-...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all shrink-0 active:scale-95"
            >
              Guardar Clave IA
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
              ✨ <strong>Google Gemini:</strong> Claves que empiezan con <code className="text-purple-300">AIzaSy...</code>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
              🤖 <strong>OpenAI ChatGPT:</strong> Claves que empiezan con <code className="text-blue-300">sk-...</code>
            </span>
          </div>
        </form>
      </div>

      {/* Initial Base Balance Config */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-800">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <HardDrive size={18} className="text-emerald-400" />
          Saldo Base de Apertura
        </h3>
        <p className="text-xs text-slate-400">
          Monto base inicial de efectivo / banco disponible con el que inicias la app.
        </p>

        <form onSubmit={handleSaveInitialBalance} className="flex gap-3 max-w-md">
          <input
            type="number"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400"
          >
            Guardar Saldo
          </button>
        </form>
      </div>

      {/* Data Export & Backup */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-800">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Copia de Seguridad & Exportación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportJSON}
            className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <Download size={20} />
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                JSON Completo
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Exportar Backup JSON
            </h4>
            <p className="text-xs text-slate-400">
              Guarda todas tus tarjetas, movimientos, metas y configuraciones en un solo archivo.
            </p>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between text-blue-400">
              <Download size={20} />
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                CSV Movimientos
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Exportar a Excel / CSV
            </h4>
            <p className="text-xs text-slate-400">
              Genera una hoja de cálculo con el historial completo de tus transacciones.
            </p>
          </button>
        </div>
      </div>

      {/* Import JSON */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-800">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Restaurar Datos desde Backup
        </h3>
        <p className="text-xs text-slate-400">
          Carga un archivo JSON previamente exportado para recuperar tu información.
        </p>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer transition-colors">
          <Upload size={16} />
          <span>Seleccionar Archivo JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Reset & Dangerous Zone */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-rose-500/30 bg-rose-950/10">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <AlertTriangle size={18} className="text-rose-400" />
          Zona de Riesgo & Reinicio
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-400 hover:bg-amber-950/40 hover:border-amber-500 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={15} />
            <span>Restablecer Datos Demo (COP)</span>
          </button>

          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-500 flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
          >
            <Trash2 size={15} />
            <span>Borrar Todos los Datos</span>
          </button>
        </div>
      </div>

      {/* Reset to Seed Confirmation */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Restablecer Datos Demo"
        subtitle="¿Deseas restaurar la información predeterminada en Pesos Colombianos?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Esto reemplazará tus datos actuales con los datos de ejemplo iniciales (Saldo $587.000, Addi, SOAT, Moto y Objetivos).
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                resetToSeedData();
                setIsResetConfirmOpen(false);
              }}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Confirmar Reinicio
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation */}
      <Modal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="⚠️ ELIMINAR TODO DE FORMA PERMANENTE"
        subtitle="¿Estás completamente seguro de borrar toda tu información?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Esta acción eliminará de forma irreversible todas tus transacciones, tarjetas, presupuestos y objetivos guardados en localStorage.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsClearConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                clearAllData();
                setIsClearConfirmOpen(false);
              }}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20"
            >
              Sí, Borrar Todo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
