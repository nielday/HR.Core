import { useState } from 'react';
import { Member, Team } from '../models';

export function useModals() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [settingsTeam, setSettingsTeam] = useState<Team | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isEditingSetupName, setIsEditingSetupName] = useState(false);
  const [tempSetupName, setTempSetupName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [tempAreaName, setTempAreaName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsModalMembers, setStatsModalMembers] = useState<Member[]>([]);
  const [statsModalTitle, setStatsModalTitle] = useState<string | null>(null);

  return {
    selectedMember,
    setSelectedMember,
    settingsTeam,
    setSettingsTeam,
    isSidebarOpen,
    setIsSidebarOpen,
    isEditingSetupName,
    setIsEditingSetupName,
    tempSetupName,
    setTempSetupName,
    editingAreaId,
    setEditingAreaId,
    tempAreaName,
    setTempAreaName,
    selectedMemberId,
    setSelectedMemberId,
    isDiscordModalOpen,
    setIsDiscordModalOpen,
    isAddMemberModalOpen,
    setIsAddMemberModalOpen,
    isStatsModalOpen,
    setIsStatsModalOpen,
    statsModalMembers,
    setStatsModalMembers,
    statsModalTitle,
    setStatsModalTitle
  };
}
