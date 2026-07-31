import React, { useState } from 'react';
import { Plus, Lock, Pencil, Check, X, UserMinus, Trash2, RefreshCw, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Area, Team, Member } from '../models';
import { Accordion, AreaIcon, TeamStatsTooltip, TeamHeader, MemberCard, Tooltip } from './';
import { areaHasMissingRequirements, areaHasOfflineMembers, hasMissingRequirements, hasOfflineMembers, trangThaiVoice, demDiemDanh, VoiceState } from '../utils';

interface AreaGridProps {
  areas: Area[];
  isSearchActive: boolean;
  isGlobalFilterActive: boolean;
  isMemberMatching: (m: Member) => boolean;
  isMemberMatchingGlobal: (m: Member) => boolean;
  forceExpandAll: boolean;
  editingAreaId: string | null;
  setEditingAreaId: (id: string | null) => void;
  tempAreaName: string;
  setTempAreaName: (name: string) => void;
  handleRenameArea: (id: string, name: string) => void;
  handleAddTeam: (areaId: string) => void;
  handleClearAreaMembers: (areaId: string) => void;
  handleDeleteArea: (areaId: string) => void;
  handleMoveMember: (memberId: string, targetTeamId: string, sourceTeamId: string) => void;
  handleMoveTeam: (teamId: string, targetAreaId: string, sourceAreaId: string) => void;
  handleRenameTeam: (teamId: string, newName: string) => void;
  handleDeleteTeam: (teamId: string) => void;
  setSettingsTeam: (team: Team | null) => void;
  handleClearTeamMembers: (teamId: string) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  setSelectedMember: (member: Member | null) => void;
  handleRemoveFromTeam: (member: Member, teamId: string) => void;
  handleAddArea: () => void;
  onOpenStatsModal: (members: Member[], title: string) => void;
  memberSource: 'discord' | 'custom';
  onDeleteCustomMember?: (memberId: string) => void;
  readOnly?: boolean;
  /** Điểm danh voice. Không truyền thì thẻ giữ nguyên như cũ, không tô màu gì. */
  voiceState?: VoiceState;
  voiceGan?: Record<string, string>;
  tenKenhVoice?: Record<string, string>;
}

