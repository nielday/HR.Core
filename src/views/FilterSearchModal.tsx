import React from 'react';
import { Filter, X, Search, Sword, Shield } from 'lucide-react';
import { ROLES, WEAPONS, RANKS, ROLE_OPTIONS, POSITION_OPTIONS } from '../constants';
import { CheckboxGrid } from './';
import { useTranslation } from 'react-i18next';

interface FilterSearchModalProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  isSearchActive: boolean;
  totalMatchingMembers: number;
  handleClearFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  selectedWeapons: string[];
  setSelectedWeapons: (weapons: string[]) => void;
  selectedRanks: string[];
  setSelectedRanks: (ranks: string[]) => void;
  selectedPositions: string[];
  setSelectedPositions: (positions: string[]) => void;
  weaponSlotFilter: { primary: boolean, secondary: boolean };
  setWeaponSlotFilter: (filter: { primary: boolean, secondary: boolean }) => void;
  isUnassignedOnly: boolean;
  setIsUnassignedOnly: (isUnassignedOnly: boolean) => void;
}

export const FilterSearchModal: React.FC<FilterSearchModalProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  isSearchActive,
  totalMatchingMembers,
  handleClearFilters,
  searchQuery,
  setSearchQuery,
  handleSearch,
  selectedRoles,
  setSelectedRoles,
  selectedWeapons,
  setSelectedWeapons,
  selectedRanks,
  setSelectedRanks,
  selectedPositions,
  setSelectedPositions,
  weaponSlotFilter,
  setWeaponSlotFilter,
  isUnassignedOnly,
  setIsUnassignedOnly
}) => {
  const { t } = useTranslation();

  if (!isFilterOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex w-[95%] max-w-[1000px] max-h-[90vh] flex-col rounded-lg border border-[#1E1F22] bg-[#2B2D31] shadow-2xl">
        {/* Top Actions */}
        <div className="flex items-center justify-between border-b border-[#1E1F22] p-4">
          <div className="flex items-center gap-2 text-[#DBDEE1] font-bold text-xl">
            <Filter size={24} />
            {t('common.searchFilter')}
            {isSearchActive && (
              <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#5865F2] text-white text-xs font-bold">
                {totalMatchingMembers}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[#949BA4] hover:bg-[#1E1F22] hover:text-[#DBDEE1] transition-colors"
            >
              <X size={16} />
              {t('stats.clearFilters')}
            </button>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="rounded-full p-2 text-[#949BA4] hover:bg-[#3F4147] hover:text-[#DBDEE1] transition-all"
              title={t('common.close')}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#949BA4]" size={20} />
            <input 
              type="text" 
              placeholder={t('common.searchPlaceholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full rounded-lg bg-[#1E1F22] py-3 pl-12 pr-4 text-base text-[#DBDEE1] placeholder-[#949BA4] focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
              autoFocus
            />
          </div>

          {/* Unassigned Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isUnassignedOnly"
              checked={isUnassignedOnly}
              onChange={(e) => setIsUnassignedOnly(e.target.checked)}
              className="h-5 w-5 rounded border-[#3F4147] bg-[#2B2D31] text-[#5865F2] focus:ring-[#5865F2] focus:ring-offset-0"
            />
            <label htmlFor="isUnassignedOnly" className="text-sm text-[#DBDEE1] cursor-pointer">
              {t('common.showUnassignedOnly')}
            </label>
          </div>
          
          {/* Filter Grid */}
          <div className="flex flex-col gap-8">
            {/* Top Row: Roles, Ranks, Positions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Roles Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-[#3F4147] pb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.roles')}</span>
                  <span className="rounded bg-[#1E1F22] px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2]">{ROLE_OPTIONS.length}</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  <CheckboxGrid 
                    items={ROLE_OPTIONS.map(role => ({ ...role, name: t(role.name) }))} 
                    selectedIds={selectedRoles} 
                    onChange={setSelectedRoles} 
                  />
                </div>
              </div>

              {/* Ranks Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-[#3F4147] pb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.ranks')}</span>
                  <span className="rounded bg-[#1E1F22] px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2]">{Object.keys(RANKS).length}</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  <CheckboxGrid 
                    items={Object.values(RANKS).map(rank => ({ ...rank, name: t(rank.name) }))} 
                    selectedIds={selectedRanks} 
                    onChange={setSelectedRanks} 
                  />
                </div>
              </div>

              {/* Position Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-[#3F4147] pb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.positions')}</span>
                  <span className="rounded bg-[#1E1F22] px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2]">{POSITION_OPTIONS.length}</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  <CheckboxGrid 
                    items={POSITION_OPTIONS.map(pos => ({ ...pos, name: t(pos.name) }))} 
                    selectedIds={selectedPositions} 
                    onChange={setSelectedPositions} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Weapons Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#3F4147] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#949BA4]">{t('stats.weapons')}</span>
                  <span className="rounded bg-[#1E1F22] px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2]">{Object.keys(WEAPONS).length}</span>
                </div>
                
                {/* Weapon Slot Toggle */}
                <div className="flex items-center gap-1 rounded bg-[#1E1F22] p-0.5 border border-[#3F4147]">
                  <button 
                    onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, primary: !weaponSlotFilter.primary })}
                    className={`flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${weaponSlotFilter.primary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
                    title={t('stats.primaryWeapon')}
                  >
                    <Sword size={10} />
                    {t('stats.primary')}
                  </button>
                  <button 
                    onClick={() => setWeaponSlotFilter({ ...weaponSlotFilter, secondary: !weaponSlotFilter.secondary })}
                    className={`flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${weaponSlotFilter.secondary ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#DBDEE1]'}`}
                    title={t('stats.secondaryWeapon')}
                  >
                    <Shield size={10} />
                    {t('stats.secondary')}
                  </button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                <CheckboxGrid 
                  items={Object.values(WEAPONS).map(weapon => ({ ...weapon, name: t(weapon.name) }))} 
                  selectedIds={selectedWeapons} 
                  onChange={setSelectedWeapons} 
                  layout="weapon-grid"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-[#1E1F22] p-4 bg-[#2B2D31] rounded-b-lg">
          <div className="text-sm text-[#949BA4]">
            {t('common.found')} <span className="font-bold text-[#F2F3F5]">{totalMatchingMembers}</span> {t('common.results')}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="rounded-md px-6 py-2.5 text-sm font-bold text-[#DBDEE1] hover:bg-[#3F4147] transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
