import React, { useState, useMemo } from 'react';
import { X, BarChart2, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../models';
import { OverallStats } from './OverallStats';
import { isTowerArea, isPVPArea } from '../utils';

interface MemberStatsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  title?: string;
  memberTeamMap: Map<string, { teamId: string, teamName: string, areaName: string }>;
  setSelectedMember: (member: Member | null) => void;
  selectedTeamId: string | null;
  hideStatus?: boolean;
  handleAddToSelectedTeam?: (member: Member) => void;
  handleRemoveFromTeam?: (member: Member, teamId: string) => void;
  isSelectedTeamSpecial?: boolean;
  memberAllTeamIds?: Map<string, Set<string>>;
}

export const MemberStatsOverviewModal: React.FC<MemberStatsOverviewModalProps> = ({
  isOpen,
  onClose,
  members,
  title,
  memberTeamMap,
  setSelectedMember,
  selectedTeamId,
  hideStatus = false,
  handleAddToSelectedTeam,
  handleRemoveFromTeam,
  isSelectedTeamSpecial,
  memberAllTeamIds
}) => {
  const { t } = useTranslation();
  
  // Filter states
  const [localFilterRoles, setLocalFilterRoles] = useState<string[]>([]);
  const [localFilterWeapons, setLocalFilterWeapons] = useState<string[]>([]);
  const [localFilterRanks, setLocalFilterRanks] = useState<string[]>([]);
  const [localFilterPositions, setLocalFilterPositions] = useState<string[]>([]);
  const [localFilterStatus, setLocalFilterStatus] = useState<string[]>([]);
  const [weaponSlotFilter, setWeaponSlotFilter] = useState({ primary: true, secondary: false });

  const toggleFilter = (current: string[], setter: (val: string[]) => void, id: string) => {
    if (current.includes(id)) {
      setter(current.filter(i => i !== id));
    } else {
      setter([...current, id]);
    }
  };

  const clearAllFilters = () => {
    setLocalFilterRoles([]);
    setLocalFilterWeapons([]);
    setLocalFilterRanks([]);
    setLocalFilterPositions([]);
    setLocalFilterStatus([]);
  };

  const hasActiveFilters = localFilterRoles.length > 0 || 
    localFilterWeapons.length > 0 || 
    localFilterRanks.length > 0 || 
    localFilterPositions.length > 0 || 
    localFilterStatus.length > 0;

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (localFilterRoles.length > 0 && !localFilterRoles.includes(m.role)) return false;
      
      if (localFilterWeapons.length > 0) {
        const mWeapons: string[] = [];
        if (weaponSlotFilter.primary) {
          if (m.primaryWeapon1?.id) mWeapons.push(m.primaryWeapon1.id);
          if (m.primaryWeapon2?.id) mWeapons.push(m.primaryWeapon2.id);
        }
        if (weaponSlotFilter.secondary) {
          m.secondaryWeapons.forEach(w => mWeapons.push(w.id));
        }
        
        const hasMatch = localFilterWeapons.some(wId => {
          if (wId === 'w0') {
            const hasPrimary1 = m.primaryWeapon1?.id && m.primaryWeapon1.id !== 'w0';
            const hasPrimary2 = m.primaryWeapon2?.id && m.primaryWeapon2.id !== 'w0';
            return !hasPrimary1 && !hasPrimary2;
          }
          return mWeapons.includes(wId);
        });
        if (!hasMatch) return false;
      }

      if (localFilterRanks.length > 0 && !localFilterRanks.includes(m.rank.id)) return false;
      
      if (localFilterPositions.length > 0) {
        const pos = m.position?.toLowerCase();
        const matches = localFilterPositions.some(pId => {
          if (pId === 'pos_cong') return pos === 'công';
          if (pId === 'pos_thu') return pos === 'thủ';
          if (pId === 'pos_flex') return pos === 'flex';
          return false;
        });
        if (!matches) return false;
      }

      if (localFilterStatus.length > 0) {
        const status = m.status === 'in-game' ? 'online' : (m.status || 'offline');
        if (!localFilterStatus.includes(status)) return false;
      }

      return true;
    });
  }, [members, localFilterRoles, localFilterWeapons, localFilterRanks, localFilterPositions, localFilterStatus, weaponSlotFilter]);

  const stats = useMemo(() => {
    const weaponStats: any = {};
    let noWeaponCount = 0;
    const roleStats: any = {};
    const rankStats: any = {};
    const positionStats: any = {
      'pos_cong': { name: 'stats.pos_cong', count: 0, icon: '⚔️', color: '#e74c3c', matchKey: 'công' },
      'pos_thu': { name: 'stats.pos_thu', count: 0, icon: '🛡️', color: '#3498db', matchKey: 'thủ' },
      'pos_flex': { name: 'stats.pos_flex', count: 0, icon: '🔀', color: '#9b59b6', matchKey: 'flex' }
    };

    members.forEach(m => {
      const hasPrimary1 = m.primaryWeapon1?.id && m.primaryWeapon1.id !== 'w0';
      const hasPrimary2 = m.primaryWeapon2?.id && m.primaryWeapon2.id !== 'w0';
      if (!hasPrimary1 && !hasPrimary2) noWeaponCount++;

      if (weaponSlotFilter.primary) {
        if (m.primaryWeapon1?.id && m.primaryWeapon1.id !== 'w0') {
          if (!weaponStats[m.primaryWeapon1.id]) weaponStats[m.primaryWeapon1.id] = { count: 0 };
          weaponStats[m.primaryWeapon1.id].count++;
        }
        if (m.primaryWeapon2?.id && m.primaryWeapon2.id !== 'w0') {
          if (!weaponStats[m.primaryWeapon2.id]) weaponStats[m.primaryWeapon2.id] = { count: 0 };
          weaponStats[m.primaryWeapon2.id].count++;
        }
      }
      if (weaponSlotFilter.secondary) {
        m.secondaryWeapons.forEach(sw => {
          if (sw.id !== 'w0') {
            if (!weaponStats[sw.id]) weaponStats[sw.id] = { count: 0 };
            weaponStats[sw.id].count++;
          }
        });
      }

      const roleKey = m.role.toLowerCase();
      if (!roleStats[roleKey]) roleStats[roleKey] = { count: 0, id: m.role };
      roleStats[roleKey].count++;

      if (!rankStats[m.rank.id]) rankStats[m.rank.id] = { count: 0 };
      rankStats[m.rank.id].count++;

      if (m.position) {
        const posKey = Object.keys(positionStats).find(key => positionStats[key].matchKey === m.position?.toLowerCase());
        if (posKey) positionStats[posKey].count++;
      }
    });

    return { weaponStats, noWeaponCount, roleStats, rankStats, positionStats };
  }, [members, weaponSlotFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl bg-[#313338] shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3F4147] bg-[#2B2D31] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/10 text-[#5865F2]">
                  <BarChart2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  <p className="text-xs text-[#949BA4]">{members.length} {t('setup.member')}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-2 text-[#949BA4] transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <OverallStats 
                membersCount={members.length}
                stats={stats}
                localFilterRoles={localFilterRoles}
                localFilterWeapons={localFilterWeapons}
                localFilterRanks={localFilterRanks}
                localFilterPositions={localFilterPositions}
                localFilterStatus={localFilterStatus}
                weaponSlotFilter={weaponSlotFilter}
                toggleRole={(id) => toggleFilter(localFilterRoles, setLocalFilterRoles, id)}
                toggleWeapon={(id) => toggleFilter(localFilterWeapons, setLocalFilterWeapons, id)}
                toggleRank={(id) => toggleFilter(localFilterRanks, setLocalFilterRanks, id)}
                togglePosition={(id) => toggleFilter(localFilterPositions, setLocalFilterPositions, id)}
                toggleStatus={(id) => toggleFilter(localFilterStatus, setLocalFilterStatus, id)}
                setWeaponSlotFilter={setWeaponSlotFilter}
                clearAllFilters={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
                filteredMembers={filteredMembers}
                memberTeamMap={memberTeamMap}
                setSelectedMember={setSelectedMember}
                selectedTeamId={selectedTeamId}
                hideStatus={hideStatus}
                handleAddToSelectedTeam={handleAddToSelectedTeam}
                handleRemoveFromTeam={handleRemoveFromTeam}
                isSelectedTeamSpecial={isSelectedTeamSpecial}
                memberAllTeamIds={memberAllTeamIds}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-[#3F4147] bg-[#2B2D31] px-6 py-4 flex justify-end">
              <button 
                onClick={onClose}
                className="rounded bg-[#5865F2] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#4752C4] active:scale-95"
              >
                {t('common.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
