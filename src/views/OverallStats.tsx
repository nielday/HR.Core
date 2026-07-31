import React, { useMemo } from 'react';
import { X, Sword, Shield, Filter, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WeaponIcon } from './WeaponIcon';
import { Accordion } from './Accordion';
import { Tooltip } from './Tooltip';
import { MemberCard } from './MemberCard';
import { StatsToggleButton } from './StatsToggleButton';
import { ROLES, ROLE_OPTIONS, RANKS, WEAPONS } from '../constants';
import { Member } from '../models';

interface OverallStatsProps {
  membersCount: number;
  stats: any;
  localFilterRoles: string[];
  localFilterWeapons: string[];
  localFilterRanks: string[];
  localFilterPositions: string[];
  localFilterStatus: string[];
  weaponSlotFilter: { primary: boolean; secondary: boolean };
  toggleRole: (roleId: string) => void;
  toggleWeapon: (weaponId: string) => void;
  toggleRank: (rankId: string) => void;
  togglePosition: (posId: string) => void;
  toggleStatus: (statusId: string) => void;
  setWeaponSlotFilter: React.Dispatch<React.SetStateAction<{ primary: boolean; secondary: boolean }>>;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  // New props for member list
  filteredMembers: Member[];
  memberTeamMap: Map<string, { teamId: string, teamName: string, areaName: string }>;
  setSelectedMember: (member: Member | null) => void;
  handleAddToSelectedTeam?: (member: Member) => void;
  handleRemoveFromTeam?: (member: Member, teamId: string) => void;
  selectedTeamId: string | null;
  isSelectedTeamSpecial?: boolean;
  memberAllTeamIds?: Map<string, Set<string>>;
  hideStatus?: boolean;
}

