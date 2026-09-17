import React, { useState } from 'react';
import { Bot, Sparkles, Send, CheckCircle2, Zap } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { calculateFinancialSummary } from '../../domain/calculations';
import { formatCOP } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dates';
import { parseAiNaturalCommand } from '../../domain/aiActionParser';

export const LocalAiAdvisor: React.FC = () => {
  const {
    transactions,
    obligations,
    creditCards,
    goals,
    initialBalance,
    dineroApartado,
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
      text: '🤖 Hola, soy tu Asistente de IA Financiera Local (100% privado). Puedes preguntarme cosas o darme órdenes como "abone 50 mil de addi", "gané 80k en uber" o "pagué 15k de gasolina" y lo registraré solo por ti.',
    },
  ]);

  const PRESET_PROMPTS = [
    '⚡ Aboné 50 mil a Addi',
    '🚗 Gané $70.000 en Uber',
    '⛽ Pagué 15k de gasolina',
    '¿Me conviene pagar Addi anticipado?',
  ];

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
              // Partial payment: reduce remaining obligation amount
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

    // 2. Rule-based Local AI Response Generator (Consultations)
    let reply = '';
    const qLower = query.toLowerCase();

    if (qLower.includes('addi') || qLower.includes('anticipado')) {
      reply = `⚡ Análisis Addi: Tienes un crédito de $140.553 en 3 cuotas (~$46.851/mes). Tu saldo libre actual es ${formatCOP(
        summary.realmenteLibre
      )}. Sí te conviene hacer el pago anticipado si quieres liberar $46.851 de cuota mensual durante los próximos 3 meses.`;
    } else if (qLower.includes('saldo') || qLower.includes('libre')) {
      reply = `📊 Situación actual: Tu saldo en Bancolombia es ${formatCOP(
        summary.saldoDisponible
      )}. Tienes ${formatCOP(summary.dineroApartado)} apartado y tu dinero realmente libre es ${formatCOP(
        summary.realmenteLibre
      )} (${formatCOP(summary.puedesGastarHoy)}/día).`;
    } else if (qLower.includes('septiembre') || qLower.includes('terminar')) {
      reply = `🗓️ Para terminar septiembre tienes pendientes los almuerzos de la 2ª quincena ($200k), mercado grande ($250k), Movistar ($35k) y Universidad ($350k). Con tu nómina libre de $680k y tus días de Uber estarás en margen positivo.`;
    } else {
      reply = `💡 Basado en tus datos locales: Mantienes ${formatCOP(
        summary.realmenteLibre
      )} libres hoy. Puedes pedirme "pagué 15k de gasolina" o "abone 50 mil a addi" y lo registraré automáticamente.`;
    }

    setMessages([...newMessages, { sender: 'ai', text: reply }]);
  };

  return (
    <div className="glass-card p-5 rounded-3xl border border-purple-500/30 space-y-4 bg-gradient-to-b from-slate-900 to-purple-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-purple-300 font-extrabold text-base">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <Bot size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">
              Antigravity AI Assistant
            </h4>
            <span className="text-[10px] text-purple-400 font-semibold">
              Inteligencia Financiera Local (Comandos de Voz/Texto)
            </span>
          </div>
        </div>
        <Sparkles size={18} className="text-purple-400" />
      </div>

      {/* Messages Window */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl space-y-1 ${
              m.sender === 'user'
                ? 'bg-purple-600 text-white ml-8 font-semibold'
                : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
            }`}
          >
            <div>{m.text}</div>
            {m.actionExecuted && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold mt-1 pt-1 border-t border-slate-800">
                <CheckCircle2 size={13} />
                <span>{m.actionExecuted}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preset Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 transition-all flex items-center gap-1"
          >
            <Zap size={11} className="text-amber-400" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ej: 'abone 50 mil de addi', 'gané 70k en uber'..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
