import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-green-400" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
      default:
        return <AlertCircle className="text-blue-400" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%', scale: 0.9 }}
      animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
      exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.9 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
      onClick={onClose}
      className={`fixed top-10 left-1/2 z-[99999] flex min-w-[320px] cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] ${getBgColor()}`}
      style={{ zIndex: 99999 }}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="text-sm font-medium text-[#F2F3F5]">{message}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-4 rounded-full p-1.5 text-[#949BA4] hover:bg-white/10 hover:text-[#F2F3F5] transition-colors"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
};
