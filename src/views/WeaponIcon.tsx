import React from 'react';

interface WeaponIconProps {
  icon: string;
  name: string;
  className?: string;
  size?: number;
}

export const WeaponIcon: React.FC<WeaponIconProps> = ({ icon, name, className = '', size = 24 }) => {
  const isSvg = icon.endsWith('.svg') || icon.startsWith('/') || icon.startsWith('data:');

  if (isSvg || icon.startsWith('data:')) {
    return (
      <img 
        src={icon} 
        alt={name} 
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size }}>
      {icon}
    </span>
  );
};
