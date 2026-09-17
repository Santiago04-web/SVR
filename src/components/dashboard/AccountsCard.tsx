import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Landmark,
  Banknote,
  Smartphone,
  Sparkles,
  ArrowRightLeft,
  Edit2,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCOP } from '../../utils/formatters';
import { BankAccount } from '../../types/finance';

export const AccountsCard: React.FC = () => {
  const {
    accounts,
    updateAccountBalance,
    transferBetweenAccounts,
    isPrivacyMode,
  } = useFinanceStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setIsTransferring(false);
      }
    };
    if (isEditing || isTransferring) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, isTransferring]);

  // Edit balances state
  const [editingBalances, setEditingBalances] = useState<{ [id: string]: string }>({});

  // Transfer state
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || 'bancolombia');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || 'efectivo');
  const [transferAmount, setTransferAmount] = useState('50000');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const totalAllAccounts = (accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleStartEdit = () => {
    const initial: { [id: string]: string } = {};
    (accounts || []).forEach((a) => {
      initial[a.id] = a.balance.toString();
    });
    setEditingBalances(initial);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    (accounts || []).forEach((a) => {
      const val = parseFloat(editingBalances[a.id]);
      if (!isNaN(val) && val >= 0) {
        updateAccountBalance(a.id, val);
      }
    });
    setIsEditing(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0 || fromAccountId === toAccountId) return;

    transferBetweenAccounts(fromAccountId, toAccountId, amt);
    setTransferSuccess(true);
    setTimeout(() => {
      setTransferSuccess(false);
      setIsTransferring(false);
    }, 1500);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bancolombia':
        return <Landmark size={18} className="text-emerald-400" />;
      case 'efectivo':
        return <Banknote size={18} className="text-amber-400" />;
      case 'nequi':
        return <Smartphone size={18} className="text-pink-400" />;
      case 'nu':
        return <Sparkles size={18} className="text-purple-400" />;
      default:
        return <Wallet size={18} className="text-indigo-400" />;
    }
  };

  return (
    <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">
              Distribución por Bancos y Bolsillos
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Efectivo, Bancolombia, Nequi & Nu
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferring(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowRightLeft size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Transferir</span>
          </button>
          <button
            onClick={handleStartEdit}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Editar saldos"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(accounts || []).map((acc) => (
          <div
            key={acc.id}
            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: acc.color }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 truncate">
                {acc.name}
              </span>
              {getAccountIcon(acc.type)}
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              {isPrivacyMode ? '$ ••••••' : formatCOP(acc.balance)}
            </div>
          </div>
        ))}
      </div>

      {/* Total Footer */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-semibold">Total Líquido en Cuentas:</span>
        <span className="font-extrabold text-emerald-400 text-sm">
          {isPrivacyMode ? '$ ••••••' : formatCOP(totalAllAccounts)}
        </span>
      </div>

      {/* Modal Edit Balances */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card p-6 rounded-3xl max-w-sm w-full border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">Editar Saldos de Cuentas</h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {(accounts || []).map((acc) => (
                <div key={acc.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    {getAccountIcon(acc.type)}
                    <span>{acc.name}</span>
                  </label>
                  <input
                    type="number"
                    value={editingBalances[acc.id] || ''}
                    onChange={(e) =>
                      setEditingBalances({ ...editingBalances, [acc.id]: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1"
              >
                <Check size={14} />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transfer Between Accounts */}
      {isTransferring && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleExecuteTransfer}
            className="glass-card p-6 rounded-3xl max-w-sm w-full border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-indigo-400" />
                <span>Transferir Entre Cuentas</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsTransferring(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {transferSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                🎉 ¡Transferencia realizada con éxito!
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Origen:</label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                  >
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCOP(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Destino:</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                  >
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCOP(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Monto ($):</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                    placeholder="Ej. 50000"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferring(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/20"
                  >
                    <Check size={14} />
                    <span>Transferir</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
