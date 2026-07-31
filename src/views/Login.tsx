import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, RefreshCw, Globe } from 'lucide-react';
import { Toast, ToastType } from './Toast';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin: (groupID: string, username: string, rule: number) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setToast(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.groupID, data.username, data.rule);
      } else {
        setToast({ message: data.error || t('login.failed'), type: 'error' });
      }
    } catch (err) {
      setToast({ message: t('login.connectionError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#313338] p-4">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl bg-[#2B2D31] p-8 shadow-2xl border border-[#1E1F22] relative"
      >
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-md bg-[#1E1F22] px-3 py-1.5 text-xs font-bold text-[#DBDEE1] hover:bg-[#3F4147] transition-all border border-[#1E1F22]"
        >
          <Globe size={14} />
          {i18n.language === 'vi' ? 'VI' : 'EN'}
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5865F2] shadow-lg">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login.welcome')}</h1>
          <p className="text-[#949BA4]">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs mb-2 font-bold uppercase tracking-wider text-[#B5BAC1]">
              {t('login.username')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949BA4]" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md bg-[#1E1F22] py-2.5 pl-10 pr-4 text-[#DBDEE1] focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
                placeholder={t('login.usernamePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs mb-2 font-bold uppercase tracking-wider text-[#B5BAC1]">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949BA4]" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-[#1E1F22] py-2.5 pl-10 pr-4 text-[#DBDEE1] focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-[#5865F2] py-3 font-bold text-white transition-all hover:bg-[#4752C4] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                {t('login.processing')}
              </>
            ) : (
              t('login.submit')
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
