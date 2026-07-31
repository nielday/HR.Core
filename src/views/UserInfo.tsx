import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface UserInfoProps {
  username: string;
  userGroup: string;
  onLogout: () => void;
  currentLanguage: string;
  onToggleLanguage: () => void;
}

export const UserInfo: React.FC<UserInfoProps> = ({ 
  username, 
  userGroup, 
  onLogout,
  currentLanguage,
  onToggleLanguage
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-md bg-[#2B2D31] px-3 py-1.5 border border-[#3F4147] hover:bg-[#3F4147] transition-all active:scale-95"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2] text-white shadow-inner">
          <User size={18} />
        </div>
        <span className="text-sm font-bold text-[#F2F3F5] leading-tight">{username || 'User'}</span>
        <ChevronDown size={14} className={`text-[#949BA4] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-[#1E1F22] bg-[#232428] shadow-xl z-[100]"
        >
          <div className="p-3 border-b border-[#1E1F22] bg-[#2B2D31]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2] text-white">
                <User size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate">{username || 'User'}</span>
                <span className="text-[10px] font-medium text-[#949BA4] uppercase tracking-wider">Group ID: {userGroup}</span>
              </div>
            </div>
          </div>
          <div className="p-1">
            <button 
              onClick={() => {
                onToggleLanguage();
              }}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-[#DBDEE1] hover:bg-[#3F4147] transition-colors mb-1"
            >
              <Globe size={16} />
              <div className="flex flex-1 items-center justify-between">
                <span>{t('common.language')}</span>
                <span className="text-xs font-bold text-[#5865F2]">{currentLanguage === 'vi' ? 'VI' : 'EN'}</span>
              </div>
            </button>
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-[#F23F42] hover:bg-[#F23F42]/10 transition-colors"
            >
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
