import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'League' | 'Rated' | 'Scrim', result: 'Win' | 'Lose') => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [matchType, setMatchType] = useState<'League' | 'Rated' | 'Scrim'>('League');
  const [matchResult, setMatchResult] = useState<'Win' | 'Lose'>('Win');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(matchType, matchResult);
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md overflow-hidden rounded-xl bg-[#313338] shadow-2xl flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#3F4147] bg-[#2B2D31] px-6 py-4">
          <h2 className="text-lg font-bold text-[#F2F3F5]">{t('setup.confirmResult')}</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-[#949BA4] transition-colors hover:bg-[#3F4147] hover:text-[#DBDEE1]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Match Type */}
          <div>
            <label className="mb-3 block text-xs font-bold uppercase text-[#949BA4]">{t('setup.matchType')}</label>
            <div className="grid grid-cols-3 gap-3">
              {['League', 'Rated', 'Scrim'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMatchType(type as any)}
                  className={`rounded-md py-2 text-sm font-bold transition-all ${
                    matchType === type 
                      ? 'bg-[#5865F2] text-white shadow-md' 
                      : 'bg-[#1E1F22] border border-[#3F4147] text-[#949BA4] hover:border-[#4E5058]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Match Result */}
          <div>
            <label className="mb-3 block text-xs font-bold uppercase text-[#949BA4]">{t('setup.matchResult')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMatchResult('Win')}
                className={`rounded-md py-3 text-sm font-bold transition-all ${
                  matchResult === 'Win' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-[#1E1F22] border border-[#3F4147] text-[#949BA4] hover:border-green-500/50'
                }`}
              >
                {t('setup.win')}
              </button>
              <button
                onClick={() => setMatchResult('Lose')}
                className={`rounded-md py-3 text-sm font-bold transition-all ${
                  matchResult === 'Lose' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-[#1E1F22] border border-[#3F4147] text-[#949BA4] hover:border-red-500/50'
                }`}
              >
                {t('setup.lose')}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#3F4147] bg-[#2B2D31]">
          <button 
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-md px-6 py-2 text-sm font-medium text-[#DBDEE1] transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {t('setup.cancel')}
          </button>
          <motion.button 
            onClick={handleConfirm}
            disabled={isConfirming}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-md bg-[#5865F2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4] disabled:opacity-50"
          >
            {isConfirming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {isConfirming ? t('setup.confirming') : t('setup.confirm')}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
