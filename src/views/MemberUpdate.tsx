import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Save, Sword, RefreshCw, Gamepad2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from './Tooltip';
import { Member, Weapon } from '../models';
import { RANKS, WEAPONS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { WeaponIcon } from './WeaponIcon';
import { Toast, ToastType } from './Toast';

// Tra lại theo id để lấy ĐỊNH NGHĨA HIỆN TẠI (tên, icon). Object lưu trong DB chỉ là ảnh
// chụp cũ, đổi icon hay đổi tên vũ khí là nó lệch.
const timVK = (id?: string) => (id ? Object.values(WEAPONS).find((w) => w.id === id) : undefined);
const timRank = (id?: string) => (id ? Object.values(RANKS).find((r) => r.id === id) : undefined);

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

export const MemberUpdate: React.FC = () => {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(window.location.search);
  const discordId = searchParams.get('id');
  const groupID = searchParams.get('groupID') || '1'; // Default to 1 if not provided
  
  const [profile, setProfile] = useState<{ id: string, nickname: string, avatar: string } | null>(null);
  const [config, setConfig] = useState<Partial<Member>>({
    role: 'flex',
    position: 'flex',
    primaryWeapon1: WEAPONS.NONE,
    primaryWeapon2: WEAPONS.NONE,
    secondaryWeapons: [],
    rank: RANKS.RECRUIT,
    ingameName: '',
    ingameId: '',
    name: '',
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!discordId) return;

    const fetchData = async () => {
      try {
        const [profileRes, configRes] = await Promise.all([
          fetch(`/api/discord-profile/${discordId}`),
          fetch(`/api/member-config-by-discord/${groupID}/${discordId}`)
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          if (Object.keys(configData).length > 0) {
            const mappedConfig: Partial<Member> = {
              role: configData.role || 'flex',
              position: configData.position || 'flex',
              // Xem chú thích cùng lỗi ở useTeamManager: bản ghi lưu hai dạng, đọc mỗi dạng
              // id rời là mất sạch vũ khí và cấp bậc của người thêm bằng đường kia.
              primaryWeapon1: timVK(configData.primaryWeapon1Id) || timVK(configData.primaryWeapon1?.id) || configData.primaryWeapon1 || WEAPONS.NONE,
              primaryWeapon2: timVK(configData.primaryWeapon2Id) || timVK(configData.primaryWeapon2?.id) || configData.primaryWeapon2 || WEAPONS.NONE,
              secondaryWeapons: (configData.secondaryWeaponIds?.length
                ? configData.secondaryWeaponIds
                : (configData.secondaryWeapons || []).map((w: any) => w?.id)
              ).filter(Boolean).map((id: string) => timVK(id)).filter(Boolean),
              rank: timRank(configData.rankId) || timRank(configData.rank?.id) || configData.rank || RANKS.RECRUIT,
              note: configData.note,
              ingameName: configData.ingameName || '',
              ingameId: configData.ingameId || '',
              type: configData.type || 0,
              name: configData.name || '',
              avatar: configData.avatar || ''
            };
            setConfig(mappedConfig);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [discordId]);

  const handleSave = async () => {
    if (!discordId) return;
    setIsSaving(true);
    
    try {
      const payload = {
        name: profile?.nickname,
        avatar: profile?.avatar,
        role: config.role,
        position: config.position,
        primaryWeapon1Id: config.primaryWeapon1?.id,
        primaryWeapon2Id: config.primaryWeapon2?.id,
        secondaryWeaponIds: config.secondaryWeapons?.map(w => w.id),
        rankId: config.rank?.id,
        note: config.note,
        ingameName: config.ingameName,
        ingameId: config.ingameId,
        type: config.type || 0
      };

      const response = await fetch(`/api/member-config-by-discord/${groupID}/${discordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToast({ message: t('setup.saveSuccess'), type: 'success' });
      } else {
        setToast({ message: t('setup.saveError'), type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('setup.saveError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSecondaryWeapon = (weapon: Weapon) => {
    const isSelected = config.secondaryWeapons?.some(w => w.id === weapon.id);
    let newSecondary;
    if (isSelected) {
      newSecondary = config.secondaryWeapons?.filter(w => w.id !== weapon.id) || [];
    } else {
      newSecondary = [...(config.secondaryWeapons || []), weapon];
    }
    setConfig({ ...config, secondaryWeapons: newSecondary });
  };

  if (!discordId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1E1F22] p-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">{t('setup.errorMissingId')}</h1>
          <p className="mt-2 text-[#949BA4]">{t('setup.errorMissingIdDesc')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1E1F22] p-4 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#5865F2] border-t-transparent"></div>
          <p className="text-[#949BA4] animate-pulse">{t('setup.loadingInfo')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1F22] text-white p-4 md:p-8 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-[#313338] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#3F4147]"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner */}
          <div className="relative h-24 bg-gradient-to-r from-[#5865F2] to-[#9b59b6] z-10" />

          <div className="px-6 pb-6 relative z-20">
            {/* Avatar & Name */}
            <div className="-mt-14 flex items-end gap-6 relative z-30">
              <div className="relative h-28 w-28 rounded-2xl overflow-hidden border-4 border-[#313338] bg-[#1E1F22]">
                <img 
                  src={profile?.avatar || config.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt={config.ingameName?.trim() || profile?.nickname || config.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#F2F3F5]">{config.ingameName?.trim() || profile?.nickname || config.name || t('setup.member')}</h1>
                <p className="text-[#949BA4] text-xs">ID Discord: {config.name} ({discordId})</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              {/* In-game Info */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                <div className="mb-4 flex items-center gap-2">
                  <Gamepad2 size={16} className="text-[#5865F2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.ingameInfo')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">                    
                    <input
                      type="text"
                      value={config.ingameName || ''}
                      onChange={(e) => setConfig({ ...config, ingameName: e.target.value })}
                      className="rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:border-[#5865F2] transition-colors"
                      placeholder={t('setup.placeholderIngameName')}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">                    
                    <input
                      type="text"
                      value={config.ingameId || ''}
                      onChange={(e) => setConfig({ ...config, ingameId: e.target.value })}
                      className="rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:border-[#5865F2] transition-colors"
                      placeholder={t('setup.placeholderIngameId')}
                    />
                  </div>
                </div>
              </div>

              {/* Role & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4 shadow-inner">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.role')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map(role => {
                      const isSelected = config.role === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setConfig({ ...config, role: role.id })}
                          className={`flex items-center gap-2 rounded border p-1.5 transition-all ${
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
                      const mPos = config.position?.toLowerCase();
                      const isSelected = mPos === posValue || mPos === pos.id;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => setConfig({ ...config, position: posValue })}
                          className={`flex items-center gap-2 rounded border p-1.5 transition-all ${
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

              {/* Weapons Panel */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-5 shadow-inner">
                <div className="mb-4 flex items-center gap-2">
                  <Sword size={16} className="text-[#5865F2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.weaponConfig')}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <CustomWeaponSelect 
                    label={t('setup.weapon1')}
                    value={config.primaryWeapon1 || WEAPONS.NONE} 
                    onChange={(w) => setConfig({ ...config, primaryWeapon1: w })} 
                  />
                  <CustomWeaponSelect 
                    label={t('setup.weapon2')}
                    value={config.primaryWeapon2 || WEAPONS.NONE} 
                    onChange={(w) => setConfig({ ...config, primaryWeapon2: w })} 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#949BA4] uppercase">{t('setup.secondaryWeapons')}</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                    {Object.values(WEAPONS).filter(w => w.id !== 'w0').map(w => {
                      const isSelected = config.secondaryWeapons?.some(sw => sw.id === w.id);
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

              {/* Note */}
              <div className="rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-4 shadow-inner">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">{t('setup.personalNote')}</div>
                <textarea
                  value={config.note || ''}
                  onChange={(e) => setConfig({ ...config, note: e.target.value })}
                  className="w-full h-[100px] rounded bg-[#1E1F22] border border-[#3F4147] p-3 text-sm text-[#DBDEE1] focus:outline-none focus:border-[#5865F2] resize-none"
                  placeholder={t('setup.placeholderNote')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end border-t border-[#3F4147] bg-[#2B2D31]">
          <div className="flex justify-end gap-3">
            <motion.button 
              onClick={handleSave}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-md bg-[#5865F2] px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/30 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? t('setup.saving') : t('setup.saveInfo')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