export const AreaGrid: React.FC<AreaGridProps> = ({
  areas,
  isSearchActive,
  isGlobalFilterActive,
  isMemberMatching,
  isMemberMatchingGlobal,
  forceExpandAll,
  editingAreaId,
  setEditingAreaId,
  tempAreaName,
  setTempAreaName,
  handleRenameArea,
  handleAddTeam,
  handleClearAreaMembers,
  handleDeleteArea,
  handleMoveMember,
  handleMoveTeam,
  handleRenameTeam,
  handleDeleteTeam,
  setSettingsTeam,
  handleClearTeamMembers,
  selectedTeamId,
  setSelectedTeamId,
  selectedMemberId,
  setSelectedMemberId,
  setSelectedMember,
  handleRemoveFromTeam,
  handleAddArea,
  onOpenStatsModal,
  memberSource,
  onDeleteCustomMember,
  readOnly = false,
  voiceState,
  voiceGan,
  tenKenhVoice,
}) => {
  const { t } = useTranslation();
  const [confirmActionId, setConfirmActionId] = useState<string | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  const executeAction = async (actionId: string, action: () => void) => {
    setProcessingActionId(actionId);
    await new Promise(resolve => setTimeout(resolve, 300));
    action();
    setProcessingActionId(null);
    setConfirmActionId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {areas.map((area, index) => {
        const areaHasMatchingMember = (isSearchActive || isGlobalFilterActive) && 
                                     area.teams.some(t => t.members.some(m => isMemberMatching(m) && isMemberMatchingGlobal(m)));
        
        const areaTotalMembers = area.teams.reduce((acc, t) => acc + t.members.length, 0);
        const areaMatchingMembers = area.teams.reduce((acc, t) => acc + t.members.filter(m => isMemberMatching(m) && isMemberMatchingGlobal(m)).length, 0);
        const areaCountDisplay = (isSearchActive || isGlobalFilterActive) ? `${areaMatchingMembers}/${areaTotalMembers}` : areaTotalMembers;
        const isTower = area.name.toLowerCase().includes('trụ') || area.name.toLowerCase().includes('tower');
        const isPvp = area.name.toLowerCase().includes('pvp');

        return (
          <Accordion 
            key={area.id}            title={
              <div className="relative flex w-full items-center min-w-0">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <div className="shrink-0">
                    <AreaIcon name={area.name} />
                  </div>
                  {editingAreaId === area.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <input 
                        autoFocus
                        className="w-full rounded bg-[#1E1F22] px-2 py-0.5 text-sm font-semibold text-[#F2F3F5] outline-none ring-1 ring-[#5865F2]"
                        value={tempAreaName}
                        onChange={e => setTempAreaName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleRenameArea(area.id, tempAreaName);
                            setEditingAreaId(null);
                          }
                          if (e.key === 'Escape') setEditingAreaId(null);
                        }}
                      />
                      <button 
                        onClick={() => {
                          handleRenameArea(area.id, tempAreaName);
                          setEditingAreaId(null);
                        }} 
                        className="text-green-500 hover:text-green-400"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingAreaId(null)} 
                        className="text-red-500 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Tooltip content={area.name} position="top" align="left" onlyShowIfTruncated={true} className="min-w-0 truncate text-base font-bold text-[#F2F3F5] cursor-default text-left">
                        {area.name}
                      </Tooltip>
                      {/* Đếm điểm danh ngay trên đầu khu. Quét mắt qua 30 thẻ tìm màu đỏ thì
                          chậm, con số mới trả lời thẳng câu "còn thiếu mấy người". */}
                      {(() => {
                        if (!voiceState || !areaTotalMembers) return null;
                        const d = demDiemDanh(
                          area.teams.flatMap((t) => t.members), area.id, area.name,
                          voiceState, voiceGan || {}, tenKenhVoice || {},
                        );
                        if (!d.dung && !d.lac && !d.vang) return null;   // khu chưa gán kênh thì đừng bày ra
                        return (
                          <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[#2ecc71]" title="Đã vào đúng kênh voice của khu">
                              {d.dung}/{d.tong}
                            </span>
                            {d.lac > 0 && <span className="text-amber-400" title="Đang trong voice nhưng lạc sang kênh khác">{d.lac} lạc</span>}
                            {d.vang > 0 && <span className="text-[#ED4245]" title="Không ở kênh voice nào">{d.vang} vắng</span>}
                            {d.khongro > 0 && <span className="text-[#949BA4]" title="Không tra được: thiếu Discord ID, hoặc khu chưa gán kênh voice">{d.khongro} ?</span>}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {!editingAreaId && !area.isLocked && !readOnly && !confirmActionId?.includes(area.id) && (
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 bg-[#2B2D31] pl-2 shadow-[-8px_0_8px_-4px_rgba(43,45,49,1)]"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAreaId(area.id);
                        setTempAreaName(area.name);
                      }}
                      className="text-[#949BA4] hover:text-white p-1 rounded hover:bg-[#3F4147] transition-colors"
                      title={t('setup.renameArea')}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
            }
            count={areaCountDisplay} 
            defaultOpen={!(isPvp || isTower)}
            forceOpen={forceExpandAll || ((isSearchActive || isGlobalFilterActive) ? areaHasMatchingMember : undefined)}
            tooltipContent={<TeamStatsTooltip members={area.teams.flatMap(t => t.members)} teams={area.teams} />}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
            hasWarning={areaHasMissingRequirements(area.teams)}
            hasOfflineWarning={areaHasOfflineMembers(area.teams)}
            level={1}
            onDrop={readOnly ? undefined : handleMoveMember}
            onTeamDrop={readOnly ? undefined : handleMoveTeam}
            dropId={readOnly ? undefined : `area-${area.id}`}
            contentClassName="p-2 pt-0"
            headerActionButton={editingAreaId === area.id ? null : (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <div className={`flex items-center gap-1 transition-opacity ${confirmActionId?.includes(area.id) ? 'opacity-100' : (!readOnly ? 'opacity-0 group-hover:opacity-100' : 'opacity-100')}`}>
                  {confirmActionId === `clear-${area.id}` ? (
                    <div className="flex items-center gap-1 bg-[#1E1F22] p-0.5 rounded border border-orange-500/30">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmActionId(null); }}
                        className="px-2 py-1 text-[10px] font-bold text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); executeAction(`clear-${area.id}`, () => handleClearAreaMembers(area.id)); }}
                        disabled={processingActionId === `clear-${area.id}`}
                        className="px-2 py-1 text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors flex items-center gap-1"
                      >
                        {processingActionId === `clear-${area.id}` ? <RefreshCw size={10} className="animate-spin" /> : t('setup.clearAll')}
                      </button>
                    </div>
                  ) : confirmActionId === `delete-${area.id}` ? (
                    <div className="flex items-center gap-1 bg-[#1E1F22] p-0.5 rounded border border-[#ed4245]/30">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmActionId(null); }}
                        className="px-2 py-1 text-[10px] font-bold text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); executeAction(`delete-${area.id}`, () => handleDeleteArea(area.id)); }}
                        disabled={processingActionId === `delete-${area.id}`}
                        className="px-2 py-1 text-[10px] font-bold text-white bg-[#ed4245] hover:bg-[#c03537] rounded transition-colors flex items-center gap-1"
                      >
                        {processingActionId === `delete-${area.id}` ? <RefreshCw size={10} className="animate-spin" /> : t('common.delete')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onOpenStatsModal(area.teams.flatMap(t => t.members), `${t('stats.areaStats')}: ${area.name}`); 
                        }}
                        className="p-1.5 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                        title={t('stats.areaTeamStats')}
                      >
                        <BarChart2 size={16} />
                      </button>
                      {!readOnly && (
                        <>
                          {!area.isLocked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddTeam(area.id); }}
                              className="p-1.5 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                              title={t('setup.addNewTeam')}
                            >
                              <Plus size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmActionId(`clear-${area.id}`); }}
                            className="p-1.5 text-[#949BA4] hover:text-orange-400 hover:bg-orange-500/20 rounded transition-colors"
                            title={t('setup.clearMembers')}
                          >
                            <UserMinus size={16} />
                          </button>
                          {!area.isLocked && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmActionId(`delete-${area.id}`); }}
                              className="p-1.5 text-[#949BA4] hover:text-[#ed4245] hover:bg-[#ed4245]/10 rounded transition-colors"
                              title={t('setup.deleteArea')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                {area.isLocked && <Lock size={14} className="text-red-500 shrink-0" />}
              </div>
            )}
          >
            {/* Grid Layout for Teams: Auto-expanding rows */}
            <div className={`mt-2 ${area.teams.length === 0 ? 'min-h-[100px]' : ''}`}>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-min">
                {area.teams.map(team => {
                  const cols = Math.max(1, Math.ceil(team.members.length / 5));
                  const colSpanClass = cols === 1 ? 'col-span-1' : cols === 2 ? 'col-span-2' : cols === 3 ? 'col-span-3' : 'col-span-4';
                  const teamHasMatchingMember = (isSearchActive || isGlobalFilterActive) && 
                                               team.members.some(m => isMemberMatching(m) && isMemberMatchingGlobal(m));
                  
                  const teamMatchingMembers = team.members.filter(m => isMemberMatching(m) && isMemberMatchingGlobal(m)).length;
                  const teamCountDisplay = (isSearchActive || isGlobalFilterActive) ? `${teamMatchingMembers}/${team.members.length}` : team.members.length;
                  const isTower = area.name.toLowerCase().includes('trụ') || area.name.toLowerCase().includes('tower');

                    return (
                      <div key={team.id} className={`h-full ${colSpanClass}`}>
                        <Accordion 
                          draggable={!team.isLocked && !readOnly}
                          onDragStart={(e) => {
                            if (team.isLocked || readOnly) return;
                            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'team', teamId: team.id, sourceAreaId: area.id }));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          title={
                            <TeamHeader 
                              team={team} 
                              onRename={readOnly ? () => {} : handleRenameTeam}
                              onDelete={readOnly ? () => {} : handleDeleteTeam}
                              onConfig={readOnly ? () => {} : setSettingsTeam}
                              onClearMembers={readOnly ? () => {} : handleClearTeamMembers}
                              onOpenStatsModal={onOpenStatsModal}
                              hideConfig={isTower || isPvp || readOnly}
                              readOnly={readOnly}
                            />
                          }
                          count={teamCountDisplay} 
                          defaultOpen={true}
                          forceOpen={forceExpandAll || ((isSearchActive || isGlobalFilterActive) ? teamHasMatchingMember : undefined)}
                          tooltipContent={<TeamStatsTooltip members={team.members} requirements={team.requirements} />}
                          tooltipPosition={index === 0 ? 'bottom' : 'top'}
                          tooltipAlign={area.teams.length > 1 ? (index % 2 === 0 ? 'left' : 'right') : 'center'}
                          hasWarning={hasMissingRequirements(team.members, team.requirements)}
                          hasOfflineWarning={hasOfflineMembers(team.members)}
                          level={2}
                          onDrop={readOnly ? undefined : handleMoveMember}
                          onTeamDrop={readOnly ? undefined : handleMoveTeam}
                          dropId={readOnly ? undefined : team.id}
                          isSelected={selectedTeamId === team.id}
                          onHeaderClick={() => setSelectedTeamId(team.id)}
                        >
                          <div className={`mt-1 min-h-[40px] p-1 ${cols > 1 ? 'grid gap-1 grid-rows-5 grid-flow-col auto-cols-fr' : 'flex flex-col gap-1'}`}>
                            {team.members.length === 0 ? (
                              <div className="flex h-[58px] items-center justify-center rounded-md border border-dashed border-[#3F4147] text-xs text-[#949BA4]">
                                {readOnly ? t('setup.emptyTeam') : t('setup.dragDrop')}
                              </div>
                            ) : (
                              team.members.map((m, index) => (
                                <MemberCard 
                                  key={m.id} 
                                  member={m} 
                                  sourceId={team.id} 
                                  isSelected={selectedMemberId === m.id}
                                  isDimmed={(isSearchActive && !isMemberMatching(m)) || (isGlobalFilterActive && !isMemberMatchingGlobal(m))}
                                  isHighlighted={(isSearchActive && isMemberMatching(m)) || (isGlobalFilterActive && isMemberMatchingGlobal(m))}
                                  onSelect={(member) => setSelectedMemberId(member.id)}
                                  onInfoClick={setSelectedMember}
                                  onRemove={readOnly ? undefined : (member) => handleRemoveFromTeam(member, team.id)}
                                  onDrop={readOnly ? undefined : handleMoveMember}
                                  onTeamDrop={readOnly ? undefined : handleMoveTeam}
                                  isLeader={index === 0}
                                  index={index}
                                  memberSource={memberSource}
                                  onDeleteCustomMember={onDeleteCustomMember}
                                  readOnly={readOnly}
                                  {...(voiceState
                                    ? (() => {
                                        const tt = trangThaiVoice(m, area.id, area.name, voiceState, voiceGan || {}, tenKenhVoice || {});
                                        return { voiceTrangThai: tt.trangThai, voiceTenKenh: tt.tenKenhDangO };
                                      })()
                                    : {})}
                                />
                              ))
                            )}
                          </div>
                        </Accordion>
                      </div>
                    );
                })}
              </div>
            </div>
          </Accordion>
        );
      })}

      {!readOnly && (
        <motion.button 
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.99 }}
          onClick={handleAddArea}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#3F4147] p-2 text-[#949BA4] transition-colors hover:text-[#DBDEE1]"
        >
          <Plus size={20} />
          <span className="font-semibold">{t('setup.addNewTeam')}</span>
        </motion.button>
      )}
    </div>
  );
};
