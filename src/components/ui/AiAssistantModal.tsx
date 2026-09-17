import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Zap,
  Key,
  ExternalLink,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dates';
import {
  askGeminiFinancialAdvisor,
  getGeminiApiKey,
  saveGeminiApiKey,
} from '../../services/geminiService';
import {
  parseAiNaturalCommand,
  generateIntelligentAiReply,
} from '../../domain/aiActionParser';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  actionExecuted?: string;
  isGemini?: boolean;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
    debts,
    accounts,
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
  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [tempApiKey, setTempApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'model'; parts: { text: string }[] }[]
  >([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `✨ **¡Hola! Soy tu Asistente Financiero con Inteligencia Artificial Google Gemini 1.5 Flash.**\n\nTengo acceso en tiempo real a tus cuentas ($${summary.saldoDisponible.toLocaleString('es-CO')}), obligaciones, Addi, tu moto y quincenas.\n\nPuedes preguntarme análisis profundos o darme órdenes directas como:\n• *"¿Cuánto es lo máximo que puedo gastar con la tarjeta sin embalarme?"*\n• *"Registra que gané 80 mil en uber y gasté 15k de gasolina en efectivo"*\n• *"¿Me conviene prepagar la deuda de Addi hoy?"*`,
      isGemini: true,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setApiKey(getGeminiApiKey());
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSaveApiKey = () => {
    saveGeminiApiKey(tempApiKey);
    setApiKey(tempApiKey.trim());
    setShowConfig(false);
    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: '✅ **API Key de Gemini configurada con éxito.** Ahora estoy operando con la inteligencia profunda de **Google Gemini 1.5 Flash**.',
        isGemini: true,
      },
    ]);
  };

  const executeAction = (action: {
    type: 'ADD_TRANSACTION' | 'PAY_OBLIGATION' | 'SET_RESERVE';
    data: any;
    feedbackText: string;
  }) => {
    let note = action.feedbackText;

    if (action.type === 'ADD_TRANSACTION') {
      const { description, amount, type, category, paymentMethod, accountId } = action.data;
      addTransaction({
        description: description || 'Movimiento IA',
        amount: Number(amount) || 0,
        type: type === 'ingreso' ? 'ingreso' : 'gasto',
        category: category || (type === 'ingreso' ? 'Transporte' : 'Otros'),
        date: getTodayISO(),
        paymentMethod: paymentMethod || 'debito',
        accountId: accountId || (paymentMethod === 'efectivo' ? 'efectivo' : 'bancolombia'),
        status: 'completado',
      });
      note = `✅ Registrado: ${description} por ${formatCOP(amount)}`;
    } else if (action.type === 'PAY_OBLIGATION') {
      const { obligationId, amount, description } = action.data;
      const today = getTodayISO();

      addTransaction({
        description: description || 'Abono Obligación',
        amount: Number(amount) || 0,
        type: 'gasto',
        category: 'Servicios',
        date: today,
        paymentMethod: 'debito',
        accountId: 'bancolombia',
        status: 'completado',
      });

      if (obligationId) {
        const obl = obligations.find((o) => o.id === obligationId);
        if (obl) {
          if (amount >= obl.amount) {
            markObligationPaid(obl.id, true);
          } else {
            updateObligation({
              ...obl,
              amount: Math.max(0, obl.amount - amount),
            });
          }
        }
      }
      note = `✅ Abono de ${formatCOP(amount)} aplicado`;
    } else if (action.type === 'SET_RESERVE') {
      setDineroApartado(Number(action.data.amount) || 0);
      note = `🔒 Reserva fijada en ${formatCOP(action.data.amount)}`;
    }

    return note;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const activeKey = getGeminiApiKey();

    if (activeKey) {
      try {
        const response = await askGeminiFinancialAdvisor(
          query,
          {
            summary,
            accounts,
            obligations,
            creditCards,
            debts,
            transactions,
          },
          chatHistory
        );

        let executionBadge: string | undefined = undefined;
        if (response.action) {
          executionBadge = executeAction(response.action);
        }

        setChatHistory((prev) => [
          ...prev,
          { role: 'user', parts: [{ text: query }] },
          { role: 'model', parts: [{ text: response.replyText }] },
        ]);

        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: response.replyText,
            actionExecuted: executionBadge,
            isGemini: true,
          },
        ]);
        setIsLoading(false);
        return;
      } catch (err: any) {
        console.warn('Gemini request failed, falling back to local engine:', err);
      }
    }

    // Fallback: Smart local parsing & instant reply
    const actionResult = parseAiNaturalCommand(query, obligations);
    if (actionResult) {
      let executionNote = '';

      if (actionResult.type === 'PAY_OBLIGATION') {
        const today = getTodayISO();
        addTransaction({
          description: actionResult.description,
          amount: actionResult.amount,
          type: 'gasto',
          category: actionResult.category || 'Servicios',
          date: today,
          paymentMethod: actionResult.paymentMethod || 'debito',
          accountId: 'bancolombia',
          status: 'completado',
        });

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
          accountId: actionResult.paymentMethod === 'efectivo' ? 'efectivo' : 'bancolombia',
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
          accountId: 'efectivo',
          status: 'completado',
        });
        executionNote = `Ingreso de ${formatCOP(actionResult.amount)} registrado`;
      } else if (actionResult.type === 'RESERVE_MONEY') {
        setDineroApartado(actionResult.amount);
        executionNote = `Dinero apartado fijado en ${formatCOP(actionResult.amount)}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: actionResult.feedbackText,
          actionExecuted: executionNote,
          isGemini: false,
        },
      ]);
      setIsLoading(false);
      return;
    }

    const localReply = generateIntelligentAiReply(
      query,
      summary,
      obligations,
      creditCards,
      debts
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: localReply,
        isGemini: false,
      },
    ]);
    setIsLoading(false);
  };

  const PRESET_PROMPTS = [
    '💳 ¿Cuánto puedo gastar con la tarjeta?',
    '⚡ ¿Me conviene prepagar Addi?',
    '🚗 Gané $80.000 en Uber',
    '⛽ Pagué 15k de gasolina en efectivo',
    '💰 ¿Cuánto dinero tengo libre hoy?',
    '🏍️ Próximos gastos de la moto',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="glass-card w-full sm:max-w-xl h-[90vh] sm:h-[680px] rounded-t-3xl sm:rounded-3xl border border-purple-500/30 flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/30 shadow-2xl shadow-purple-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-inner">
              <Bot size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white leading-none flex items-center gap-1.5">
                  <span>Gemini AI Financiero</span>
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    apiKey
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {apiKey ? 'Gemini 1.5 Flash' : 'Motor Local'}
                </span>
              </div>
              <span className="text-[11px] text-purple-300/80 font-medium">
                Asesor financiero personal conectado a tus cuentas reales
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setShowConfig(!showConfig);
              }}
              title="Configurar Gemini API Key"
              className={`p-2 rounded-xl border transition-all ${
                showConfig
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-900 text-purple-300 border-slate-800 hover:border-purple-500/40 hover:text-white'
              }`}
            >
              <Key size={16} />
            </button>

            <button
              onClick={() => {
                setMessages([
                  {
                    sender: 'ai',
                    text: 'Conversación reiniciada. ¿Qué consulta o movimiento financiero tienes en mente?',
                    isGemini: true,
                  },
                ]);
                setChatHistory([]);
              }}
              title="Limpiar chat"
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* API Key Config Panel */}
        {showConfig && (
          <div className="p-4 bg-purple-950/40 border-b border-purple-500/30 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Key size={14} className="text-purple-400" />
                <span>Configurar Google Gemini API Key (100% Gratis)</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
              >
                Obtener Key Gratis en Google AI Studio
                <ExternalLink size={11} />
              </a>
            </div>

            <p className="text-[11px] text-slate-300">
              Pega tu clave para activar el modelo <strong>Gemini 1.5 Flash</strong>. Se almacena únicamente en tu navegador de forma segura.
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-600/30"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-1.5 max-w-[90%] sm:max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md shadow-purple-600/20 rounded-br-none'
                    : 'bg-slate-900/90 border border-purple-500/20 text-slate-100 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.actionExecuted && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-extrabold bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-sm">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>{m.actionExecuted}</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto items-start flex items-center gap-2 p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-purple-300 animate-pulse">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-xs font-semibold">Gemini está analizando tus finanzas...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-purple-500/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(p)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/60 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
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
            placeholder="Pregúntale a Gemini o pide un registro (ej. 'gané 80k en uber')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50 disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shrink-0 shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

