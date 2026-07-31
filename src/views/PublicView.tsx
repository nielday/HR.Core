import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Area, SavedSetup, Member } from '../models';
import { AreaGrid, GlobalStatsPanel, MemberStatsOverviewModal } from './';

interface PublicViewProps {
  setupId: string;
  groupId: string;
}

export const PublicView: React.FC<PublicViewProps> = ({ setupId, groupId }) => {
  const { t } = useTranslation();
  const [setup, setSetup] = useState<SavedSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsModalMembers, setStatsModalMembers] = useState<Member[]>([]);
  const [statsModalTitle, setStatsModalTitle] = useState('');

  // Filter states (for GlobalStatsPanel)
  const [globalFilterRoles, setGlobalFilterRoles] = useState<string[]>([]);
  const [globalFilterWeapons, setGlobalFilterWeapons] = useState<string[]>([]);
  const [globalFilterRanks, setGlobalFilterRanks] = useState<string[]>([]);
  const [globalFilterPositions, setGlobalFilterPositions] = useState<string[]>([]);
  const [globalFilterStatus, setGlobalFilterStatus] = useState<string[]>([]);
  const [weaponSlotFilter, setWeaponSlotFilter] = useState({ primary: true, secondary: false });

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/setups/${groupId}/${setupId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Không tìm thấy cấu hình này.');
          throw new Error('Lỗi khi tải cấu hình.');
        }
        const data: SavedSetup = await response.json();
        setSetup(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (setupId && groupId) {
      fetchSetup();
    } else {
      setError('Thiếu thông tin ID cấu hình hoặc Nhóm.');
      setLoading(false);
    }
  }, [setupId, groupId]);

  const handleOpenStatsModal = (members: Member[], title: string) => {
    setStatsModalMembers(members);
    setStatsModalTitle(title);
    setIsStatsModalOpen(true);
  };

  const memberTeamMap = useMemo(() => {
    const map = new Map<string, { teamId: string, teamName: string, areaName: string }>();
    if (!setup) return map;
    
    setup.areas.forEach(area => {
      area.teams.forEach(team => {
        team.members.forEach(member => {
          map.set(member.id, {
            teamId: team.id,
            teamName: team.name,
            areaName: area.name
          });
        });
      });
    });
    return map;
  }, [setup]);

  const isMemberMatching = (m: Member) => true; // No search in public view for now
  const isMemberMatchingGlobal = (m: Member) => {
    if (globalFilterRoles.length > 0 && !globalFilterRoles.includes(m.role)) return false;
    if (globalFilterWeapons.length > 0) {
      const mWeapons = [m.primaryWeapon1.id, m.primaryWeapon2.id, ...m.secondaryWeapons.map(w => w.id)];
      if (!globalFilterWeapons.some(wId => mWeapons.includes(wId))) return false;
    }
    if (globalFilterRanks.length > 0 && !globalFilterRanks.includes(m.rank.id)) return false;
    if (globalFilterPositions.length > 0) {
       // Simple position match
       const pos = m.position?.toLowerCase();
       const matches = globalFilterPositions.some(pId => {
         if (pId === 'pos_cong') return pos === 'công';
         if (pId === 'pos_thu') return pos === 'thủ';
         if (pId === 'pos_flex') return pos === 'flex';
         return false;
       });
       if (!matches) return false;
    }
    if (globalFilterStatus.length > 0) {
      const status = m.status === 'in-game' ? 'online' : (m.status || 'offline');
      if (!globalFilterStatus.includes(status)) return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#313338] text-[#DBDEE1]">
        <Loader2 size={48} className="animate-spin text-[#5865F2]" />
        <p className="text-lg font-semibold">Đang tải cấu hình...</p>
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#313338] text-[#DBDEE1] p-4">
        <AlertCircle size={64} className="text-red-500" />
        <h1 className="text-2xl font-bold text-white">Lỗi</h1>
        <p className="text-center text-[#949BA4] max-w-md">{error || 'Đã xảy ra lỗi không xác định.'}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 rounded bg-[#5865F2] px-6 py-2 font-semibold text-white hover:bg-[#4752C4] transition-colors"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#313338] text-[#DBDEE1] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#3F4147] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{setup.name}</h1>
            <div className="flex items-center gap-4 text-sm text-[#949BA4]">
              <span>Người tạo: <span className="text-[#DBDEE1] font-medium">{setup.creator}</span></span>
              <span>•</span>
              <span>Ngày tạo: <span className="text-[#DBDEE1] font-medium">{new Date(setup.timestamp).toLocaleString('vi-VN')}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleOpenStatsModal(setup.areas.flatMap(a => a.teams.flatMap(t => t.members)), t('stats.areaTeamStats'))}
              className="flex items-center justify-center gap-2 rounded bg-[#4E5058] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D6F78] transition-all active:scale-95"
              title={t('stats.areaTeamStats')}
            >
              <BarChart2 size={18} />
              <span>Thống kê</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <GlobalStatsPanel 
          areas={setup.areas}
          globalFilterRoles={globalFilterRoles}
          setGlobalFilterRoles={setGlobalFilterRoles}
          globalFilterWeapons={globalFilterWeapons}
          setGlobalFilterWeapons={setGlobalFilterWeapons}
          globalFilterRanks={globalFilterRanks}
          setGlobalFilterRanks={setGlobalFilterRanks}
          globalFilterPositions={globalFilterPositions}
          setGlobalFilterPositions={setGlobalFilterPositions}
          globalFilterStatus={globalFilterStatus}
          setGlobalFilterStatus={setGlobalFilterStatus}
          weaponSlotFilter={weaponSlotFilter}
          setWeaponSlotFilter={setWeaponSlotFilter}
          hideStatus={true}
        />

        {/* Grid */}
        <div className="mt-8">
          <AreaGrid 
            areas={setup.areas}
            isSearchActive={false}
            isGlobalFilterActive={globalFilterRoles.length > 0 || globalFilterWeapons.length > 0 || globalFilterRanks.length > 0 || globalFilterPositions.length > 0 || globalFilterStatus.length > 0}
            isMemberMatching={isMemberMatching}
            isMemberMatchingGlobal={isMemberMatchingGlobal}
            forceExpandAll={true}
            editingAreaId={null}
            setEditingAreaId={() => {}}
            tempAreaName=""
            setTempAreaName={() => {}}
            handleRenameArea={() => {}}
            handleAddTeam={() => {}}
            handleClearAreaMembers={() => {}}
            handleDeleteArea={() => {}}
            handleMoveMember={() => {}}
            handleMoveTeam={() => {}}
            handleRenameTeam={() => {}}
            handleDeleteTeam={() => {}}
            setSettingsTeam={() => {}}
            handleClearTeamMembers={() => {}}
            selectedTeamId={null}
            setSelectedTeamId={() => {}}
            selectedMemberId={null}
            setSelectedMemberId={() => {}}
            setSelectedMember={() => {}}
            handleRemoveFromTeam={() => {}}
            handleAddArea={() => {}}
            onOpenStatsModal={handleOpenStatsModal}
            memberSource={setup.memberSource || 'discord'}
            readOnly={true}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-[#3F4147] pt-8 text-center text-sm text-[#949BA4]">
          <p>© 2026 Team Setup Viewer. Chế độ chỉ xem.</p>
        </div>
      </div>

      {/* Stats Modal */}
      {isStatsModalOpen && (
        <MemberStatsOverviewModal 
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          members={statsModalMembers}
          title={statsModalTitle}
          memberTeamMap={memberTeamMap}
          setSelectedMember={() => {}}
          selectedTeamId={null}
          hideStatus={true}
        />
      )}
    </div>
  );
};
