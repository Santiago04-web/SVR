import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Zap,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dates';
import {
  parseAiNaturalCommand,
  generateIntelligentAiReply,
} from '../../domain/aiActionParser';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
    debts,
    addTransaction,
    markObligationPaid,
    updateObligation,
    setDineroApartado,
  } = useFinanceStore();

  const summary = calculateFinancialSummary(
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado
  );

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'ai' | 'user'; text: string; actionExecuted?: string }[]
  >([
    {
      sender: 'ai',
      text: '🤖 **¡Hola! Soy tu Asistente Financiero Antigravity (100% Privado).**\n\nPuedes hacerme preguntas o darme órdenes en lenguaje natural como:\n• *"abone 50 mil de addi"*\n• *"gané 80k en uber"*\n• *"pagué 15k de gasolina"*\n• *"¿cuánto me queda libre hoy?"*',
    },
  ]);

  const PRESET_PROMPTS = [
    '⚡ Aboné $50.000 a Addi',
    '🚗 Gané $70.000 en Uber',
    '⛽ Pagué 15k de gasolina',
    '💰 ¿Cuánto dinero tengo libre?',
    '🏍️ Estado de la moto',
  ];

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const newMessages = [...messages, { sender: 'user' as const, text: query }];
    setInputMessage('');

    // 1. Try parsing natural command intent (Action execution)
    const actionResult = parseAiNaturalCommand(query, obligations);

    if (actionResult) {
      let executionNote = '';

      if (actionResult.type === 'PAY_OBLIGATION') {
        const today = getTodayISO();

        // Register transaction
        addTransaction({
          description: actionResult.description,
          amount: actionResult.amount,
          type: 'gasto',
          category: actionResult.category || 'Servicios',
          date: today,
          paymentMethod: actionResult.paymentMethod || 'debito',
          status: 'completado',
        });

        // Mark obligation or adjust amount
        if (actionResult.obligationId) {
          const obl = obligations.find((o) => o.id === actionResult.obligationId);
          if (obl) {
            if (actionResult.amount >= obl.amount) {
              markObligationPaid(obl.id, true);
            } else {
              updateObligation({
                ...obl,
                amount: Math.max(0, obl.amount - actionResult.amount),
              });
            }
          }
        }
        executionNote = `Abono de ${formatCOP(actionResult.amount)} registrado`;
      } else if (actionResult.type === 'ADD_EXPENSE') {
        addTransaction({
          description: actionResult.description,
          amount: actionResult.amount,
          type: 'gasto',
          category: actionResult.category || 'Otros',
          date: getTodayISO(),
          paymentMethod: actionResult.paymentMethod || 'debito',
          status: 'completado',
        });
        executionNote = `Gasto de ${formatCOP(actionResult.amount)} registrado`;
      } else if (actionResult.type === 'ADD_INCOME') {
        addTransaction({
          description: actionResult.description,
          amount: actionResult.amount,
          type: 'ingreso',
          category: actionResult.category || 'Transporte',
          date: getTodayISO(),
          paymentMethod: actionResult.paymentMethod || 'efectivo',
          status: 'completado',
        });
        executionNote = `Ingreso de ${formatCOP(actionResult.amount)} registrado`;
      } else if (actionResult.type === 'RESERVE_MONEY') {
        setDineroApartado(actionResult.amount);
        executionNote = `Dinero apartado fijado en ${formatCOP(actionResult.amount)}`;
      }

      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: actionResult.feedbackText,
          actionExecuted: executionNote,
        },
      ]);
      return;
    }

    // 2. Intelligent Ai Reply Generator
    const reply = generateIntelligentAiReply(
      query,
      summary,
      obligations,
      creditCards,
      debts
    );

    setMessages([...newMessages, { sender: 'ai', text: reply }]);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="glass-card w-full sm:max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl border border-purple-500/30 flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/30 shadow-2xl shadow-purple-950/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-none flex items-center gap-1.5">
                <span>IA Financiera Antigravity</span>
                <Sparkles size={14} className="text-purple-400 animate-pulse" />
              </h3>
              <span className="text-[11px] text-purple-300/80 font-medium">
                Asistente inteligente 100% privado y en tiempo real
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-1 max-w-[88%] ${
                m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md shadow-purple-600/20 rounded-br-none'
                    : 'bg-slate-900/90 border border-purple-500/20 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.actionExecuted && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-extrabold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 size={13} />
                  <span>{m.actionExecuted}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-purple-500/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/60 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Zap size={12} className="text-amber-400" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-purple-500/20 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe o pide algo (ej. 'abone 50 mil a addi')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
            autoFocus
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shrink-0 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
