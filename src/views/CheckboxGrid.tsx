import React from 'react';
import { WeaponIcon } from './WeaponIcon';

export const CheckboxGrid = ({ 
  items, 
  selectedIds, 
  onChange,
  layout = 'grid'
}: { 
  items: { id: string, name: string, color?: string, icon?: string }[]; 
  selectedIds: string[]; 
  onChange: (ids: string[]) => void;
  layout?: 'grid' | 'weapon-grid';
}) => {
  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (layout === 'weapon-grid') {
    return (
      <div 
        className="grid grid-rows-5 grid-flow-col gap-x-4 gap-y-1.5 overflow-x-auto custom-scrollbar pb-2" 
        dir="rtl"
      >
        {items.map(item => (
          <label 
            key={item.id} 
            className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-[#2B2D31] min-w-[160px]"
            dir="ltr"
            onClick={(e) => {
              e.preventDefault();
              toggleItem(item.id);
            }}
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(item.id) ? 'border-[#5865F2] bg-[#5865F2]' : 'border-[#949BA4] bg-transparent'}`}>
              {selectedIds.includes(item.id) && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            {item.icon && <WeaponIcon icon={item.icon} name={item.name} size={20} className="shrink-0" />}
            <span className="truncate text-sm font-medium" style={{ color: item.color || '#DBDEE1' }}>{item.name}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(item => (
        <label 
          key={item.id} 
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[#2B2D31]"
          onClick={(e) => {
            e.preventDefault();
            toggleItem(item.id);
          }}
        >
          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedIds.includes(item.id) ? 'border-[#5865F2] bg-[#5865F2]' : 'border-[#949BA4] bg-transparent'}`}>
            {selectedIds.includes(item.id) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
          {item.icon && <WeaponIcon icon={item.icon} name={item.name} size={16} className="shrink-0" />}
          <span className="truncate text-sm font-medium" style={{ color: item.color || '#DBDEE1' }}>{item.name}</span>
        </label>
      ))}
    </div>
  );
};
