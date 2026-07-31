import React, { useRef, useEffect, useState } from 'react';
import { Pencil, Check, X, Plus, Save, ChevronDown, Trash2, RefreshCw, Copy, ClipboardCopy, Share2, Send, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SavedSetup, SetupMetadata, DiscordChannel, Area } from '../models';
import { ROLE_OPTIONS, POSITION_OPTIONS, RANKS, WEAPONS } from '../constants';
import { Tooltip } from './Tooltip';

import { MatchResultModal } from './MatchResultModal';

interface SetupManagementProps {
  currentSetupName: string;
  setCurrentSetupName: (name: string) => void;
  isEditingSetupName: boolean;
  setIsEditingSetupName: (editing: boolean) => void;
  tempSetupName: string;
  setTempSetupName: (name: string) => void;
  handleCreateNewSetup: () => void;
  handleConfirmSave: () => void;
  setIsSetupDropdownOpen: (open: boolean) => void;
  isSetupDropdownOpen: boolean;
  savedSetups: SetupMetadata[];
  handleLoadSetup: (setup: SetupMetadata) => Promise<void>;
  handleDeleteSetup: (e: React.MouseEvent, id: string) => Promise<boolean>;
  handleCopySetup: (setup: SetupMetadata) => Promise<boolean>;
  handleCheckOnline: () => Promise<Area[]>;
  isCheckingOnline: boolean;
  onConfirmMatchResult: (type: 'League' | 'Rated' | 'Scrim', result: 'Win' | 'Lose') => Promise<void>;
  isConnected: boolean;
  areas: Area[];
  currentSetupId: string | null;
  groupId: string;
  selectedChannelId?: string;
  showToast: (message: string, type: 'success' | 'error') => void;
  onOpenTacticalBoard: (setupId: string, setupName: string) => void;
}

