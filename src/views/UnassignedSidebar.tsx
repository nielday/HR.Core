import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Filter, UserPlus, BarChart2, Copy, GitMerge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Member, VoiceChannel } from '../models';
import { DropZone, MemberCard, MemberStatsOverviewModal } from './';

const SkeletonMemberCard = () => (
  <div className="flex items-center gap-2 rounded-lg border border-[#3F4147] bg-[#2B2D31]/40 p-[1px] animate-pulse h-[58px]">
    <div className="h-[56px] w-[56px] shrink-0 rounded-full bg-[#3F4147] ml-[1px]" />
    <div className="flex flex-1 flex-col gap-1">
      <div className="h-3 w-24 rounded bg-[#3F4147]" />
      <div className="flex gap-1.5">
        <div className="h-4 w-4 rounded bg-[#3F4147]" />
        <div className="h-4 w-4 rounded bg-[#3F4147]" />
      </div>
    </div>
  </div>
);

interface UnassignedSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSearchActive: boolean;
  isGlobalFilterActive: boolean;
  totalMatchingUnassigned: number;
  filteredUnassignedByStatus: Member[];
  sortedUnassigned: Member[];
  selectedMemberId: string | null;
  isMemberMatching: (m: Member) => boolean;
  isMemberMatchingGlobal: (m: Member) => boolean;
  memberTeamMap: Map<string, { teamId: string, teamName: string, areaName: string }>;
  memberAllTeamIds: Map<string, Set<string>>;
  setSelectedMemberId: (id: string | null) => void;
  setSelectedMember: (member: Member | null) => void;
  selectedTeamId: string | null;
  handleAddToSelectedTeam: (member: Member) => void;
  handleMoveMember: (memberId: string, targetTeamId: string, sourceTeamId: string) => void;
  handleMoveTeam: (teamId: string, targetAreaId: string, sourceAreaId: string) => void;
  handleRemoveFromTeam: (member: Member, teamId: string) => void;
  isConnected: boolean;
  isRefreshing: boolean;
  onRefreshMembers: (source?: 'discord' | 'custom' | 'poll' | 'gvg', gvgIndex?: number) => void;
  onOpenFilter: () => void;
  onClearFilters: () => void;
  memberSource: 'discord' | 'custom' | 'poll' | 'gvg';
  lastRefreshedSource: 'discord' | 'custom' | 'poll' | 'gvg' | null;
  setMemberSource: (source: 'discord' | 'custom' | 'poll' | 'gvg') => void;
  onAddMember: () => void;
  onDeleteCustomMember: (id: string) => void;
  activePoll: any;
  isSelectedTeamSpecial: boolean;
  gvgPollOptions: string[];
  gvgOptionIndex: number | null;
  setGvgOptionIndex: (index: number | null) => void;
  isInitialStatusChecked: boolean;
  voiceChannels: VoiceChannel[];
  voiceLoi: string;
  voiceChon: string[];
  voiceGan: Record<string, string>;
  areaOptions: { id: string; name: string }[];
  onVoiceChange: (chon: string[], gan: Record<string, string>) => void;
  onReloadVoice: () => void;
  onXepTheoVoice: () => void;
  onDonTrung: () => void;
  isStatsModalOpen: boolean;
  setIsStatsModalOpen: (open: boolean) => void;
}

