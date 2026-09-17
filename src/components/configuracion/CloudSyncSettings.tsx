import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Key,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  SupabaseConfig,
} from '../../services/supabaseClient';
import { cloudSyncEngine, CloudSyncStatus } from '../../services/cloudSyncEngine';

export const CloudSyncSettings: React.FC = () => {
  const [config, setConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(cloudSyncEngine.getStatus());
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const unsub = cloudSyncEngine.onStatusChange((s, msg) => {
      setSyncStatus(s);
      if (msg) setStatusMsg(msg);
    });
    return unsub;
  }, []);

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updated = {
      ...config,
      isEnabled: true,
      syncPin: config.syncPin.trim() || 'svr-2026',
    };

    saveStoredSupabaseConfig(updated);
    setConfig(updated);

    await cloudSyncEngine.init();
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleManualSyncNow = async () => {
    setIsSaving(true);
    await cloudSyncEngine.pushLocalToRemote();
    setIsSaving(false);
  };

  const handleDisconnect = () => {
    const disabled = { ...config, isEnabled: false };
    saveStoredSupabaseConfig(disabled);
    setConfig(disabled);
    cloudSyncEngine.disconnect();
  };

  const SQL_SNIPPET = `-- Ejecuta esto en el SQL Editor de Supabase (1 solo clic)
CREATE TABLE IF NOT EXISTS public.user_finances (
  vault_id TEXT PRIMARY KEY,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_finances;

-- Permitir lectura y escritura con tu Anon Key
ALTER TABLE public.user_finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso publico por vault_id" ON public.user_finances FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6 border border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-indigo-950/20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Sincronización en Tiempo Real (Celular ↔ PC)</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
                Supabase
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tus gastos y cambios se sincronizan en vivo entre tu teléfono y tu computador al instante.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border ${
            syncStatus === 'synced'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : syncStatus === 'syncing' || syncStatus === 'connecting'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : syncStatus === 'error'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
        >
          {syncStatus === 'synced' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>🟢 Conectado en Vivo</span>
            </>
          ) : syncStatus === 'syncing' || syncStatus === 'connecting' ? (
            <>
              <RefreshCw size={14} className="animate-spin text-amber-400" />
              <span>Sincronizando...</span>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <CloudOff size={14} className="text-rose-400" />
              <span>Error de Conexión</span>
            </>
          ) : (
            <>
              <CloudOff size={14} />
              <span>Modo Local (Offline)</span>
            </>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          {statusMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveAndConnect} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={config.anonKey}
              onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key size={14} className="text-amber-400" />
              PIN / Código de Bóveda Compartida
            </span>
            <p className="text-[11px] text-slate-400">
              Coloca el mismo PIN en tu PC y en tu Celular para que ambos compartan la misma información.
            </p>
          </div>

          <input
            type="text"
            value={config.syncPin}
            onChange={(e) => setConfig({ ...config, syncPin: e.target.value.trim() })}
            placeholder="svr-2026"
            className="w-40 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 text-center tracking-wider"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Abrir Panel Supabase</span>
              <ExternalLink size={13} />
            </a>
            {config.isEnabled && (
              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} className={isSaving ? 'animate-spin' : ''} />
                <span>Forzar Subida Ahora</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {config.isEnabled && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                Desconectar
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || !config.url || !config.anonKey}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <CloudCheck size={16} />
              <span>{isSaving ? 'Conectando...' : 'Guardar y Activar Sincronización'}</span>
            </button>
          </div>
        </div>
      </form>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <Check size={16} />
          <span>¡Configuración guardada! Sincronizando con Supabase...</span>
        </div>
      )}

      {/* SQL Setup Instructions */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" />
            Paso Inicial en Supabase (Solo 1 vez en el SQL Editor):
          </span>
          <button
            type="button"
            onClick={handleCopySql}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            {copiedSql ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedSql ? '¡Copiado!' : 'Copiar Código SQL'}</span>
          </button>
        </div>

        <pre className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto">
          {SQL_SNIPPET}
        </pre>
      </div>
    </div>
  );
};
