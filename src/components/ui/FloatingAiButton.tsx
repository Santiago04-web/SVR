import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { AiAssistantModal } from './AiAssistantModal';

export const FloatingAiButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-20 sm:right-24 z-40 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/40 border border-purple-400/30 active:scale-95 transition-all group"
        title="Abrir Asistente IA Financiera"
      >
        <div className="p-1 rounded-xl bg-white/20 group-hover:scale-110 transition-transform">
          <Bot size={16} />
        </div>
        <span className="hidden sm:inline">IA Asistente</span>
        <Sparkles size={14} className="text-amber-300 animate-pulse" />
      </button>

      {/* AI Assistant Modal */}
      <AiAssistantModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