export const UnassignedSidebar: React.FC<UnassignedSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSearchActive,
  isGlobalFilterActive,
  totalMatchingUnassigned,
  filteredUnassignedByStatus,
  sortedUnassigned,
  selectedMemberId,
  isMemberMatching,
  isMemberMatchingGlobal,
  memberTeamMap,
  memberAllTeamIds,
  setSelectedMemberId,
  setSelectedMember,
  selectedTeamId,
  handleAddToSelectedTeam,
  handleMoveMember,
  handleMoveTeam,
  handleRemoveFromTeam,
  isConnected,
  isRefreshing,
  onRefreshMembers,
  onOpenFilter,
  onClearFilters,
  memberSource,
  lastRefreshedSource,
  setMemberSource,
  onAddMember,
  onDeleteCustomMember,
  activePoll,
  isSelectedTeamSpecial,
  gvgPollOptions,
  gvgOptionIndex,
  setGvgOptionIndex,
  isInitialStatusChecked,
  voiceChannels,
  voiceLoi,
  voiceChon,
  voiceGan,
  areaOptions,
  onVoiceChange,
  onReloadVoice,
  onXepTheoVoice,
  onDonTrung,
  isStatsModalOpen,
  setIsStatsModalOpen
}) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyNames = () => {
    if (sortedUnassigned.length === 0) return;
    const names = sortedUnassigned.map(m => m.ingameName?.trim() || m.name).join('\n');
    navigator.clipboard.writeText(names).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.div 
            key="sidebar-container" 
            initial={{ width: 0, opacity: 0, marginRight: 0 }}
            animate={{ width: 320, opacity: 1, marginRight: 24 }}
            exit={{ width: 0, opacity: 0, marginRight: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-40 flex shrink-0 h-full"
          >
            <div className="flex flex-col border border-[#1E1F22] bg-[#2B2D31] shadow-[4px_0_24px_rgba(0,0,0,0.2)] overflow-hidden rounded-lg w-[320px] h-full">
              <div className="flex w-[320px] flex-col h-full">
                {/* Top Actions */}
                <div className="flex items-center justify-between border-b border-[#1E1F22] bg-[#2B2D31] p-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#F2F3F5] ml-1 text-sm">{t('sidebar.memberList')}</h3>
                  </div>
                  <span className={`flex h-5 min-w-[24px] items-center justify-center rounded px-1.5 text-[12px] font-bold transition-colors ${
                    filteredUnassignedByStatus.length === 0
                      ? 'bg-[#2B2D31] text-[#F2F3F5]'
                      : 'bg-white text-[#5865F2]'
                  }`}>
                    {(isSearchActive || isGlobalFilterActive) ? `${totalMatchingUnassigned}/${filteredUnassignedByStatus.length}` : filteredUnassignedByStatus.length}
                  </span>
                </div>

                {/* Member List (Drop Zone) */}
                <DropZone id="unassigned" onDrop={handleMoveMember} onTeamDrop={handleMoveTeam} disabled={true} className="flex-1 flex flex-col min-h-0 p-3">
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                      {/* Source and Refresh */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <select 
                            value={memberSource === 'gvg' ? `gvg-${gvgOptionIndex}` : memberSource}
                            disabled={isRefreshing}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith('gvg-')) {
                                const index = parseInt(val.split('-')[1]);
                                setGvgOptionIndex(index);
                                setMemberSource('gvg');
                                onRefreshMembers('gvg', index);
                              } else {
                                const newSource = val as 'discord' | 'custom' | 'poll' | 'gvg';
                                setMemberSource(newSource);
                                setGvgOptionIndex(null);
                                onRefreshMembers(newSource);
                              }
                            }}
                             className="flex-1 rounded-md bg-[#1E1F22] border border-[#3F4147] px-2 py-1.5 text-sm text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2] shadow-inner disabled:opacity-50"
                          >
                            <option value="discord">{t('sidebar.sources.discord')}</option>
                            <option value="custom">{t('sidebar.sources.members')}</option>
                            {activePoll && (
                              <>
                                <option disabled key="sep-poll">──────────</option>
                                <option value="poll" key="poll">{t('sidebar.sources.votes')}</option>
                              </>
                            )}
                            {gvgPollOptions.length > 0 && (
                              <>
                                <option disabled key="sep-gvg">──────────</option>
                                {gvgPollOptions.map((opt, idx) => (
                                  <option key={`gvg-${idx}`} value={`gvg-${idx}`}>{opt}</option>
                                ))}
                              </>
                            )}
                          </select>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRefreshMembers(memberSource, gvgOptionIndex ?? undefined)}
                            disabled={isRefreshing || (!isConnected && memberSource === 'discord')}
                            className="flex items-center justify-center rounded-md bg-[#4F545C] hover:bg-[#5D6269] px-3 text-white transition-all disabled:opacity-50 h-[34px]"
                            title={t('sidebar.refreshList')}
                          >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                          </motion.button>
                          {/* Dọn bản ghi trùng. Chỉ hiện ở nguồn "Thành viên" vì đây là chỗ
                              duy nhất bản ghi được tạo ra, và cũng là chỗ duy nhất nhìn thấy
                              hậu quả khi trùng. */}
                          {memberSource === 'custom' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={onDonTrung}
                              className="flex items-center justify-center rounded-md bg-[#4F545C] hover:bg-[#5D6269] px-3 text-white transition-all h-[34px]"
                              title={t('sidebar.dedupe.button')}
                            >
                              <GitMerge size={18} />
                            </motion.button>
                          )}
                        </div>
                        {memberSource && (
                          <div className="text-[10px] text-[#949BA4] flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${memberSource === 'discord' ? 'bg-green-500' : memberSource === 'custom' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                            <span>{t('sidebar.showing')}: {
                              memberSource === 'discord' ? t('sidebar.sources.discord') :
                              memberSource === 'custom' ? t('sidebar.sources.members') :
                              memberSource === 'poll' ? t('sidebar.sources.votes') :
                              (memberSource === 'gvg' && gvgOptionIndex !== null && gvgPollOptions[gvgOptionIndex]) ? gvgPollOptions[gvgOptionIndex] : t('sidebar.sources.gvg')
                            }</span>
                          </div>
                        )}

                        {/* Chọn kênh voice lấy người, chỉ hiện khi đang dùng nguồn voice.
                            Danh sách hỏi thẳng Discord nên không phải gõ id kênh bằng tay,
                            và số trong ngoặc là số người đang ngồi trong kênh lúc này. */}
                        {memberSource === 'discord' && (
                          <div className="rounded-md border border-[#3F4147] bg-[#1E1F22]/60 p-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#949BA4]">
                                {t('sidebar.voice.title')}
                              </span>
                              <button
                                onClick={onReloadVoice}
                                disabled={!isConnected}
                                title={t('sidebar.voice.reload')}
                                className="rounded p-0.5 text-[#949BA4] hover:bg-[#3F4147] hover:text-[#DBDEE1] disabled:opacity-40"
                              >
                                <RefreshCw size={12} />
                              </button>
                            </div>

                            {voiceLoi && <div className="text-[10px] text-amber-400/90">{voiceLoi}</div>}
                            {!voiceLoi && voiceChannels.length === 0 && (
                              <div className="text-[10px] italic text-[#949BA4]">{t('sidebar.voice.none')}</div>
                            )}

                            {voiceChannels.map((c) => {
                              const daTick = voiceChon.includes(c.id);
                              return (
                                <div key={c.id} className="flex flex-col gap-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#DBDEE1]">
                                    <input
                                      type="checkbox"
                                      checked={daTick}
                                      onChange={(e) => {
                                        const chon = e.target.checked
                                          ? [...voiceChon, c.id]
                                          : voiceChon.filter((v) => v !== c.id);
                                        onVoiceChange(chon, voiceGan);
                                        // Tick xong nạp lại luôn, không bắt bấm thêm nút refresh.
                                        onRefreshMembers('discord');
                                      }}
                                      className="accent-[#5865F2] h-3 w-3"
                                    />
                                    <span className="truncate">🔊 {c.name}</span>
                                    <span className="ml-auto shrink-0 text-[10px] text-[#949BA4]">{c.soNguoi}</span>
                                  </label>
                                  {daTick && areaOptions.length > 0 && (
                                    <select
                                      value={voiceGan[c.id] || ''}
                                      onChange={(e) => onVoiceChange(voiceChon, { ...voiceGan, [c.id]: e.target.value })}
                                      title={t('sidebar.voice.assignHint')}
                                      className="ml-4 rounded bg-[#2B2D31] border border-[#3F4147] px-1.5 py-1 text-[10px] text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                                    >
                                      <option value="">{t('sidebar.voice.noArea')}</option>
                                      {areaOptions.map((a) => (
                                        <option key={a.id} value={a.id}>↳ {a.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              );
                            })}

                            {voiceChon.length > 0 && (
                              <button
                                onClick={onXepTheoVoice}
                                className="mt-0.5 rounded bg-[#5865F2] px-2 py-1.5 text-[11px] font-bold text-white hover:bg-[#4752C4] transition-colors"
                              >
                                ⚡ {t('sidebar.voice.arrange')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex gap-2">
                        <div className="relative flex flex-1">
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyNames}
                            disabled={sortedUnassigned.length === 0}
                            className="flex w-full items-center justify-center rounded-md bg-blue-500/80 hover:bg-blue-600/80 h-[32px] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('sidebar.copyNames')}
                          >
                            <Copy size={16} />
                          </motion.button>
                          <AnimatePresence>
                            {isCopied && (
                              <motion.div
                                initial={{ opacity: 0, y: 0 }}
                                animate={{ opacity: 1, y: -25 }}
                                exit={{ opacity: 0, y: -35 }}
                                className="absolute left-1/2 -translate-x-1/2 pointer-events-none bg-[#232428] text-white text-[10px] px-2 py-1 rounded shadow-lg border border-[#1E1F22] whitespace-nowrap z-50"
                              >
                                {t('sidebar.copied')}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onAddMember}
                          className="flex flex-1 items-center justify-center rounded-md bg-green-500/80 hover:bg-green-600/80 h-[32px] text-white transition-all"
                          title={t('sidebar.addMember')}
                        >
                          <UserPlus size={16} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsStatsModalOpen(true)}
                          className="flex flex-1 items-center justify-center rounded-md bg-purple-500/80 hover:bg-purple-600/80 h-[32px] text-white transition-all"
                          title={t('sidebar.listStats')}
                        >
                          <BarChart2 size={16} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onOpenFilter}
                          className="flex flex-1 items-center justify-center rounded-md bg-yellow-500/80 hover:bg-yellow-600/80 h-[32px] text-white transition-all"
                          title={t('sidebar.searchFilter')}
                        >
                          <Search size={16} />
                        </motion.button>
                        <motion.button 
                          whileHover={isSearchActive || isGlobalFilterActive ? { scale: 1.05 } : {}}
                          whileTap={isSearchActive || isGlobalFilterActive ? { scale: 0.95 } : {}}
                          onClick={onClearFilters}
                          disabled={!(isSearchActive || isGlobalFilterActive)}
                          className={`flex flex-1 items-center justify-center rounded-md py-1.5 transition-all ${
                            isSearchActive || isGlobalFilterActive 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                              : 'bg-[#1E1F22] text-[#5c5e66] opacity-50 cursor-not-allowed'
                          }`}
                          title={t('sidebar.clearFilters')}
                        >
                          <Filter size={16} />
                        </motion.button>
                      </div>

                      <div className="flex flex-col gap-2 min-h-[100px] flex-1 overflow-y-auto custom-scrollbar transition-opacity duration-300 p-1">
                        <AnimatePresence mode="popLayout">
                          {isRefreshing ? (
                            <motion.div 
                              key="skeletons"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col gap-2"
                            >
                              {[...Array(8)].map((_, i) => (
                                <SkeletonMemberCard key={i} />
                              ))}
                            </motion.div>
                          ) : sortedUnassigned.length === 0 ? (
                            <motion.div 
                              key="empty"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex h-[58px] items-center justify-center rounded-md border border-dashed border-[#3F4147] text-xs text-[#949BA4]"
                            >
                              {t('sidebar.emptyList')}
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="list"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col gap-2"
                            >
                              {sortedUnassigned.map(m => {
                                const assignedInfo = memberTeamMap.get(m.id);
                                const allTeams = memberAllTeamIds.get(m.id);
                                const isAlreadyInSelectedTeam = selectedTeamId && allTeams?.has(selectedTeamId);
                                const canAddToSpecialTeam = !!assignedInfo;
                                const shouldShowAdd = selectedTeamId && !isAlreadyInSelectedTeam && (!isSelectedTeamSpecial || canAddToSpecialTeam);

                                return (
                                  <MemberCard 
                                    key={m.id} 
                                    member={m} 
                                    sourceId="unassigned" 
                                    isSelected={selectedMemberId === m.id}
                                    isDimmed={(isSearchActive && !isMemberMatching(m)) || (isGlobalFilterActive && !isMemberMatchingGlobal(m))}
                                    isHighlighted={(isSearchActive && isMemberMatching(m)) || (isGlobalFilterActive && isMemberMatchingGlobal(m))}
                                    assignedTeamInfo={assignedInfo}
                                    onSelect={(member) => setSelectedMemberId(member.id)}
                                    onInfoClick={setSelectedMember}
                                    onAdd={shouldShowAdd ? handleAddToSelectedTeam : undefined}
                                    onRemove={assignedInfo ? (member) => handleRemoveFromTeam(member, assignedInfo.teamId) : undefined}
                                    onDrop={handleMoveMember}
                                    memberSource={memberSource}
                                    onDeleteCustomMember={onDeleteCustomMember}
                                  />
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </DropZone>
              </div>
            </div>

            {/* Collapse Button on the right edge - outside of overflow-hidden div */}
            <div className="absolute right-0 top-1/2 z-50 translate-x-full -translate-y-1/2">
              <motion.button 
                whileHover={{ width: 16, backgroundColor: '#3F4147' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(false)}
                className="flex h-16 w-5 items-center justify-center rounded-r-md bg-[#2B2D31] border border-l-0 border-[#1E1F22] text-[#949BA4] hover:text-[#DBDEE1] shadow-[4px_0_8px_rgba(0,0,0,0.3)] group transition-all"
                title={t('sidebar.collapse')}
              >
                <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="expand-container" 
            initial={{ opacity: 0, marginRight: 0 }}
            animate={{ opacity: 1, marginRight: 0 }}
            exit={{ opacity: 0, marginRight: 0 }}
            className="relative z-30 flex shrink-0 h-full w-0"
          >
            <div className="absolute -left-6 top-1/2 z-30 -translate-y-1/2">
              <motion.button 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                whileHover={{ width: 16, backgroundColor: '#3F4147' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-16 w-5 items-center justify-center rounded-r-md bg-[#2B2D31] border border-l-0 border-[#1E1F22] text-[#949BA4] hover:text-[#DBDEE1] shadow-[4px_0_8px_rgba(0,0,0,0.3)] group transition-all"
                title={t('sidebar.expand')}
              >
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
