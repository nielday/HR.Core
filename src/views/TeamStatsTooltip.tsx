import React from 'react';
import { useTranslation } from 'react-i18next';
import { Member, Team, Role } from '../models';
import { WEAPONS, ROLES, RANKS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { getRoleStats, getWeaponStats } from '../utils';
import { WeaponIcon } from './WeaponIcon';

export const TeamStatsTooltip = ({ members, requirements, teams }: { members: Member[], requirements?: Record<string, number>, teams?: Team[] }) => {
  const { t } = useTranslation();
  const stats = getRoleStats(members);
  
  const getRoleFromWeapon = (weaponId: string) => {
    const weapon = Object.values(WEAPONS).find(w => w.id === weaponId);
    if (!weapon) return undefined;
    for (const role of Object.values(ROLES)) {
      if (role.weapons.some(w => w.id === weapon.id)) {
        return role;
      }
    }
    return ROLES.FLEX;
  };

  const getRoleNameFromWeaponId = (weaponId: string) => {
    return getRoleFromWeapon(weaponId)?.name;
  };

  const getRoleNameFromId = (id: string) => {
    const roleById = ROLE_OPTIONS.find(r => r.id === id);
    if (roleById) return roleById.name;
    return getRoleNameFromWeaponId(id);
  };

  const allRoles = Array.from(new Set([
    ...Object.keys(stats),
    ...(requirements ? Object.entries(requirements).filter(([_, count]) => count > 0).map(([id]) => getRoleNameFromId(id)).filter(Boolean) as string[] : []),
    ...(teams ? teams.flatMap(t => t.requirements ? Object.entries(t.requirements).filter(([_, count]) => count > 0).map(([id]) => getRoleNameFromId(id)).filter(Boolean) as string[] : []) : [])
  ]));

  allRoles.sort((a, b) => {
    const countA = stats[a]?.count || 0;
    const countB = stats[b]?.count || 0;
    if (countA !== countB) return countB - countA;
    return a.localeCompare(b);
  });

  // Calculate missing weapons
  const missingWeaponsMap: Record<string, number> = {};
  
  if (teams) {
    teams.forEach(team => {
      if (team.requirements) {
        const { primary, secondary } = getWeaponStats(team.members);
        Object.entries(team.requirements).forEach(([weaponId, requiredCount]) => {
          if (requiredCount > 0) {
            const currentCount = (primary[weaponId]?.count || 0) + (secondary[weaponId]?.count || 0);
            const missing = requiredCount - currentCount;
            if (missing > 0) {
              missingWeaponsMap[weaponId] = (missingWeaponsMap[weaponId] || 0) + missing;
            }
          }
        });
      }
    });
  } else if (requirements) {
    const { primary, secondary } = getWeaponStats(members);
    Object.entries(requirements).forEach(([weaponId, requiredCount]) => {
      if (requiredCount > 0) {
        const currentCount = (primary[weaponId]?.count || 0) + (secondary[weaponId]?.count || 0);
        const missing = requiredCount - currentCount;
        if (missing > 0) {
          missingWeaponsMap[weaponId] = (missingWeaponsMap[weaponId] || 0) + missing;
        }
      }
    });
  }

  const missingWeapons = Object.entries(missingWeaponsMap).map(([weaponId, count]) => ({
    weapon: Object.values(WEAPONS).find(w => w.id === weaponId)!,
    count
  })).filter(w => w.weapon);

  // Calculate missing ranks
  const missingRanksMap: Record<string, number> = {};
  if (teams) {
    teams.forEach(team => {
      if (team.requirements) {
        Object.entries(team.requirements).forEach(([id, requiredCount]) => {
          if (id.startsWith('rank') && requiredCount > 0) {
            const currentCount = team.members.filter(m => m.rank.id === id).length;
            const missing = requiredCount - currentCount;
            if (missing > 0) {
              missingRanksMap[id] = (missingRanksMap[id] || 0) + missing;
            }
          }
        });
      }
    });
  } else if (requirements) {
    Object.entries(requirements).forEach(([id, requiredCount]) => {
      if (id.startsWith('rank') && requiredCount > 0) {
        const currentCount = members.filter(m => m.rank.id === id).length;
        const missing = requiredCount - currentCount;
        if (missing > 0) {
          missingRanksMap[id] = (missingRanksMap[id] || 0) + missing;
        }
      }
    });
  }

  const missingRanks = Object.entries(missingRanksMap).map(([rankId, count]) => ({
    rank: Object.values(RANKS).find(r => r.id === rankId)!,
    count
  })).filter(r => r.rank);

  // Calculate missing roles
  const missingRolesMap: Record<string, number> = {};
  const roleIds = ['tank', 'dps', 'heal', 'flex'];
  
  if (teams) {
    teams.forEach(team => {
      if (team.requirements) {
        Object.entries(team.requirements).forEach(([id, requiredCount]) => {
          if (roleIds.includes(id) && requiredCount > 0) {
            const currentCount = team.members.filter(m => {
              const mRole = ROLE_OPTIONS.find(r => r.id === m.role) || Object.values(ROLES).find(r => r.id === m.role) || ROLES[m.role.toUpperCase()];
              return mRole?.id === id;
            }).length;
            const missing = requiredCount - currentCount;
            if (missing > 0) {
              missingRolesMap[id] = (missingRolesMap[id] || 0) + missing;
            }
          }
        });
      }
    });
  } else if (requirements) {
    Object.entries(requirements).forEach(([id, requiredCount]) => {
      if (roleIds.includes(id) && requiredCount > 0) {
        const currentCount = members.filter(m => {
          const mRole = ROLE_OPTIONS.find(r => r.id === m.role) || Object.values(ROLES).find(r => r.id === m.role) || ROLES[m.role.toUpperCase()];
          return mRole?.id === id;
        }).length;
        const missing = requiredCount - currentCount;
        if (missing > 0) {
          missingRolesMap[id] = (missingRolesMap[id] || 0) + missing;
        }
      }
    });
  }

  const missingRoles = Object.entries(missingRolesMap).map(([roleId, count]) => ({
    role: ROLE_OPTIONS.find(r => r.id === roleId)!,
    count
  })).filter(r => r.role);

  // Calculate missing positions
  const missingPositionsMap: Record<string, number> = {};
  const positionIds = ['pos_cong', 'pos_thu', 'pos_flex', 'công', 'thủ', 'flex'];
  
  if (teams) {
    teams.forEach(team => {
      if (team.requirements) {
        Object.entries(team.requirements).forEach(([id, requiredCount]) => {
          if (positionIds.includes(id) && requiredCount > 0) {
            const currentCount = team.members.filter(m => {
              const mPos = m.position?.toLowerCase();
              if (id === 'pos_cong' || id === 'công') return mPos === 'công' || mPos === 'pos_cong';
              if (id === 'pos_thu' || id === 'thủ') return mPos === 'thủ' || mPos === 'pos_thu';
              if (id === 'pos_flex' || id === 'flex') return mPos === 'flex' || mPos === 'pos_flex';
              return false;
            }).length;
            const missing = requiredCount - currentCount;
            if (missing > 0) {
              const canonicalId = id === 'công' ? 'pos_cong' : id === 'thủ' ? 'pos_thu' : id === 'flex' ? 'pos_flex' : id;
              missingPositionsMap[canonicalId] = (missingPositionsMap[canonicalId] || 0) + missing;
            }
          }
        });
      }
    });
  } else if (requirements) {
    Object.entries(requirements).forEach(([id, requiredCount]) => {
      if (positionIds.includes(id) && requiredCount > 0) {
        const currentCount = members.filter(m => {
          const mPos = m.position?.toLowerCase();
          if (id === 'pos_cong' || id === 'công') return mPos === 'công' || mPos === 'pos_cong';
          if (id === 'pos_thu' || id === 'thủ') return mPos === 'thủ' || mPos === 'pos_thu';
          if (id === 'pos_flex' || id === 'flex') return mPos === 'flex' || mPos === 'pos_flex';
          return false;
        }).length;
        const missing = requiredCount - currentCount;
        if (missing > 0) {
          const canonicalId = id === 'công' ? 'pos_cong' : id === 'thủ' ? 'pos_thu' : id === 'flex' ? 'pos_flex' : id;
          missingPositionsMap[canonicalId] = (missingPositionsMap[canonicalId] || 0) + missing;
        }
      }
    });
  }

  const missingPositions = Object.entries(missingPositionsMap).map(([posId, count]) => ({
    pos: POSITION_OPTIONS.find(p => p.id === posId)!,
    count
  })).filter(p => p.pos);

  const offlineMembers = members.filter(m => m.status === 'offline');

  const getRoleRequiredCount = (roleDef: Role) => {
    if (teams) {
      let total = 0;
      let hasReqs = false;
      teams.forEach(t => {
        if (t.requirements) {
          hasReqs = true;
          // Check for direct role requirement
          const roleOption = ROLE_OPTIONS.find(ro => ro.name === roleDef.name);
          if (roleOption && t.requirements[roleOption.id]) {
            total += t.requirements[roleOption.id];
          }
          // Check for weapon requirements that map to this role
          roleDef.weapons.forEach(w => {
            total += (t.requirements[w.id] || 0);
          });
        }
      });
      return hasReqs ? total : null;
    }
    if (!requirements) return null;
    let total = 0;
    const roleOption = ROLE_OPTIONS.find(ro => ro.name === roleDef.name);
    if (roleOption && requirements[roleOption.id]) {
      total += requirements[roleOption.id];
    }
    roleDef.weapons.forEach(w => {
      total += (requirements[w.id] || 0);
    });
    return total;
  };

  const getRankStats = (members: Member[]) => {
    const stats: Record<string, { rank: any, count: number }> = {};
    members.forEach(m => {
      if (!stats[m.rank.id]) stats[m.rank.id] = { rank: m.rank, count: 0 };
      stats[m.rank.id].count++;
    });
    return stats;
  };

  const rankStats = getRankStats(members);
  const allRanks = Object.values(RANKS).filter(r => rankStats[r.id] || (requirements && requirements[r.id] > 0));

  const getPositionStats = (members: Member[]) => {
    const stats: Record<string, { pos: any, count: number }> = {};
    members.forEach(m => {
      const mPos = m.position?.toLowerCase();
      const pos = POSITION_OPTIONS.find(p => p.id === mPos || (p.id === 'pos_cong' && mPos === 'công') || (p.id === 'pos_thu' && mPos === 'thủ') || (p.id === 'pos_flex' && mPos === 'flex'));
      if (pos) {
        if (!stats[pos.id]) stats[pos.id] = { pos, count: 0 };
        stats[pos.id].count++;
      }
    });
    return stats;
  };

  const positionStats = getPositionStats(members);
  const allPositions = POSITION_OPTIONS.filter(p => positionStats[p.id] || (requirements && (requirements[p.id] > 0 || (p.id === 'pos_cong' && requirements['công'] > 0) || (p.id === 'pos_thu' && requirements['thủ'] > 0) || (p.id === 'pos_flex' && requirements['flex'] > 0))));

  const hasTopSection = allRanks.length > 0 || allPositions.length > 0;
  const hasRolesSection = allRoles.length > 0;
  const hasMissingWeapons = missingWeapons.length > 0;
  const hasMissingRanks = missingRanks.length > 0;
  const hasMissingRoles = missingRoles.length > 0;
  const hasMissingPositions = missingPositions.length > 0;
  const hasOfflineMembers = offlineMembers.length > 0;

  if (!hasTopSection && !hasRolesSection && !hasMissingWeapons && !hasMissingRanks && !hasMissingRoles && !hasMissingPositions && !hasOfflineMembers) return <span className="text-[#949BA4]">{t('stats.noMembers')}</span>;

  const sections: React.ReactNode[] = [];

  if (hasTopSection) {
    sections.push(
      <div key="top" className="flex flex-col gap-2">
        {allRanks.length > 0 && (
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#949BA4]">
              {t('stats.ranks')}
            </span>
            <div className="flex flex-wrap gap-2">
              {allRanks.map(rank => {
                const count = rankStats[rank.id]?.count || 0;
                const required = requirements ? (requirements[rank.id] || 0) : 0;
                return (
                  <div 
                    key={rank.id}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 border ${count < required ? 'bg-[#f1c40f]/10 border-[#f1c40f]/30 text-[#f1c40f]' : 'bg-[#1E1F22] border-[#3F4147] text-[#949BA4]'}`}
                    title={t(rank.name)}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rank.color }}></div>                    
                    <span className="font-mono text-xs font-bold">{count}{required > 0 ? `/${required}` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {allPositions.length > 0 && (
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#949BA4]">
              {t('stats.positions')}
            </span>
            <div className="flex flex-wrap gap-2">
              {allPositions.map(pos => {
                const count = positionStats[pos.id]?.count || 0;
                const required = requirements ? (requirements[pos.id] || (pos.id === 'pos_cong' ? requirements['công'] : pos.id === 'pos_thu' ? requirements['thủ'] : pos.id === 'pos_flex' ? requirements['flex'] : 0) || 0) : 0;
                return (
                  <div 
                    key={pos.id}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 border ${count < required ? 'bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2]' : 'bg-[#1E1F22] border-[#3F4147] text-[#949BA4]'}`}
                    title={t(pos.name)}
                  >
                    <span className="text-sm">{pos.icon}</span>
                    <span className="font-mono text-xs font-bold">{count}{required > 0 ? `/${required}` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hasRolesSection) {
    sections.push(
      <div key="roles" className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-6 border-b border-[#3F4147] pb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4]">{t('stats.roles')}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4] text-right">{t('stats.primaryWeapon')}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4] text-right">{t('stats.secondaryWeapon')}</span>
        </div>
        <div className="flex flex-col gap-2">
          {allRoles.map(roleName => {
            const roleDef = Object.values(ROLES).find(r => r.name === roleName);
            const predefinedRole = ROLE_OPTIONS.find(r => r.name === roleName);
            
            const count = stats[roleName]?.count || 0;
            const required = roleDef ? getRoleRequiredCount(roleDef) : null;
            
            const roleMembers = members.filter(m => {
              const mPredefinedRole = ROLE_OPTIONS.find(r => r.id === m.role) || Object.values(ROLES).find(r => r.id === m.role) || ROLES[m.role.toUpperCase()];
              const mRoleName = mPredefinedRole ? mPredefinedRole.name : m.role;
              return mRoleName === roleName;
            });
            const { primary, secondary } = getWeaponStats(roleMembers);
            const primaryList = Object.values(primary).sort((a, b) => a.count - b.count);
            const secondaryList = Object.values(secondary).sort((a, b) => a.count - b.count);
            
            const roleIcon = predefinedRole?.icon || roleDef?.icon || '👤';
            const roleColor = predefinedRole?.color || roleDef?.color || '#949BA4';
            
            return (
              <div key={roleName} className="grid grid-cols-[auto_1fr_1fr] items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <WeaponIcon icon={roleIcon} name={t(roleName)} size={20} />
                  <div className="flex items-center font-mono text-sm font-bold">
                    <span className={required !== null && count < required ? "text-[#e74c3c]" : "text-[#F2F3F5]"} style={{ color: count > 0 && !roleDef && !(required !== null && count < required) ? roleColor : undefined }}>{count}</span>
                    {required !== null && required > 0 && (
                      <span className="text-[#949BA4] text-xs ml-1">/{required}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {primaryList.map(({ weapon, count }) => (
                    <div key={weapon.id} className="flex items-center gap-1">
                      <WeaponIcon icon={weapon.icon} name={t(weapon.name)} size={22} />
                      <span className="font-mono text-xs font-bold text-[#F2F3F5]">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {secondaryList.map(({ weapon, count }) => (
                    <div key={weapon.id} className="flex items-center gap-1">
                      <WeaponIcon icon={weapon.icon} name={t(weapon.name)} size={22} />
                      <span className="font-mono text-xs font-bold text-[#F2F3F5]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (hasMissingWeapons) {
    sections.push(
      <div key="missingWeapons" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#e74c3c]">
          {t('stats.missingWeapons')}
        </span>
        <div className="flex flex-wrap gap-2">
          {missingWeapons.map(({ weapon, count }) => (
            <div 
              key={weapon.id}
              className="flex items-center gap-1.5 rounded bg-[#e74c3c]/10 px-2 py-1 text-[#e74c3c]" 
            >
              <WeaponIcon icon={weapon.icon} name={t(weapon.name)} size={22} />
              <span className="font-mono text-xs font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasMissingRanks) {
    sections.push(
      <div key="missingRanks" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#f1c40f]">
          {t('stats.missingRanks')}
        </span>
        <div className="flex flex-wrap gap-2">
          {missingRanks.map(({ rank, count }) => (
            <div 
              key={rank.id}
              className="flex items-center gap-1.5 rounded bg-[#f1c40f]/10 px-2 py-1 text-[#f1c40f]" 
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rank.color }}></div>
              <span className="font-mono text-xs font-bold">x{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasMissingRoles) {
    sections.push(
      <div key="missingRoles" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9b59b6]">
          {t('stats.missingRoles')}
        </span>
        <div className="flex flex-wrap gap-2">
          {missingRoles.map(({ role, count }) => (
            <div 
              key={role.id}
              className="flex items-center gap-1.5 rounded bg-[#9b59b6]/10 px-2 py-1 text-[#9b59b6]" 
            >
              <span className="text-xs">{role.icon}</span>
              <span className="font-mono text-xs font-bold">x{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasMissingPositions) {
    sections.push(
      <div key="missingPositions" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5865F2]">
          {t('stats.missingPositions')}
        </span>
        <div className="flex flex-wrap gap-2">
          {missingPositions.map(({ pos, count }) => (
            <div 
              key={pos.id}
              className="flex items-center gap-1.5 rounded bg-[#5865F2]/10 px-2 py-1 text-[#5865F2]" 
            >
              <span className="text-xs">{pos.icon}</span>
              <span className="font-mono text-xs font-bold">x{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasOfflineMembers) {
    sections.push(
      <div key="offlineMembers" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4]">
          {t('stats.offlineMembers')} ({offlineMembers.length})
        </span>
        <div className="flex flex-wrap gap-2">
          {offlineMembers.map(m => (
            <div 
              key={m.id}
              className="flex items-center gap-1.5 rounded bg-[#1E1F22] border border-[#3F4147] px-2 py-1 text-[#949BA4]" 
            >
              <div className="h-2 w-2 rounded-full bg-[#80848E]"></div>
              <span className="text-xs font-bold">{m.ingameName?.trim() || m.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-[240px] flex-col gap-3">
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {index > 0 && <div className="border-t border-[#3F4147] opacity-50" />}
          {section}
        </React.Fragment>
      ))}
    </div>
  );
};
