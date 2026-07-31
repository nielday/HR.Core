import React, { useState } from 'react';
import { X, RefreshCw, Loader2 } from 'lucide-react';
import { Team } from '../models';
import { WEAPONS, RANKS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { WeaponIcon } from './WeaponIcon';
import { useTranslation } from 'react-i18next';

interface ItemRowProps {
  id: string;
  name: string;
  icon?: any;
  reqs: Record<string, number>;
  onUpdate: (id: string, val: number) => void;
  isRank?: boolean;
  isWeapon?: boolean;
  isPosition?: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({ 
  id, 
  name, 
  icon, 
  reqs, 
  onUpdate, 
  isRank = false, 
  isWeapon = false,
  isPosition = false
}) => (
  <div className="flex items-center justify-between rounded-md bg-[#1E1F22] p-2 border border-[#2B2D31] hover:border-[#3F4147] transition-colors">
    <div className="flex items-center gap-2 overflow-hidden">
      {isWeapon && icon ? (
        <WeaponIcon icon={icon} name={name} size={24} className="shrink-0" />
      ) : isRank ? (
        <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: icon }}></div>
      ) : isPosition ? (
        <span className="text-base leading-none shrink-0">{icon}</span>
      ) : (
        <span className="text-base leading-none shrink-0">{icon}</span>
      )}
      <span className="truncate text-xs font-medium text-[#DBDEE1]" title={name}>{name}</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0 ml-2">
      <button 
        onClick={() => onUpdate(id, (reqs[id] || 0) - 1)}
        className="flex h-7 w-7 items-center justify-center rounded bg-[#2B2D31] text-[#DBDEE1] hover:bg-[#3F4147] active:scale-95 transition-transform text-sm font-bold"
      >-</button>
      <span className="w-4 text-center text-xs font-bold text-[#F2F3F5]">{reqs[id] || 0}</span>
      <button 
        onClick={() => onUpdate(id, (reqs[id] || 0) + 1)}
        className="flex h-7 w-7 items-center justify-center rounded bg-[#2B2D31] text-[#DBDEE1] hover:bg-[#3F4147] active:scale-95 transition-transform text-sm font-bold"
      >+</button>
    </div>
  </div>
);

export const TeamSettingsModal = ({ 
  team, 
  onClose, 
  onSave,
  showToast
}: { 
  team: Team | null; 
  onClose: () => void;
  onSave: (teamId: string, requirements: Record<string, number>) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  if (!team) return null;

  const { t } = useTranslation();
  const [reqs, setReqs] = useState<Record<string, number>>(team.requirements || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(team.id, reqs);
    if (showToast) showToast(t('setup.saveConfigSuccess'), "success");
    setIsSaving(false);
    onClose();
  };

  const updateReq = (id: string, val: number) => {
    setReqs(prev => ({ ...prev, [id]: Math.max(0, val) }));
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-[#313338] shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1E1F22] bg-[#2B2D31] p-4">
          <h2 className="text-lg font-bold text-[#F2F3F5]">{t('setup.teamConfigTitle', { name: team.name })}</h2>
          <button onClick={onClose} className="text-[#949BA4] hover:text-[#DBDEE1] transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-8">
            {/* Top Section: Ranks, Roles, Positions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Ranks Section */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#1E1F22] pb-1">{t('setup.requiredRanks')}</h3>
                <div className="flex flex-col gap-2">
                  {Object.values(RANKS).map(rank => (
                    <ItemRow key={rank.id} id={rank.id} name={t(rank.name)} icon={rank.color} isRank reqs={reqs} onUpdate={updateReq} />
                  ))}
                </div>
              </div>

              {/* Roles Section */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#1E1F22] pb-1">{t('setup.requiredRoles')}</h3>
                <div className="flex flex-col gap-2">
                  {ROLE_OPTIONS.map(role => (
                    <ItemRow key={role.id} id={role.id} name={t(role.name)} icon={role.icon} reqs={reqs} onUpdate={updateReq} />
                  ))}
                </div>
              </div>

              {/* Positions Section */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#1E1F22] pb-1">{t('setup.requiredPositions')}</h3>
                <div className="flex flex-col gap-2">
                  {POSITION_OPTIONS.map(pos => (
                    <ItemRow key={pos.id} id={pos.id} name={t(pos.name)} icon={pos.icon} isPosition reqs={reqs} onUpdate={updateReq} />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Weapons */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#1E1F22] pb-1">{t('setup.requiredWeapons')}</h3>
              <div 
                className="grid grid-rows-5 grid-flow-col gap-x-4 gap-y-2 overflow-x-auto custom-scrollbar pb-2" 
                dir="rtl"
              >
                {Object.values(WEAPONS).filter(w => w.id !== 'w0').map(weapon => (
                  <div key={weapon.id} dir="ltr" className="min-w-[200px]">
                    <ItemRow id={weapon.id} name={t(weapon.name)} icon={weapon.icon} isWeapon reqs={reqs} onUpdate={updateReq} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-[#1E1F22] bg-[#2B2D31] p-4">
          <button 
            onClick={() => setReqs({})}
            className="flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <RefreshCw size={14} />
            {t('setup.reset')}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-[#DBDEE1] hover:bg-white/5 transition-colors"
            >
              {t('setup.cancel')}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-[#5865F2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4] disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {t('setup.saveConfig')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
