import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Save, Check, ChevronDown, Info, RefreshCw, Gamepad2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Member, Weapon } from '../models';
import { RANKS, WEAPONS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { RankFrame } from './RankFrame';
import { WeaponIcon } from './WeaponIcon';
import { Tooltip } from './Tooltip';
import { normalizeDiscordName } from '../utils';
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

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: Member) => Promise<void> | void;
  groupID: string;
  showToast: (message: string, type?: ToastType) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdd, groupID, showToast }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<Partial<Member>>({
    rank: RANKS.RECRUIT,
    role: 'flex',
    position: 'flex',
    primaryWeapon1: WEAPONS.NONE,
    primaryWeapon2: WEAPONS.NONE,
    secondaryWeapons: [],
    note: '',
    matchStats: {
      League: { Win: 0, Lose: 0 },
      Rated: { Win: 0, Lose: 0 },
      Scrim: { Win: 0, Lose: 0 }
    }
  });

  if (!isOpen) return null;

  const fetchDiscordInfo = async () => {
    if (!name.trim()) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/discord-user/${groupID}?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        showToast(t('setup.memberFound'), 'success');
        if (data.isGlobal) {
          setMemberData({
            id: data.id,
            name: data.name,
            avatar: data.avatar,
            role: data.role || 'flex',
            position: data.position || 'flex',
            rank: Object.values(RANKS).find(r => r.id === data.rankId) || RANKS.RECRUIT,
            primaryWeapon1: Object.values(WEAPONS).find(w => w.id === data.primaryWeapon1Id) || WEAPONS.NONE,
            primaryWeapon2: Object.values(WEAPONS).find(w => w.id === data.primaryWeapon2Id) || WEAPONS.NONE,
            secondaryWeapons: (data.secondaryWeaponIds || []).map((id: string) => Object.values(WEAPONS).find(w => w.id === id)).filter(Boolean),
            note: data.note || '',
            ingameName: data.ingameName || '',
            ingameId: data.ingameId || '',
            matchStats: data.matchStats || {
              League: { Win: 0, Lose: 0 },
              Rated: { Win: 0, Lose: 0 },
              Scrim: { Win: 0, Lose: 0 }
            }
          });
        } else {
          setMemberData(prev => ({
            ...prev,
            id: data.id,
            name: data.name,
            avatar: data.avatar
          }));
        }
        setName(data.name);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === 'Bot is not connected') {
          showToast('Bot Discord chưa kết nối. Bạn vẫn có thể nhập Tên ingame / ID ingame để lưu trực tiếp.', 'info');
        } else {
          showToast('Không tìm thấy thành viên trên Discord. Bạn vẫn có thể nhập Tên ingame / ID ingame để lưu trực tiếp.', 'error');
        }
      }
    } catch (err) {
      console.error('Error fetching discord user:', err);
      showToast(t('setup.errorSearchMember'), 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggleSecondaryWeapon = (weapon: Weapon) => {
    const current = memberData.secondaryWeapons || [];
    const isSelected = current.some(w => w.id === weapon.id);
    let newSecondary;
    if (isSelected) {
      newSecondary = current.filter(w => w.id !== weapon.id);
    } else {
      newSecondary = [...current, weapon];
    }
    setMemberData({ ...memberData, secondaryWeapons: newSecondary });
  };

  const handleSave = async () => {
    setError(null);
    const finalName = name.trim() || memberData.ingameName?.trim();
    if (!finalName) {
      setError(t('setup.errorEnterMemberName') || 'Vui lòng nhập tên thành viên hoặc tên ingame.');
      return;
    }

    const finalId = memberData.id || 'custom_' + Date.now();
    const finalAvatar = memberData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=random`;

    const newMember: Member = {
      id: finalId,
      name: normalizeDiscordName(finalName),
      avatar: finalAvatar,
      status: 'offline',
      role: memberData.role || 'flex',
      position: memberData.position || 'flex',
      rank: memberData.rank || RANKS.RECRUIT,
      primaryWeapon1: memberData.primaryWeapon1 || WEAPONS.NONE,
      primaryWeapon2: memberData.primaryWeapon2 || WEAPONS.NONE,
      secondaryWeapons: memberData.secondaryWeapons || [],
      note: memberData.note || '',
      ingameName: memberData.ingameName || '',
      ingameId: memberData.ingameId || '',
      type: 1,
      matchStats: memberData.matchStats || {
        League: { Win: 0, Lose: 0 },
        Rated: { Win: 0, Lose: 0 },
        Scrim: { Win: 0, Lose: 0 }
      }
    };

    try {
      setIsSaving(true);
      await onAdd(newMember);
      showToast(t('setup.saveSuccess'), 'success');
      onClose();
    } catch (err) {
      console.error(err);
      setError(t('setup.saveError'));
      showToast(t('setup.saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
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
            {/* Optimized Header: Avatar, Name, Rank, Discord Search */}
            <div className="-mt-14 flex flex-col gap-4 relative z-30">
              <div className="flex items-end justify-between">
                <div className="relative">
                  <RankFrame rank={memberData.rank || RANKS.RECRUIT} size={112}>
                    <img 
                      src={memberData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`} 
                      alt={name} 
                      className="h-full w-full object-cover" 
                    />
                  </RankFrame>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-[#949BA4]">{t('setup.rank')}</span>
                  <select 
                    className="rounded border border-[#3F4147] bg-[#1E1F22] px-2 py-1 text-xs font-bold outline-none"
                    style={{ color: memberData.rank?.color }}
                    value={memberData.rank?.id}
                    onChange={(e) => {
                      const newRank = Object.values(RANKS).find(r => r.id === e.target.value);
                      if (newRank) setMemberData({ ...memberData, rank: newRank });
                    }}
                  >
                    {Object.values(RANKS).map(r => (
                      <option key={r.id} value={r.id} style={{ color: r.color }}>{t(r.name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-bold uppercase text-[#949BA4]">{t('setup.memberName')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-3 text-xl font-bold text-[#F2F3F5] focus:outline-none focus:border-[#5865F2] placeholder:text-[#4E5058]"
                    placeholder={t('setup.placeholderMemberName')}
                  />
                </div>
                <motion.button
                  onClick={fetchDiscordInfo}
                  disabled={isFetching || !name.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-[50px] items-center gap-2 rounded bg-[#5865F2] px-6 font-medium text-white hover:bg-[#4752C4] disabled:opacity-50 transition-all shadow-lg shadow-[#5865F2]/20"
                >
                  {isFetching ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  {isFetching ? t('setup.searching') : 'Discord'}
                </motion.button>
              </div>

              {memberData.id && (
                <div className="text-sm text-white bg-[#5865F2]/10 p-2 rounded border border-[#5865F2]/20">
                  <Info size={14} className="inline mr-1" />
                  {t('setup.linkedDiscordId')}: {memberData.id}
                </div>
              )}

              {/* In-game Info Section */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                <div className="mb-4 flex items-center gap-2">
                  <Gamepad2 size={16} className="text-[#5865F2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.ingameInfo')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={memberData.ingameName || ''}
                      onChange={(e) => setMemberData({ ...memberData, ingameName: e.target.value })}
                      className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#F2F3F5] focus:outline-none focus:border-[#5865F2] transition-colors"
                      placeholder={t('setup.placeholderIngameName')}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={memberData.ingameId || ''}
                      onChange={(e) => setMemberData({ ...memberData, ingameId: e.target.value })}
                      className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#F2F3F5] focus:outline-none focus:border-[#5865F2] transition-colors"
                      placeholder={t('setup.placeholderIngameId')}
                    />
                  </div>
                </div>
              </div>             
              
            </div>

            {/* Optimized Body: Role, Position, Weapons, Stats, Note */}
            <div className="mt-6 flex flex-col gap-6">
              {/* Top Row: Role & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4 shadow-inner">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.role')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map(role => {
                      const isSelected = memberData.role === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setMemberData({ ...memberData, role: role.id })}
                          className={`flex items-center gap-2 rounded border p-1 transition-all ${
                            isSelected 
                              ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-md' 
                              : 'bg-[#1E1F22] border-[#3F4147] text-[#949BA4] hover:border-[#4E5058]'
                          }`}
                        >
                          <span className="text-base">{role.icon}</span>
                          <span className="text-[12px] font-bold" style={{ color: isSelected ? role.color : undefined }}>{t(role.name)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4 shadow-inner">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.position')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {POSITION_OPTIONS.map(pos => {
                      const posValue = pos.id === 'pos_cong' ? 'công' : pos.id === 'pos_thu' ? 'thủ' : 'flex';
                      const mPos = memberData.position?.toLowerCase();
                      const isSelected = mPos === posValue || mPos === pos.id;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => setMemberData({ ...memberData, position: posValue })}
                          className={`flex items-center gap-2 rounded border p-1 transition-all ${
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
              </div>

              {/* Middle Row: Weapons */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                <div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.weapons')}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <CustomWeaponSelect 
                    label={t('setup.weapon1Short')}
                    value={memberData.primaryWeapon1 || WEAPONS.NONE} 
                    onChange={(w) => setMemberData({ ...memberData, primaryWeapon1: w })} 
                  />
                  <CustomWeaponSelect 
                    label={t('setup.weapon2Short')}
                    value={memberData.primaryWeapon2 || WEAPONS.NONE} 
                    onChange={(w) => setMemberData({ ...memberData, primaryWeapon2: w })} 
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                  {Object.values(WEAPONS).filter(w => w.id !== 'w0').map(w => {
                    const isSelected = (memberData.secondaryWeapons || []).some(sw => sw.id === w.id);
                    return (
                      <Tooltip key={w.id} content={t(w.name)}>
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

              {/* Bottom Row: Note and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                  <div className="mb-4 flex flex-col gap-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.matchStats')}</div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-[#949BA4]">
                      <div className="flex items-center gap-1.5">
                        <span>{t('setup.totalMatches')}:</span>
                        <span className="text-[#F2F3F5]">
                          {(memberData.matchStats?.League?.Win || 0) + (memberData.matchStats?.League?.Lose || 0) +
                           (memberData.matchStats?.Rated?.Win || 0) + (memberData.matchStats?.Rated?.Lose || 0) +
                           (memberData.matchStats?.Scrim?.Win || 0) + (memberData.matchStats?.Scrim?.Lose || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{t('setup.winRate')}:</span>
                        <span className="text-[#2ecc71]">
                          {(() => {
                            const totalWins = (memberData.matchStats?.League?.Win || 0) + (memberData.matchStats?.Rated?.Win || 0) + (memberData.matchStats?.Scrim?.Win || 0);
                            const totalLosses = (memberData.matchStats?.League?.Lose || 0) + (memberData.matchStats?.Rated?.Lose || 0) + (memberData.matchStats?.Scrim?.Lose || 0);
                            const totalMatches = totalWins + totalLosses;
                            return totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
                          })()}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {['League', 'Rated', 'Scrim'].map((type) => {
                      const win = memberData.matchStats?.[type as keyof typeof memberData.matchStats]?.Win || 0;
                      const lose = memberData.matchStats?.[type as keyof typeof memberData.matchStats]?.Lose || 0;
                      const total = win + lose;
                      const winRate = total > 0 ? Math.round((win / total) * 100) : 0;
                      return (
                      <div key={type} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#DBDEE1] w-16">{type}</span>
                          <span className="text-[10px] font-bold text-[#2ecc71]">{winRate}% {t('setup.win')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-[10px] text-blue-400 font-bold uppercase" title={t('setup.totalMatches')}>T</span>
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
                                setMemberData(prev => ({
                                  ...prev,
                                  matchStats: {
                                    ...prev.matchStats!,
                                    [type]: { ...prev.matchStats![type as keyof typeof prev.matchStats], Win: val }
                                  }
                                }));
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
                                setMemberData(prev => ({
                                  ...prev,
                                  matchStats: {
                                    ...prev.matchStats!,
                                    [type]: { ...prev.matchStats![type as keyof typeof prev.matchStats], Lose: val }
                                  }
                                }));
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
                  <div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.note')}</div>
                  <textarea
                    value={memberData.note || ''}
                    onChange={(e) => setMemberData({ ...memberData, note: e.target.value })}
                    className="w-full flex-1 min-h-[200px] rounded bg-[#1E1F22] border border-[#3F4147] p-3 text-sm text-[#DBDEE1] focus:outline-none focus:border-[#5865F2] resize-none"
                    placeholder={t('setup.placeholderNote')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-[#3F4147] bg-[#2B2D31] shadow-2xl">
          <div className="text-red-400 text-sm font-medium">
            {error && <span>{error}</span>}
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md px-8 py-2.5 text-sm font-medium text-[#DBDEE1] transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {t('setup.cancel')}
            </button>
            <motion.button 
              onClick={handleSave}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-md bg-[#5865F2] px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? t('setup.saving') : t('setup.saveMember')}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
