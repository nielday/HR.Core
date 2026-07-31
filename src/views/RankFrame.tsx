import React from 'react';
import { Rank } from '../models';

export const RankFrame = ({ rank, children, size = 64, isOffline = false }: { rank: Rank, children: React.ReactNode, size?: number, isOffline?: boolean }) => {
  const { color, borderColor, id } = rank;
  
  // Different shapes based on rank tier
  const isHighTier = id === 'rank4';
  const isMidTier = id === 'rank2' || id === 'rank3';
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Avatar */}
      <div className={`absolute inset-[12%] rounded-full overflow-hidden z-10 bg-[#1E1F22] ${isOffline ? 'grayscale opacity-60' : ''}`}>
        {children}
      </div>
      
      {/* Frame SVG */}
      <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none drop-shadow-md" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={borderColor} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Main Ring */}
        <circle cx="50" cy="50" r="38" stroke={`url(#grad-${id})`} strokeWidth="4" fill="none" filter={isHighTier ? `url(#glow-${id})` : undefined} />
        
        {/* Inner Ring */}
        <circle cx="50" cy="50" r="35" stroke="#111" strokeWidth="2" fill="none" opacity="0.5" />
        
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="41" stroke="#111" strokeWidth="1" fill="none" opacity="0.5" />

        {/* Bottom Accent */}
        <path d="M 35 85 Q 50 100 65 85 Q 50 90 35 85 Z" fill={`url(#grad-${id})`} />
        
        {/* Mid Tier Wings */}
        {(isMidTier || isHighTier) && (
          <>
            <path d="M 12 50 Q -5 30 15 15 Q 25 35 28 45 Q 15 45 12 50 Z" fill={`url(#grad-${id})`} opacity="0.8" />
            <path d="M 88 50 Q 105 30 85 15 Q 75 35 72 45 Q 85 45 88 50 Z" fill={`url(#grad-${id})`} opacity="0.8" />
          </>
        )}
        
        {/* High Tier Extra Spikes */}
        {isHighTier && (
          <>
            <path d="M 20 80 Q 5 60 10 40 Q 25 65 30 75 Q 20 75 20 80 Z" fill={color} />
            <path d="M 80 80 Q 95 60 90 40 Q 75 65 70 75 Q 80 75 80 80 Z" fill={color} />
            <path d="M 45 10 L 50 0 L 55 10 Z" fill={color} />
          </>
        )}
        
        {/* Low Tier Simple Wings */}
        {(!isMidTier && !isHighTier) && (
          <>
            <path d="M 15 50 Q 5 40 15 25 Q 20 40 25 45 Q 15 45 15 50 Z" fill={`url(#grad-${id})`} opacity="0.8" />
            <path d="M 85 50 Q 95 40 85 25 Q 80 40 75 45 Q 85 45 85 50 Z" fill={`url(#grad-${id})`} opacity="0.8" />
          </>
        )}
      </svg>
    </div>
  );
};