export const SetupManagement: React.FC<SetupManagementProps> = ({
  isEditingSetupName,
  tempSetupName,
  setTempSetupName,
  setCurrentSetupName,
  setIsEditingSetupName,
  currentSetupName,
  handleCreateNewSetup,
  handleConfirmSave,
  setIsSetupDropdownOpen,
  isSetupDropdownOpen,
  savedSetups,
  handleLoadSetup,
  handleDeleteSetup,
  handleCopySetup,
  handleCheckOnline,
  isCheckingOnline,
  onConfirmMatchResult,
  isConnected,
  areas,
  currentSetupId,
  groupId,
  selectedChannelId,
  showToast,
  onOpenTacticalBoard
}) => {
  const { t, i18n } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const copyDropdownRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMatchResultModalOpen, setIsMatchResultModalOpen] = useState(false);
  const [dots, setDots] = useState('');
  const [loadingSetupId, setLoadingSetupId] = useState<string | null>(null);
  const [deletingSetupId, setDeletingSetupId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copyingSetupId, setCopyingSetupId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [copyType, setCopyType] = useState<'text' | 'link' | 'discord' | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

  const [showCheckResults, setShowCheckResults] = useState(false);
  const [checkResults, setCheckResults] = useState<{
    areas: {
      name: string;
      teams: { name: string; missing: string[]; isComplete: boolean; memberCount: number }[];
    }[];
    totalAssigned: number;
    isAllComplete: boolean;
  } | null>(null);

  const handleCopyAssignedNames = () => {
    const uniqueNames = new Set<string>();
    const leads = new Set<string>();

    areas.forEach(area => {
      area.teams.forEach(team => {
        team.members.forEach((m, index) => {
          uniqueNames.add(m.name);
          if (index === 0) {
            leads.add(m.name);
          }
        });
      });
    });

    if (uniqueNames.size === 0) return;

    const names = Array.from(uniqueNames)
      .map(name => leads.has(name) ? `${name} [C]` : name)
      .join('\n');

    navigator.clipboard.writeText(names).then(() => {
      setCopyType('text');
      setIsCopied(true);
      showToast(t('setup.copySuccess'), 'success');
      setTimeout(() => {
        setIsCopied(false);
        setCopyType(null);
      }, 2000);
    });
    setIsCopyDropdownOpen(false);
  };

  const handleSendToDiscord = async () => {
    if (!currentSetupId || !isConnected || isSendingDiscord) return;
    
    setIsSendingDiscord(true);
    const shareUrl = `${window.location.origin}/view?id=${currentSetupId}&group=${groupId}`;
    
    let message = `📢 **Thông báo: Đã hoàn tất chia team cho ${currentSetupName}!**\n`;
    message += `🔗 [Click vào đây để xem](${shareUrl})\n`;
    message += `--------------------------------\n`;

    areas.forEach(area => {
      area.teams.forEach(team => {
        if (team.members.length === 0) return;
        const membersList = team.members.map((m, index) => {
          const isLead = index === 0;
          const tag = /^\d+$/.test(m.id) ? `<@${m.id}>` : (m.ingameName?.trim() || m.name);
          return `${tag}${isLead ? ' [C]' : ''}`;
        }).join(', ');
        message += `**[${team.name}]**\n${membersList}\n\n`;
      });
    });

    try {
      const response = await fetch(`/api/discord/message/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, channelId: selectedChannelId })
      });

      if (response.ok) {
        setCopyType('discord');
        setIsCopied(true);
        showToast(t('setup.sendDiscordSuccess'), 'success');
        setTimeout(() => {
          setIsCopied(false);
          setCopyType(null);
        }, 2000);
      } else {
        showToast(t('setup.sendDiscordError'), 'error');
      }
    } catch (error) {
      console.error('Error sending message to Discord:', error);
      showToast(t('setup.sendDiscordError'), 'error');
    } finally {
      setIsSendingDiscord(false);
      setIsCopyDropdownOpen(false);
    }
  };

  const handleShareSetup = () => {
    if (!currentSetupId) return;
    const shareUrl = `${window.location.origin}/view?id=${currentSetupId}&group=${groupId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyType('link');
      setIsCopied(true);
      showToast(t('setup.copyLinkSuccess'), 'success');
      setTimeout(() => {
        setIsCopied(false);
        setCopyType(null);
      }, 2000);
    });
    setIsCopyDropdownOpen(false);
  };

  const onCheckClick = async () => {
    const newAreas = await handleCheckOnline();
    
    // Calculate results
    const areaResults: {
      name: string;
      teams: { name: string; missing: string[]; isComplete: boolean; memberCount: number }[];
    }[] = [];
    const assignedIds = new Set<string>();
    let allTeamsComplete = true;

    newAreas.forEach(area => {
      const teamResults: { name: string; missing: string[]; isComplete: boolean; memberCount: number }[] = [];
      
      area.teams.forEach(team => {
        team.members.forEach(m => assignedIds.add(m.id));
        const missing: string[] = [];

        // Check for offline members
        const offlineMembers = team.members.filter(m => m.status === 'offline');
        if (offlineMembers.length > 0) {
          missing.push(t('setup.offlineMembersCount', { count: offlineMembers.length, names: offlineMembers.map(m => m.ingameName?.trim() || m.name).join(', ') }));
        }

        // Check requirements
        if (team.requirements) {
          Object.entries(team.requirements).forEach(([reqId, val]) => {
            const count = val as number;
            if (count <= 0) return;

            let satisfiedCount = 0;
            const role = ROLE_OPTIONS.find(r => r.id === reqId);
            if (role) {
              satisfiedCount = team.members.filter(m => m.status !== 'offline' && m.role?.toLowerCase() === reqId.toLowerCase()).length;
              if (satisfiedCount < count) missing.push(t('setup.missingCount', { count: count - satisfiedCount, name: t(role.name) }));
              return;
            }

            const pos = POSITION_OPTIONS.find(p => p.id === reqId || (p.id === 'pos_cong' && reqId === 'công') || (p.id === 'pos_thu' && reqId === 'thủ') || (p.id === 'pos_flex' && reqId === 'flex'));
            if (pos) {
              satisfiedCount = team.members.filter(m => 
                m.status !== 'offline' && (
                  m.position === pos.id || 
                  (pos.id === 'pos_cong' && m.position?.toLowerCase() === 'công') ||
                  (pos.id === 'pos_thu' && m.position?.toLowerCase() === 'thủ') ||
                  (pos.id === 'pos_flex' && m.position?.toLowerCase() === 'flex')
                )
              ).length;
              if (satisfiedCount < count) missing.push(t('setup.missingPosition', { count: count - satisfiedCount, name: t(pos.name) }));
              return;
            }

            const rank = Object.values(RANKS).find(r => r.id === reqId);
            if (rank) {
              satisfiedCount = team.members.filter(m => m.status !== 'offline' && m.rank.id === reqId).length;
              if (satisfiedCount < count) missing.push(t('setup.missingCount', { count: count - satisfiedCount, name: t(rank.name) }));
              return;
            }

            const weapon = Object.values(WEAPONS).find(w => w.id === reqId);
            if (weapon) {
              satisfiedCount = team.members.filter(m => 
                m.status !== 'offline' && (
                  m.primaryWeapon1.id === reqId || 
                  m.primaryWeapon2.id === reqId || 
                  m.secondaryWeapons.some(sw => sw.id === reqId)
                )
              ).length;
              if (satisfiedCount < count) missing.push(t('setup.missingCount', { count: count - satisfiedCount, name: t(weapon.name) }));
              return;
            }
          });
        }

        const isComplete = missing.length === 0;
        if (!isComplete) allTeamsComplete = false;

        teamResults.push({
          name: team.name,
          missing,
          isComplete,
          memberCount: team.members.length
        });
      });

      areaResults.push({
        name: area.name,
        teams: teamResults
      });
    });

    const isAllComplete = allTeamsComplete && assignedIds.size === 30;
    setCheckResults({ areas: areaResults, totalAssigned: assignedIds.size, isAllComplete });
    setShowCheckResults(true);
  };

  const handleConfirmMatchResult = async (type: 'League' | 'Rated' | 'Scrim', result: 'Win' | 'Lose') => {
    try {
      await onConfirmMatchResult(type, result);
      showToast(t('setup.confirmResultSuccess'), 'success');
    } catch (error) {
      showToast(t('setup.confirmResultError'), 'error');
      throw error; // Re-throw to keep modal open and stop spinner
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSaving) {
      interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 300);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [isSaving]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSetupDropdownOpen(false);
      }
      if (copyDropdownRef.current && !copyDropdownRef.current.contains(event.target as Node)) {
        setIsCopyDropdownOpen(false);
      }
    };

    if (isSetupDropdownOpen || isCopyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSetupDropdownOpen, setIsSetupDropdownOpen, isCopyDropdownOpen, setIsCopyDropdownOpen]);

  useEffect(() => {
    if (!isSetupDropdownOpen) {
      setConfirmDeleteId(null);
    }
  }, [isSetupDropdownOpen]);

  const isAnyDropdownOpen = isSetupDropdownOpen || isCopyDropdownOpen || showCheckResults || isMatchResultModalOpen;

  return (
    <>
      <header className="group rounded-xl relative flex items-center justify-between px-6 py-4 bg-[#404249] border border-[#4E5058] shadow-md min-h-[72px] z-[10000]">
        <div className={`flex items-center gap-2 ${isEditingSetupName ? 'flex-1' : 'min-w-0 flex-1 pr-4'}`}>
          {isEditingSetupName ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={tempSetupName}
                onChange={(e) => setTempSetupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentSetupName(tempSetupName || t('setup.newSetup'));
                    setIsEditingSetupName(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingSetupName(false);
                  }
                }}
                className="flex-1 rounded bg-[#313338] px-3 py-2 text-xl font-bold text-[#F2F3F5] outline-none ring-1 ring-[#5865F2] border border-[#4E5058] m-px min-w-0"
                autoFocus
              />
              <button
                onClick={() => {
                  setCurrentSetupName(tempSetupName || t('setup.newSetup'));
                  setIsEditingSetupName(false);
                }}
                className="flex items-center justify-center p-2 text-[#2ecc71] hover:bg-[#3F4147] rounded transition-colors shrink-0"
                title={t('setup.accept')}
              >
                <Check size={28} />
              </button>
              <button
                onClick={() => setIsEditingSetupName(false)}
                className="flex items-center justify-center p-2 text-[#ed4245] hover:bg-[#3F4147] rounded transition-colors shrink-0"
                title={t('setup.cancel')}
              >
                <X size={28} />
              </button>
            </div>
          ) : (
            <>
              <Tooltip content={`${currentSetupName}${!currentSetupId ? ' (*)' : ''}`} position="top" align="left" onlyShowIfTruncated={true} className="flex-1 min-w-0 truncate block text-xl font-bold text-[#F2F3F5] cursor-default text-left">
                {currentSetupName}{!currentSetupId && ' (*)'}
              </Tooltip>              
            </>
          )}
        </div>
        
        <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-200 z-[10001] ${
          isEditingSetupName 
            ? "opacity-10 blur-[2px] pointer-events-none" 
            : isAnyDropdownOpen 
              ? "opacity-100 visible" 
              : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
        }`}>
          <div className="flex items-center gap-2 bg-[#313338] p-1.5 rounded-lg shadow-xl border border-[#4E5058]">
          <button
                onClick={() => {
                  setTempSetupName(currentSetupName);
                  setIsEditingSetupName(true);
                }}
                className="opacity-0 transition-opacity group-hover:opacity-100 text-[#949BA4] hover:text-white p-1 rounded hover:bg-[#3F4147]"
                title={t('setup.editSetupName')}
              >
                <Pencil size={22} />
              </button>
            {/* Match Result Confirmation */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsMatchResultModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-sm font-medium text-white transition-all shadow-sm"
                title={t('setup.confirmResult')}
              >
                <Check size={16} />
                <span className="hidden lg:inline">{t('setup.confirm')}</span>
              </motion.button>

            {/* Discord Online Check */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCheckClick}
              disabled={isCheckingOnline}
              className="flex items-center gap-2 rounded-md bg-[#23a559] hover:bg-[#1e8f4c] px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 shadow-sm"
              title={t('setup.checkOnline')}
            >
              {isCheckingOnline ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw size={16} />
                </motion.div>
              ) : (
                <RefreshCw size={16} />
              )}
              <span className="hidden lg:inline">{isCheckingOnline ? t('setup.checking') : t('setup.check')}</span>
            </motion.button>

            {/* Share Dropdown */}
            <div className="relative flex" ref={copyDropdownRef}>
              <motion.button
                whileHover={{ backgroundColor: '#5D6269' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCopyDropdownOpen(!isCopyDropdownOpen)}
                disabled={!currentSetupId}
                className="flex items-center gap-2 rounded-md bg-[#4F545C] px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 shadow-sm"
                title={t('setup.shareConfig')}
              >
                <Share2 size={16} />
                <span className="hidden lg:inline">{t('setup.share')}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isCopyDropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isCopyDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 z-[10002] w-64 rounded-lg border border-[#1E1F22] bg-[#2B2D31] p-1.5 shadow-2xl overflow-hidden"
                  >
                    <button 
                      onClick={handleCopyAssignedNames}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#DBDEE1] hover:bg-[#3F4147] transition-colors rounded-md mb-0.5"
                    >
                      <ClipboardCopy size={16} className="text-[#949BA4]" />
                      <span>{t('setup.copyList')}</span>
                    </button>
                    <button 
                      onClick={handleShareSetup}
                      disabled={!currentSetupId}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#DBDEE1] hover:bg-[#3F4147] transition-colors disabled:opacity-50 rounded-md mb-0.5"
                    >
                      <Share2 size={16} className="text-[#5865F2]" />
                      <span>{t('setup.teamSetupLink')}</span>
                    </button>
                    <button 
                      onClick={handleSendToDiscord}
                      disabled={!isConnected || isSendingDiscord}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#DBDEE1] hover:bg-[#3F4147] transition-colors disabled:opacity-50 rounded-md"
                    >
                      {isSendingDiscord ? (
                        <RefreshCw size={16} className="animate-spin text-[#5865F2]" />
                      ) : (
                        <Send size={16} className="text-[#5865F2]" />
                      )}
                      <span>{t('setup.discord')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isCopied && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -30 }}
                    exit={{ opacity: 0, y: -40 }}
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none bg-[#232428] text-white text-[10px] px-2 py-1 rounded shadow-lg border border-[#1E1F22] whitespace-nowrap z-50"
                  >
                    {copyType === 'link' ? t('setup.copyLinkSuccess') : 
                     copyType === 'discord' ? t('setup.sendDiscordSuccess') :
                     t('setup.copySuccess')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tactical Board Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentSetupId) {
                  onOpenTacticalBoard(currentSetupId, currentSetupName);
                } else {
                  showToast(t('setup.saveFirstToOpenTacticalBoard'), 'error');
                }
              }}
              className="flex items-center justify-center rounded-md bg-[#4F545C] hover:bg-[#5D6269] px-3 py-2 text-sm font-medium text-white transition-all shadow-sm"
              title="Sa bàn chiến thuật"
            >
              <Map size={16} />
            </motion.button>

            <div className="flex rounded-md shadow-md relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ backgroundColor: '#5D6269' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNewSetup}
                className="flex items-center gap-2 rounded-l-md bg-[#4F545C] px-4 py-2 text-sm font-medium text-white transition-all"
                title={t('setup.addNew')}
              >
                <Plus size={16} />
                <span className="hidden lg:inline">{t('setup.addNew')}</span>
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#5D6269' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSetupDropdownOpen(!isSetupDropdownOpen)}
                className="flex items-center justify-center rounded-r-md border-l border-white/20 bg-[#4F545C] px-2 text-white transition-all"
              >
                <ChevronDown size={16} />
              </motion.button>

              <AnimatePresence>
                {isSetupDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 z-[10002] w-80 rounded-lg border border-[#1E1F22] bg-[#2B2D31]/95 backdrop-blur-sm p-1.5 shadow-2xl ${savedSetups.length > 10 ? 'max-h-[300px] overflow-y-auto' : 'overflow-hidden'}`}
                  >
                    {savedSetups.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[#949BA4]">{t('setup.noSavedSetups')}</div>
                    ) : (
                      savedSetups.map(setup => (
                        <motion.div 
                          key={setup.id}
                          whileHover={{ backgroundColor: '#3F4147' }}
                          className="group/setup-item relative flex cursor-pointer items-center justify-between px-3 py-2 rounded-md text-sm text-[#DBDEE1] mb-0.5 last:mb-0"
                        >
                          {confirmDeleteId === setup.id ? (
                            <div className="flex items-center justify-between w-full px-2 py-1">
                              <span className="text-sm text-[#ed4245] font-medium">{t('setup.deleteSetup')}?</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-[#DBDEE1] hover:bg-[#4E5058] rounded transition-colors"
                                >
                                  {t('setup.cancelDelete')}
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (deletingSetupId) return;
                                    setDeletingSetupId(setup.id);
                                    try {
                                      const success = await handleDeleteSetup(e, setup.id);
                                      if (success) {
                                        showToast(t('setup.deleteSuccess'), 'success');
                                      } else {
                                        showToast(t('setup.deleteError'), 'error');
                                      }
                                    } catch (error) {
                                      showToast(t('setup.deleteError'), 'error');
                                    } finally {
                                      setDeletingSetupId(null);
                                      setConfirmDeleteId(null);
                                    }
                                  }}
                                  disabled={deletingSetupId === setup.id}
                                  className="px-2 py-1 text-xs font-medium text-white bg-[#ed4245] hover:bg-[#da373c] rounded transition-colors flex items-center gap-1"
                                >
                                  {deletingSetupId === setup.id ? <RefreshCw size={12} className="animate-spin" /> : null}
                                  {t('setup.delete')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-1 flex-col min-w-0" onClick={async () => {
                                if (loadingSetupId) return;
                                try {
                                  setLoadingSetupId(setup.id);
                                  await handleLoadSetup(setup);
                                  setIsSetupDropdownOpen(false);
                                } finally {
                                  setLoadingSetupId(null);
                                }
                              }}>
                                <div className="flex items-center gap-2 min-w-0 w-full">
                                  <Tooltip content={setup.name} position="top" align="left" className={`flex-1 min-w-0 truncate block w-full text-left font-medium ${setup.id === currentSetupId ? 'text-[#5865F2]' : ''}`}>
                                    {setup.name}
                                  </Tooltip>
                                </div>
                                <div className="text-[10px] text-[#949BA4] flex items-center gap-1.5">
                                  <span>{setup.timestamp ? new Date(setup.timestamp).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') : t('setup.unknownDate')}</span>
                                  <span>•</span>
                                  <span className="font-medium text-[#B5BAC1] truncate">{setup.creator || t('setup.unknownCreator')}</span>
                                </div>
                              </div>
                              <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center ${loadingSetupId === setup.id ? 'opacity-100' : 'opacity-0 group-hover/setup-item:opacity-100'} transition-opacity border border-[#4E5058] rounded-md p-0.5 bg-[#3F4147]`}>
                                {loadingSetupId === setup.id ? (
                                  <RefreshCw size={16} className="animate-spin text-[#5865F2] m-1" />
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenTacticalBoard(setup.id, setup.name);
                                      }}
                                      className="p-1 text-[#949BA4] hover:text-[#5865F2] hover:bg-[#5865F2]/10 rounded transition-colors"
                                      title="Mở sa bàn chiến thuật"
                                    >
                                      <Map size={16} />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (copyingSetupId) return;
                                        setCopyingSetupId(setup.id);
                                        try {
                                          const success = await handleCopySetup(setup);
                                          if (success) {
                                            showToast(t('setup.duplicateSuccess'), 'success');
                                          } else {
                                            showToast(t('setup.duplicateError'), 'error');
                                          }
                                        } catch (error) {
                                          showToast(t('setup.duplicateError'), 'error');
                                        } finally {
                                          setCopyingSetupId(null);
                                        }
                                      }}
                                      disabled={copyingSetupId === setup.id}
                                      className="p-1 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                                      title={t('setup.copySetup')}
                                    >
                                      {copyingSetupId === setup.id ? <RefreshCw size={16} className="animate-spin" /> : <Copy size={16} />}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteId(setup.id);
                                      }}
                                      className="p-1 text-[#949BA4] hover:text-[#ed4245] hover:bg-[#ed4245]/10 rounded transition-colors"
                                      title={t('setup.deleteSetup')}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await handleConfirmSave();
                  showToast(t('setup.saveSuccess'), 'success');
                } catch (error) {
                  showToast(t('setup.saveError'), 'error');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm bg-[#5865F2] hover:bg-[#4752C4] ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <motion.div
                key={isSaving ? 'saving' : 'save'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw size={16} />
                  </motion.div>
                ) : <Save size={16} />}
                <span className="hidden lg:inline">{isSaving ? `${t('setup.saving')}${dots}` : t('setup.save')}</span>
              </motion.div>
            </motion.button>
          </div>
        </div>
      </header>

      <MatchResultModal
        isOpen={isMatchResultModalOpen}
        onClose={() => setIsMatchResultModalOpen(false)}
        onConfirm={handleConfirmMatchResult}
      />

      {/* Check Results Modal */}
      <AnimatePresence>
        {showCheckResults && checkResults && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowCheckResults(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-xl bg-[#313338] shadow-2xl border border-[#1E1F22]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1E1F22] bg-[#2B2D31] p-4">
                <h3 className="text-lg font-bold text-[#F2F3F5] flex items-center gap-2">
                  <RefreshCw size={20} className="text-[#5865F2]" />
                  {t('setup.checkResults')}
                </h3>
                <button onClick={() => setShowCheckResults(false)} className="text-[#949BA4] hover:text-[#DBDEE1] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Total Assigned */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22] border border-[#2B2D31]">
                  <span className="text-sm text-[#949BA4]">{t('setup.totalAssigned')}</span>
                  <span className={`text-lg font-bold ${checkResults.totalAssigned === 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {checkResults.totalAssigned} / 30
                  </span>
                </div>

                {/* Team Status Grouped by Area - Only showing incomplete teams */}
                <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {checkResults.totalAssigned !== 30 && (
                    <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-center gap-2 text-sm font-bold text-yellow-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        {t('setup.notEnoughMembers')}
                      </div>
                      <div className="text-xs text-yellow-400/80 mt-1 ml-3.5">
                        {t('setup.notEnoughMembersDesc', { count: checkResults.totalAssigned })}
                      </div>
                    </div>
                  )}

                  {checkResults.areas.some(area => area.teams.some(t => !t.isComplete)) ? (
                    checkResults.areas.map((area, areaIdx) => {
                      const incompleteTeams = area.teams.filter(t => !t.isComplete);
                      if (incompleteTeams.length === 0) return null;

                      return (
                        <div key={areaIdx} className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#949BA4] flex items-center gap-2 sticky top-0 bg-[#313338] py-1 z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                            {area.name}
                          </h4>
                          <div className="grid gap-2 px-2 pb-2">
                            {incompleteTeams.map((team, teamIdx) => (
                              <div 
                                key={teamIdx} 
                                className="p-3 rounded-lg border bg-red-500/5 border-red-500/20 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-sm font-bold text-[#F2F3F5]">{team.name}</div>
                                  <div className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-red-500/20 text-red-400">
                                    {t('setup.memberCount', { count: team.memberCount })}
                                  </div>
                                </div>
                                
                                <div className="space-y-1 mt-2">
                                  {team.missing.map((m, mIdx) => (
                                    <div key={mIdx} className="text-xs text-red-400 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-red-400" />
                                      {m}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : checkResults.totalAssigned === 30 ? (
                    <div className="p-8 rounded-lg bg-green-500/10 border border-green-500/20 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Check size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-400">{t('setup.allTeamsComplete')}</p>
                        <p className="text-xs text-green-400/70 mt-1">{t('setup.noErrors')}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Completion Message */}
                {checkResults.isAllComplete ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-green-500 flex flex-col items-center gap-2 text-white shadow-lg shadow-green-500/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Check size={24} />
                    </div>
                    <span className="font-bold text-lg">{t('setup.completed')}</span>
                    <p className="text-xs text-white/80">{t('setup.ready')}</p>
                  </motion.div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#232428] border border-[#1E1F22] text-center">
                    <p className="text-xs text-[#949BA4]">
                      {checkResults.totalAssigned !== 30 && t('setup.need30Members')}
                      {checkResults.areas.some(area => area.teams.some(t => !t.isComplete)) && t('setup.addMissingInfo')}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#2B2D31] p-4 flex justify-end">
                <button 
                  onClick={() => setShowCheckResults(false)}
                  className="rounded-md bg-[#5865F2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
                >
                  {t('setup.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
