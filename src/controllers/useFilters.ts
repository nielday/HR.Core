import { useState, useEffect } from 'react';

export function useFilters() {
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedParticipation, setSelectedParticipation] = useState<string[]>([]);
  const [isUnassignedOnly, setIsUnassignedOnly] = useState(false);
  
  // Global View Filters (from Stats Panel)
  const [globalFilterRoles, setGlobalFilterRoles] = useState<string[]>([]);
  const [globalFilterWeapons, setGlobalFilterWeapons] = useState<string[]>([]);
  const [globalFilterRanks, setGlobalFilterRanks] = useState<string[]>([]);
  const [globalFilterPositions, setGlobalFilterPositions] = useState<string[]>([]);
  const [globalFilterStatus, setGlobalFilterStatus] = useState<string[]>([]);
  const [weaponSlotFilter, setWeaponSlotFilter] = useState({ primary: true, secondary: true });

  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRoles([]);
    setSelectedWeapons([]);
    setSelectedRanks([]);
    setSelectedPositions([]);
    setSelectedParticipation([]);
    setIsUnassignedOnly(false);
    setGlobalFilterRoles([]);
    setGlobalFilterWeapons([]);
    setGlobalFilterRanks([]);
    setGlobalFilterPositions([]);
    setGlobalFilterStatus([]);
    
    // Expand all accordions
    setForceExpandAll(true);
    setTimeout(() => {
      setForceExpandAll(undefined);
    }, 100);
  };

  const handleSearch = () => {
    setIsFilterOpen(false);
  };

  const isSearchActive = searchQuery !== '' || selectedRoles.length > 0 || selectedWeapons.length > 0 || selectedRanks.length > 0 || selectedPositions.length > 0 || isUnassignedOnly;
  const isGlobalFilterActive = globalFilterRoles.length > 0 || globalFilterWeapons.length > 0 || globalFilterRanks.length > 0 || globalFilterPositions.length > 0 || globalFilterStatus.length > 0;

  return {
    isFilterOpen,
    setIsFilterOpen,
    searchQuery,
    setSearchQuery,
    selectedRoles,
    setSelectedRoles,
    selectedWeapons,
    setSelectedWeapons,
    selectedRanks,
    setSelectedRanks,
    selectedParticipation,
    setSelectedParticipation,
    isUnassignedOnly,
    setIsUnassignedOnly,
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
    forceExpandAll,
    setForceExpandAll,
    handleClearFilters,
    handleSearch,
    isSearchActive,
    isGlobalFilterActive,
    selectedPositions,
    setSelectedPositions
  };
}
