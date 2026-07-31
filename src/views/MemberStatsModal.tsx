import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, ChevronDown, RefreshCw, Gamepad2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, Weapon } from '../models';
import { RANKS, WEAPONS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { RankFrame } from './RankFrame';
import { WeaponIcon } from './WeaponIcon';
import { Tooltip } from './Tooltip';
import { ToastType } from './Toast';

const CustomWeaponSelect = ({ value, onChange, label }: { value: Weapon, onChange: (w: Weapon) => void, label?: string }) => {
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
    <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
      {label && <label className="text-[10px] font-bold text-[#949BA4] uppercase">{label}</label>}
      <div 
        className="flex items-center justify-between gap-2 rounded bg-black border border-[#3F4147] p-2 cursor-pointer hover:border-[#5865F2] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {value.icon ? <WeaponIcon icon={value.icon} name={t(value.name)} size={24} /> : <div className="w-6 h-6 rounded-full bg-[#3F4147]" />}
          <span className="text-xs text-[#DBDEE1] font-medium">{t(value.name)}</span>
        </div>
        <ChevronDown size={16} className={`text-[#949BA4] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md bg-black border border-[#3F4147] shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
          >
            {Object.values(WEAPONS).map(w => (
              <div 
                key={w.id}
                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-[#3F4147] transition-colors ${value.id === w.id ? 'bg-[#5865F2]/20' : ''}`}
                onClick={() => {
                  onChange(w);
                  setIsOpen(false);
                }}
              >
                {w.icon ? <WeaponIcon icon={w.icon} name={t(w.name)} size={28} /> : <div className="w-7 h-7 rounded-full bg-[#3F4147]" />}
                <span className="text-xs text-[#DBDEE1]">{t(w.name)}</span>
                {value.id === w.id && <Check size={14} className="ml-auto text-[#5865F2]" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MemberStatsModal = ({ 
  member, 
  onClose, 
  onUpdate,
  groupID,
  showToast,
  source,
  onSaveSetup
}: { 
  member: Member | null; 
  onClose: () => void; 
  onUpdate: (m: Member) => void;
  groupID: string;
  showToast: (message: string, type?: ToastType) => void;
  source?: 'unassigned' | 'setup' | null;
  onSaveSetup?: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const [localMember, setLocalMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setLocalMember({ ...member });
    }
  }, [member]);

  if (!localMember) return null;

  const handleToggleSecondaryWeapon = (weapon: Weapon) => {
    const isSelected = localMember.secondaryWeapons.some(w => w.id === weapon.id);
    let newSecondary;
    if (isSelected) {
      newSecondary = localMember.secondaryWeapons.filter(w => w.id !== weapon.id);
    } else {
      newSecondary = [...localMember.secondaryWeapons, weapon];
    }
    setLocalMember({ ...localMember, secondaryWeapons: newSecondary });
  };

  const handleSave = async () => {
    if (!localMember) return;
    setIsSaving(true);
    try {
      // Update local state first
      onUpdate(localMember);

      if (source === 'setup') {
        // Save directly to setup JSON
        if (onSaveSetup) {
          await onSaveSetup();
        }
      } else {
        // Save to local directory database (global members config)
        const response = await fetch(`/api/members-config/${groupID}`);
        if (!response.ok) throw new Error('Failed to load member configs');
        const contentType = response.headers.get('content-type');
        const configs = (contentType && contentType.includes('application/json')) ? await response.json() : {};
        
        configs[localMember.id] = {
          role: localMember.role,
          position: localMember.position,
          primaryWeapon1Id: localMember.primaryWeapon1.id,
          primaryWeapon2Id: localMember.primaryWeapon2.id,
          secondaryWeaponIds: localMember.secondaryWeapons.map(w => w.id),
          rankId: localMember.rank.id,
          note: localMember.note,
          ingameName: localMember.ingameName,
          ingameId: localMember.ingameId,
          stats: localMember.stats,
          matchStats: localMember.matchStats,
          type: localMember.type
        };

        await fetch(`/api/members-config/${groupID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configs)
        });
      }

      showToast(t('toasts.saveMemberSuccess') || 'Đã lưu thông tin thành viên thành công!', 'success');
    } catch (error) {
      console.error("Failed to save member config:", error);
      showToast(t('toasts.saveMemberError') || 'Lỗi khi lưu thông tin thành viên!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-3xl overflow-hidden rounded-xl bg-[#313338] shadow-2xl flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner */}
          <div className="relative h-24 bg-gradient-to-r from-[#5865F2] to-[#9b59b6] z-10">
            <button 
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-black/20 p-1.5 text-white transition-colors hover:bg-black/40 z-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pb-6 relative z-20">
            {/* Avatar & Rank */}
            <div className="-mt-14 flex items-end justify-between relative z-30">
              <div className="relative">
                <RankFrame rank={localMember.rank} size={112}>
                  <img 
                    src={localMember.avatar} 
                    alt={localMember.ingameName?.trim() || localMember.name} 
                    className="h-full w-full object-cover" 
                  />
                </RankFrame>
                <div className="absolute bottom-4 right-4 h-4 w-4 rounded-full border-2 border-[#313338] bg-green-500 z-30"></div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold uppercase text-[#949BA4]">{t('ranks.title')}:</span>
                <select 
                  className="rounded border border-[#3F4147] bg-[#1E1F22] px-3 py-1.5 text-sm font-bold outline-none focus:border-[#5865F2] transition-colors"
                  style={{ color: localMember.rank.color }}
                  value={localMember.rank.id}
                  onChange={(e) => {
                    const newRank = Object.values(RANKS).find(r => r.id === e.target.value);
                    if (newRank) setLocalMember({ ...localMember, rank: newRank });
                  }}
                >
                  {Object.values(RANKS).map(r => (
                    <option key={r.id} value={r.id} style={{ color: r.color }}>{t(r.name)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Name & ID */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-[#F2F3F5]">{localMember.ingameName?.trim() || localMember.name}</h2>
                <div className="text-xs text-[#949BA4]">Discord ID: {localMember.name} ({localMember.id})</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* In-game Info Section */}
              <div className="md:col-span-2 rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Gamepad2 size={16} className="text-[#5865F2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('member.ingameInfo')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">                    
                    <div className="relative group">
                      <input 
                        type="text"
                        value={localMember.ingameName || ''}
                        onChange={(e) => setLocalMember({ ...localMember, ingameName: e.target.value })}
                        className="w-full rounded bg-black border border-[#3F4147] px-3 py-2 text-sm text-[#DBDEE1] outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]/30 transition-all"
                        placeholder={t('member.placeholderName')}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">                    
                    <div className="relative group">
                      <input 
                        type="text"
                        value={localMember.ingameId || ''}
                        onChange={(e) => setLocalMember({ ...localMember, ingameId: e.target.value })}
                        className="w-full rounded bg-black border border-[#3F4147] px-3 py-2 text-sm text-[#DBDEE1] outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]/30 transition-all"
                        placeholder={t('member.placeholderId')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('roles.title')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(role => {
                    const isSelected = localMember.role === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setLocalMember({ ...localMember, role: role.id })}
                        className={`flex items-center gap-2 rounded border p-1 transition-all ${
                          isSelected 
                            ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-md' 
                            : 'bg-[#1E1F22] border-[#3F4147] text-[#949BA4] hover:border-[#4E5058]'
                        }`}
                      >
                        <span className="text-base">{role.icon}</span>
                        <span className="text-[12px] font-bold" style={{ color: isSelected ? role.color : undefined }}>{t(role.name)}</span>
                        {isSelected && <Check size={14} className="ml-auto text-[#5865F2]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('positions.title')}</div>
                <div className="grid grid-cols-3 gap-2">
                  {POSITION_OPTIONS.map(pos => {
                    const posValue = pos.id === 'pos_cong' ? 'công' : pos.id === 'pos_thu' ? 'thủ' : 'flex';
                    const mPos = localMember.position?.toLowerCase();
                    const isSelected = mPos === posValue || mPos === pos.id;
                    return (
                      <button
                        key={pos.id}
                        onClick={() => setLocalMember({ ...localMember, position: posValue })}
                        className={`flex items-center justify-center gap-1.5 rounded border p-1 transition-all ${
                          isSelected 
                            ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-md' 
                            : 'bg-[#1E1F22] border-[#3F4147] text-[#949BA4] hover:border-[#4E5058]'
                        }`}
                      >
                        <span className="text-base">{pos.icon}</span>
                        <span className="text-[12px] font-bold" style={{ color: isSelected ? pos.color : undefined }}>{t(pos.name)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combined Weapons Panel */}
              <div className="md:col-span-2 rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5">
                <div className="mb-5 flex items-center gap-2 border-b border-[#3F4147] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('weapons.title')}</span>
                </div>
                
                <div className="flex flex-col gap-6">
                  {/* Primary Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomWeaponSelect 
                      value={localMember.primaryWeapon1} 
                      onChange={(w) => setLocalMember({ ...localMember, primaryWeapon1: w })} 
                    />
                    <CustomWeaponSelect 
                      value={localMember.primaryWeapon2} 
                      onChange={(w) => setLocalMember({ ...localMember, primaryWeapon2: w })} 
                    />
                  </div>

                  {/* Secondary Section */}
                  <div className="mt-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                      {Object.values(WEAPONS).filter(w => w.id !== 'w0').map(w => {
                        const isSelected = localMember.secondaryWeapons.some(sw => sw.id === w.id);
                        return (
                          <Tooltip key={w.id} content={t(w.name)} className="w-full">
                            <button
                              onClick={() => handleToggleSecondaryWeapon(w)}
                              className={`flex w-full items-center gap-1 rounded border p-1.5 transition-all ${
                                isSelected 
                                  ? 'bg-[#5865F2]/20 border-[#5865F2] text-white' 
                                  : 'bg-black/40 border-[#3F4147] text-[#949BA4] hover:border-[#4E5058]'
                              }`}
                            >
                              <WeaponIcon icon={w.icon} name={t(w.name)} size={24} />
                              <span className="text-[12px] font-medium truncate leading-tight">{t(w.name)}</span>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Note and Stats Section */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                  <div className="mb-4 flex flex-col gap-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.title')}</div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-[#949BA4]">
                      <div className="flex items-center gap-1.5">
                        <span>{t('stats.totalMatches')}:</span>
                        <span className="text-[#F2F3F5]">
                          {(localMember.matchStats?.League?.Win || 0) + (localMember.matchStats?.League?.Lose || 0) +
                           (localMember.matchStats?.Rated?.Win || 0) + (localMember.matchStats?.Rated?.Lose || 0) +
                           (localMember.matchStats?.Scrim?.Win || 0) + (localMember.matchStats?.Scrim?.Lose || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{t('stats.winRate')}:</span>
                        <span className="text-[#2ecc71]">
                          {(() => {
                            const totalWins = (localMember.matchStats?.League?.Win || 0) + (localMember.matchStats?.Rated?.Win || 0) + (localMember.matchStats?.Scrim?.Win || 0);
                            const totalLosses = (localMember.matchStats?.League?.Lose || 0) + (localMember.matchStats?.Rated?.Lose || 0) + (localMember.matchStats?.Scrim?.Lose || 0);
                            const totalMatches = totalWins + totalLosses;
                            return totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
                          })()}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {['League', 'Rated', 'Scrim'].map((type) => {
                      const win = localMember.matchStats?.[type as keyof typeof localMember.matchStats]?.Win || 0;
                      const lose = localMember.matchStats?.[type as keyof typeof localMember.matchStats]?.Lose || 0;
                      const total = win + lose;
                      const winRate = total > 0 ? Math.round((win / total) * 100) : 0;
                      return (
                      <div key={type} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#DBDEE1] w-16">{type}</span>
                          <span className="text-[10px] font-bold text-[#2ecc71]">{winRate}% {t('stats.win')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-[10px] text-blue-400 font-bold uppercase" title={t('stats.totalMatches')}>T</span>
                            <span className="w-full text-center text-sm font-bold text-[#DBDEE1] bg-[#1E1F22] rounded py-1 border border-[#3F4147]">{total}</span>
                          </div>
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-[10px] text-green-400 font-bold uppercase">W</span>
                            <input
                              type="number"
                              min="0"
                              value={win}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setLocalMember(prev => {
                                  if (!prev) return prev;
                                  const currentStats = prev.matchStats || {
                                    League: { Win: 0, Lose: 0 },
                                    Rated: { Win: 0, Lose: 0 },
                                    Scrim: { Win: 0, Lose: 0 }
                                  };
                                  return {
                                    ...prev,
                                    matchStats: {
                                      ...currentStats,
                                      [type]: { ...currentStats[type as keyof typeof currentStats], Win: val }
                                    }
                                  };
                                });
                              }}
                              className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-1 text-sm text-center text-[#DBDEE1] focus:outline-none focus:border-green-500"
                            />
                          </div>
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-[10px] text-red-400 font-bold uppercase">L</span>
                            <input
                              type="number"
                              min="0"
                              value={lose}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setLocalMember(prev => {
                                  if (!prev) return prev;
                                  const currentStats = prev.matchStats || {
                                    League: { Win: 0, Lose: 0 },
                                    Rated: { Win: 0, Lose: 0 },
                                    Scrim: { Win: 0, Lose: 0 }
                                  };
                                  return {
                                    ...prev,
                                    matchStats: {
                                      ...currentStats,
                                      [type]: { ...currentStats[type as keyof typeof currentStats], Lose: val }
                                    }
                                  };
                                });
                              }}
                              className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-1 text-sm text-center text-[#DBDEE1] focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner flex flex-col">
                  <div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('member.noteTitle')}</div>
                  <div className="w-full flex-1 min-h-[200px] rounded bg-[#1E1F22] border border-[#3F4147] p-3 text-sm text-[#DBDEE1] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {localMember.note || <span className="text-[#949BA4] italic">{t('member.noNote')}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#3F4147] bg-[#2B2D31]">
          <button 
            onClick={onClose}
            className="rounded-md px-6 py-2 text-sm font-medium text-[#DBDEE1] transition-colors hover:bg-white/5"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-[#5865F2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4] disabled:opacity-50"
          >
            {isSaving && <RefreshCw size={16} className="animate-spin" />}
            {isSaving ? t('common.saving') : t('common.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};
