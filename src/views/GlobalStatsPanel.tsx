import React from 'react';
import { Filter, Sword, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Area, Weapon, Rank } from '../models';
import { ROLES, ROLE_OPTIONS, RANKS, WEAPONS } from '../constants';
import { Accordion } from './Accordion';
import { WeaponIcon } from './WeaponIcon';
import { Tooltip } from './Tooltip';
import { StatsToggleButton } from './StatsToggleButton';
import { isTowerArea, isPVPArea } from '../utils';

export const GlobalStatsPanel = ({ 
  areas, 
  globalFilterRoles, 
  setGlobalFilterRoles, 
  globalFilterWeapons, 
  setGlobalFilterWeapons,
  globalFilterRanks,
  setGlobalFilterRanks,
  globalFilterPositions,
  setGlobalFilterPositions,
  globalFilterStatus,
  setGlobalFilterStatus,
  weaponSlotFilter,
  setWeaponSlotFilter,
  hideStatus = false
}: { 
  areas: Area[];
  globalFilterRoles: string[];
  setGlobalFilterRoles: (roles: string[]) => void;
  globalFilterWeapons: string[];
  setGlobalFilterWeapons: (weapons: string[]) => void;
  globalFilterRanks: string[];
  setGlobalFilterRanks: (ranks: string[]) => void;
  globalFilterPositions: string[];
  setGlobalFilterPositions: (positions: string[]) => void;
  globalFilterStatus: string[];
  setGlobalFilterStatus: (statuses: string[]) => void;
  weaponSlotFilter: { primary: boolean, secondary: boolean };
  setWeaponSlotFilter: (filter: { primary: boolean, secondary: boolean }) => void;
  hideStatus?: boolean;
}) => {
  const { t } = useTranslation();
  const assignedMembers = areas
    .filter(a => !isTowerArea(a.name) && !isPVPArea(a.name))
    .flatMap(a => a.teams.flatMap(t => t.members));
  
  const weaponStats: Record<string, { weapon: Weapon, count: number }> = {};
  let noWeaponCount = 0;
  const roleStats: Record<string, { name: string, count: number, color: string, icon: string, id: string }> = {};
  const rankStats: Record<string, { rank: Rank, count: number }> = {};
  const positionStats: Record<string, { name: string, count: number, icon: string, color: string, matchKey: string }> = {
    'pos_cong': { name: t('stats.pos_cong'), count: 0, icon: '⚔️', color: '#e74c3c', matchKey: 'công' },
    'pos_thu': { name: t('stats.pos_thu'), count: 0, icon: '🛡️', color: '#3498db', matchKey: 'thủ' },
    'pos_flex': { name: t('stats.pos_flex'), count: 0, icon: '🔀', color: '#9b59b6', matchKey: 'flex' }
  };
  const statusStats: Record<string, { name: string, count: number, icon: string, color: string }> = {
    'online': { name: t('stats.online'), count: 0, icon: '🟢', color: '#23a559' },
    'offline': { name: t('stats.offline'), count: 0, icon: '⚪', color: '#80848e' }
  };

  assignedMembers.forEach(m => {
    const hasPrimary1 = m.primaryWeapon1?.id && m.primaryWeapon1.id !== 'w0';
    const hasPrimary2 = m.primaryWeapon2?.id && m.primaryWeapon2.id !== 'w0';
    if (!hasPrimary1 && !hasPrimary2) {
      noWeaponCount++;
    }

    if (weaponSlotFilter.primary) {
      if (m.primaryWeapon1 && m.primaryWeapon1.id !== 'w0') {
        if (!weaponStats[m.primaryWeapon1.id]) weaponStats[m.primaryWeapon1.id] = { weapon: m.primaryWeapon1, count: 0 };
        weaponStats[m.primaryWeapon1.id].count++;
      }
      if (m.primaryWeapon2 && m.primaryWeapon2.id !== 'w0') {
        if (!weaponStats[m.primaryWeapon2.id]) weaponStats[m.primaryWeapon2.id] = { weapon: m.primaryWeapon2, count: 0 };
        weaponStats[m.primaryWeapon2.id].count++;
      }
    }

    if (weaponSlotFilter.secondary) {
      m.secondaryWeapons.forEach(sw => {
        if (sw.id !== 'w0') {
          if (!weaponStats[sw.id]) weaponStats[sw.id] = { weapon: sw, count: 0 };
          weaponStats[sw.id].count++;
        }
      });
    }
    
    if (m.role) {
      const roleKey = m.role;
      if (!roleStats[roleKey]) {
        // Try to find matching predefined role for icon/color
        const predefinedRole = ROLE_OPTIONS.find(r => r.id === roleKey) || Object.values(ROLES).find(r => r.name.toLowerCase() === roleKey.toLowerCase());
        roleStats[roleKey] = { 
          name: predefinedRole?.name || m.role, 
          count: 0, 
          color: predefinedRole?.color || '#949BA4',
          icon: predefinedRole?.icon || '👤',
          id: predefinedRole?.id || roleKey
        };
      }
      roleStats[roleKey].count++;
    }

    const rank = m.rank;
    if (!rankStats[rank.id]) rankStats[rank.id] = { rank: rank, count: 0 };
    rankStats[rank.id].count++;

    if (m.position) {
      const posKey = Object.keys(positionStats).find(key => positionStats[key].matchKey === m.position?.toLowerCase());
      if (posKey) {
        positionStats[posKey].count++;
      }
    }

    const memberStatus = m.status === 'in-game' ? 'online' : (m.status || 'offline');
    if (statusStats[memberStatus]) {
      statusStats[memberStatus].count++;
    }
  });

  const toggleRole = (roleId: string) => {
    if (globalFilterRoles.includes(roleId)) {
      setGlobalFilterRoles(globalFilterRoles.filter(id => id !== roleId));
    } else {
      setGlobalFilterRoles([...globalFilterRoles, roleId]);
    }
  };

  const toggleWeapon = (weaponId: string) => {
    if (globalFilterWeapons.includes(weaponId)) {
      setGlobalFilterWeapons(globalFilterWeapons.filter(id => id !== weaponId));
    } else {
      setGlobalFilterWeapons([...globalFilterWeapons, weaponId]);
    }
  };

  const toggleRank = (rankId: string) => {
    if (globalFilterRanks.includes(rankId)) {
      setGlobalFilterRanks(globalFilterRanks.filter(id => id !== rankId));
    } else {
      setGlobalFilterRanks([...globalFilterRanks, rankId]);
    }
  };

  const togglePosition = (positionId: string) => {
    if (globalFilterPositions.includes(positionId)) {
      setGlobalFilterPositions(globalFilterPositions.filter(id => id !== positionId));
    } else {
      setGlobalFilterPositions([...globalFilterPositions, positionId]);
    }
  };

  const toggleStatus = (statusId: string) => {
    if (globalFilterStatus.includes(statusId)) {
      setGlobalFilterStatus(globalFilterStatus.filter(id => id !== statusId));
    } else {
      setGlobalFilterStatus([...globalFilterStatus, statusId]);
    }
  };

  return (
    <Accordion 
      title={t('stats.title')} 
      count={assignedMembers.length} 
      defaultOpen={false} 
      level={1}
      headerActionButton={
        (globalFilterRoles.length > 0 || globalFilterWeapons.length > 0 || globalFilterRanks.length > 0 || globalFilterPositions.length > 0 || (!hideStatus && globalFilterStatus.length > 0)) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setGlobalFilterRoles([]);
              setGlobalFilterWeapons([]);
              setGlobalFilterRanks([]);
              setGlobalFilterPositions([]);
              setGlobalFilterStatus([]);
            }}
            className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Filter size={14} />
            {t('stats.clearFilters')}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-5 p-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${hideStatus ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
           {/* Roles Column - Vertical List */}
           <div className="flex flex-col">
             <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.roles')}</h4>
             <div className="flex flex-col gap-1.5">
               {ROLE_OPTIONS.map((roleOption) => {
                 const statsEntry = Object.values(roleStats).find(s => s.id.toLowerCase() === roleOption.id.toLowerCase());
                 const count = statsEntry?.count || 0;
                 const isActive = globalFilterRoles.includes(roleOption.id);
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
                   />
                 );
               })}
             </div>
           </div>

           {/* Ranks Column */}
           <div className="flex flex-col">
             <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.ranks')}</h4>
             <div className="flex flex-col gap-1.5">
               {Object.values(RANKS).map((rank) => {
                 const count = rankStats[rank.id]?.count || 0;
                 const isActive = globalFilterRanks.includes(rank.id);
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
           </div>

           {/* Positions Column */}
           <div className="flex flex-col">
             <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.positions')}</h4>
             <div className="flex flex-col gap-1.5">
               {Object.entries(positionStats).map(([id, { name, count, icon, color }]) => {
                 const isActive = globalFilterPositions.includes(id);
                 return (
                   <StatsToggleButton
                     key={id}
                     id={id}
                     name={name}
                     count={count}
                     isActive={isActive}
                     onClick={togglePosition}
                     icon={icon}
                     color={color}
                   />
                 );
               })}
             </div>
           </div>

           {/* Status Column */}
           {!hideStatus && (
             <div className="flex flex-col">
               <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.status')}</h4>
               <div className="flex flex-col gap-1.5">
                 {Object.entries(statusStats).map(([id, { name, count, icon, color }]) => {
                   const isActive = globalFilterStatus.includes(id);
                   return (
                     <StatsToggleButton
                       key={id}
                       id={id}
                       name={name}
                       count={count}
                       isActive={isActive}
                       onClick={toggleStatus}
                       icon={icon}
                       color={color}
                     />
                   );
                 })}
               </div>
             </div>
           )}
        </div>

        {/* Bottom Section: Weapons (Full width) */}
        <div className="flex flex-col gap-4 pt-2">
          {/* Weapons Statistics */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.weapons')}</h4>
              <div className="flex items-center gap-2 rounded-md bg-[#1E1F22] p-1 border border-[#3F4147]">
                <button 
                  onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, primary: !weaponSlotFilter.primary })}
                  className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px] font-bold uppercase transition-all ${weaponSlotFilter.primary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
                >
                  <Sword size={14} />
                  {t('stats.primary')}
                </button>
                <button 
                  onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, secondary: !weaponSlotFilter.secondary })}
                  className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px] font-bold uppercase transition-all ${weaponSlotFilter.secondary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
                >
                  <Shield size={14} />
                  {t('stats.secondary')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.values(WEAPONS).filter((w) => w.id !== 'w0').map((weapon) => {
              const count = weaponStats[weapon.id]?.count || 0;
              const isActive = globalFilterWeapons.includes(weapon.id);
              return (
                <Tooltip key={weapon.id} content={t(weapon.name)} position="top">
                  <div className="w-full">
                    <StatsToggleButton
                      id={weapon.id}
                      name={t(weapon.name)}
                      count={count}
                      isActive={isActive}
                      onClick={toggleWeapon}
                      weaponIcon={weapon.icon}
                      iconSize={20}
                      className="w-full"
                    />
                  </div>
                </Tooltip>
              );
            })}
            <Tooltip content={t('stats.noWeapon')} position="top">
              <div className="w-full">
                <StatsToggleButton
                  id="w0"
                  name={t('stats.noWeapon')}
                  count={noWeaponCount}
                  isActive={globalFilterWeapons.includes('w0')}
                  onClick={toggleWeapon}
                  className="w-full"
                />
              </div>
            </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Accordion>
  );
};
