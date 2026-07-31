import React from 'react';
import { WeaponIcon } from './WeaponIcon';

export interface StatsToggleButtonProps {
  id: string;
  name: string;
  count: number;
  isActive: boolean;
  onClick: (id: string) => void;
  icon?: string;          
  color?: string;         
  isColorCircle?: boolean;
  weaponIcon?: string;    
  iconSize?: number;
  className?: string;     
}

export const StatsToggleButton: React.FC<StatsToggleButtonProps> = ({
  id, name, count, isActive, onClick, icon, color, isColorCircle, weaponIcon, iconSize = 16, className = ""
}) => {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex w-full items-center gap-2 rounded h-8 px-2 text-[11px] border transition-all ${isActive ? 'bg-[#5865F2] border-[#5865F2] text-white shadow-md' : 'bg-[#1E1F22] border-[#3F4147] text-[#DBDEE1] hover:bg-[#3F4147]'} ${className}`}
    >
      {weaponIcon ? (
        <WeaponIcon icon={weaponIcon} name={name} size={iconSize} className="shrink-0" />
      ) : isColorCircle && color ? (
        <div className={`h-2 w-2 rounded-full shrink-0`} style={{ backgroundColor: color }}></div>
      ) : icon ? (
        <span className="text-[16px] shrink-0">{icon}</span>
      ) : null}
      
      <span className="truncate flex-1 text-left font-medium" style={{ color: isActive ? 'white' : color }}>
        {name}
      </span>
      <span className={`ml-auto flex h-[18px] min-w-[20px] items-center justify-center rounded px-1 text-[12px] font-bold ${isActive ? 'bg-white/20 text-white' : count > 0 ? 'bg-white text-[#5865F2]' : 'bg-[#2B2D31] text-[#F2F3F5]'}`}>
        {count}
      </span>
    </button>
  );
};