export const OverallStats: React.FC<OverallStatsProps> = ({
  membersCount,
  stats,
  localFilterRoles,
  localFilterWeapons,
  localFilterRanks,
  localFilterPositions,
  localFilterStatus,
  weaponSlotFilter,
  toggleRole,
  toggleWeapon,
  toggleRank,
  togglePosition,
  toggleStatus,
  setWeaponSlotFilter,
  clearAllFilters,
  hasActiveFilters,
  filteredMembers,
  memberTeamMap,
  setSelectedMember,
  handleAddToSelectedTeam,
  handleRemoveFromTeam,
  selectedTeamId,
  isSelectedTeamSpecial,
  memberAllTeamIds,
  hideStatus = false
}) => {
  const { t } = useTranslation();
  const totalRoleCount = useMemo(() => 
    Object.values(stats.roleStats as Record<string, { count: number }>).reduce((acc, curr) => acc + curr.count, 0)
  , [stats.roleStats]);

  const totalWeaponCount = useMemo(() => 
    Object.values(stats.weaponStats as Record<string, { count: number }>).reduce((acc, curr) => acc + curr.count, 0) + (stats.noWeaponCount || 0)
  , [stats.weaponStats, stats.noWeaponCount]);

  const totalRankCount = useMemo(() => 
    Object.values(stats.rankStats as Record<string, { count: number }>).reduce((acc, curr) => acc + curr.count, 0)
  , [stats.rankStats]);

  const totalPositionCount = useMemo(() => 
    Object.values(stats.positionStats as Record<string, { count: number }>).reduce((acc, curr) => acc + curr.count, 0)
  , [stats.positionStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
      {/* Left Column: All Filter Accordions */}
      <div className="flex flex-col gap-4 sticky top-0">
        {/* Roles Accordion */}
        <Accordion 
          title={t('stats.roles')} 
          count={totalRoleCount} 
          defaultOpen={false} 
          level={2}
          className="bg-[#1E1F22]/50 rounded-lg border border-[#3F4147]"
        >
          <div className="flex flex-col gap-1.5 p-3">
            {ROLE_OPTIONS.map(roleOption => {
              const statsEntry = (stats.roleStats as Record<string, { id: string, count: number }>)[roleOption.id.toLowerCase()];
              const count = statsEntry?.count || 0;
              const isActive = localFilterRoles.includes(roleOption.id);
              return (
                <StatsToggleButton 
                  key={roleOption.id}
                  id={roleOption.id}
                  name={t(roleOption.name)}
                  count={count}
                  isActive={isActive}
                  onClick={toggleRole}
                  color={roleOption.color}
                  weaponIcon={roleOption.icon}
                  iconSize={20}
                />
              );
            })}
          </div>
        </Accordion>

        {/* Weapons Accordion */}
        <Accordion 
          title={t('stats.weapons')} 
          count={totalWeaponCount} 
          defaultOpen={false} 
          level={2}
          className="bg-[#1E1F22]/50 rounded-lg border border-[#3F4147]"
          headerActionButton={
            <div className="flex items-center gap-1 rounded-md bg-[#1E1F22] p-0.5 border border-[#3F4147]" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, primary: !weaponSlotFilter.primary })}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-all ${weaponSlotFilter.primary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
              >
                {t('stats.primary')}
              </button>
              <button 
                onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, secondary: !weaponSlotFilter.secondary })}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-all ${weaponSlotFilter.secondary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
              >
                {t('stats.secondary')}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-1.5 p-3">
            {Object.values(WEAPONS).filter((w) => w.id !== 'w0').map((weapon) => {
              const count = stats.weaponStats[weapon.id]?.count || 0;
              const isActive = localFilterWeapons.includes(weapon.id);
              return (
                <StatsToggleButton 
                  key={weapon.id}
                  id={weapon.id}
                  name={t(weapon.name)}
                  count={count}
                  isActive={isActive}
                  onClick={toggleWeapon}
                  weaponIcon={weapon.icon}
                  iconSize={22}
                />
              );
            })}
            <StatsToggleButton
              id="w0"
              name={t('stats.noWeapon')}
              count={stats.noWeaponCount}
              isActive={localFilterWeapons.includes('w0')}
              onClick={toggleWeapon}
            />
          </div>
        </Accordion>

        {/* Ranks Accordion */}
        <Accordion 
          title={t('stats.ranks')} 
          count={totalRankCount} 
          defaultOpen={false} 
          level={2}
          className="bg-[#1E1F22]/50 rounded-lg border border-[#3F4147]"
        >
          <div className="flex flex-col gap-1.5 p-3">
            {Object.values(RANKS).map((rank) => {
              const count = (stats.rankStats as Record<string, { count: number }>)[rank.id]?.count || 0;
              const isActive = localFilterRanks.includes(rank.id);
              return (
                <StatsToggleButton 
                  key={rank.id}
                  id={rank.id}
                  name={t(rank.name)}
                  count={count}
                  isActive={isActive}
                  onClick={toggleRank}
                  color={rank.color}
                  isColorCircle={true}
                />
              );
            })}
          </div>
        </Accordion>

        {/* Positions Accordion */}
        <Accordion 
          title={t('stats.positions')} 
          count={totalPositionCount} 
          defaultOpen={false} 
          level={2}
          className="bg-[#1E1F22]/50 rounded-lg border border-[#3F4147]"
        >
          <div className="flex flex-col gap-1.5 p-3">
            {(Object.entries(stats.positionStats) as [string, { name: string, count: number, icon: string, color: string }][]).map(([id, { name, count, icon, color }]) => {
              const isActive = localFilterPositions.includes(id);
              return (
                <StatsToggleButton 
                  key={id}
                  id={id}
                  name={t(name)}
                  count={count}
                  isActive={isActive}
                  onClick={togglePosition}
                  icon={icon}
                  color={color}
                />
              );
            })}
          </div>
        </Accordion>

      </div>

      {/* Right Column: Member List Only */}
      <div className="flex flex-col gap-6 min-w-0">
        <section className="flex-1 flex flex-col min-h-0">
          <div className="mb-4 flex items-center justify-between border-b border-[#3F4147] pb-2">
            <div className="flex items-center gap-2">
              <Sword size={18} className="text-[#5865F2]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#DBDEE1]">{t('sidebar.memberList')}</h3>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-red-500/20 transition-colors"
                >
                  <Filter size={10} />
                  {t('stats.clearFilters')}
                </button>
              )}
              <span className="text-xs text-[#949BA4]">{filteredMembers.length} {t('setup.member')}</span>
            </div>
          </div>
          
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#949BA4] bg-[#1E1F22]/30 rounded-lg border border-dashed border-[#3F4147]">
              <BarChart2 size={48} className="mb-2 opacity-20" />
              <p className="text-sm">{t('sidebar.emptyList')}</p>
              <button onClick={clearAllFilters} className="mt-2 text-xs flex items-center gap-1 text-red-400 hover:underline"><Filter size={10} /> {t('sidebar.clearFilters')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-1">
              {filteredMembers.map(m => {
                const assignedInfo = memberTeamMap.get(m.id);
                const allTeams = memberAllTeamIds?.get(m.id);
                const isAlreadyInSelectedTeam = selectedTeamId && allTeams?.has(selectedTeamId);
                const canAddToSpecialTeam = !!assignedInfo;
                const shouldShowAdd = selectedTeamId && !isAlreadyInSelectedTeam && (!isSelectedTeamSpecial || canAddToSpecialTeam);

                return (
                  <MemberCard 
                    key={m.id} 
                    member={m} 
                    sourceId="stats-modal" 
                    assignedTeamInfo={assignedInfo}
                    onInfoClick={setSelectedMember}
                    onAdd={shouldShowAdd ? handleAddToSelectedTeam : undefined}
                    onRemove={assignedInfo ? (member) => handleRemoveFromTeam?.(member, assignedInfo.teamId) : undefined}
                    disableMenu={true}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
