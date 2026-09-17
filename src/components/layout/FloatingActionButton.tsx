import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-300/40 cursor-pointer"
      aria-label="Registrar movimiento"
    >
      <Plus size={28} strokeWidth={2.8} />
    </motion.button>
  );
};
