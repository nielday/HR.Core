import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  className?: string;
  onlyShowIfTruncated?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top', 
  align = 'center', 
  className = '',
  onlyShowIfTruncated = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top - 8; // 8px margin
      } else {
        top = rect.bottom + 8;
      }

      if (align === 'left') {
        left = rect.left;
      } else if (align === 'right') {
        left = rect.right;
      } else {
        left = rect.left + rect.width / 2;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (onlyShowIfTruncated && triggerRef.current) {
      const isTruncated = triggerRef.current.scrollWidth > triggerRef.current.clientWidth;
      if (!isTruncated) return;
    }
    setIsVisible(true);
  };

  const alignClasses = {
    left: 'left-0',
    center: '-translate-x-1/2',
    right: '-translate-x-full'
  };

  const originClasses = {
    left: position === 'top' ? 'origin-bottom-left' : 'origin-top-left',
    center: position === 'top' ? 'origin-bottom' : 'origin-top',
    right: position === 'top' ? 'origin-bottom-right' : 'origin-top-right'
  };

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          style={{ 
            position: 'fixed', 
            top: coords.top, 
            left: coords.left,
            zIndex: 99999,
            pointerEvents: 'none'
          }}
          className={`w-max max-w-[90vw] ${position === 'top' ? '-translate-y-full' : ''} ${alignClasses[align]} ${originClasses[align]} rounded-md bg-[#111214] px-3 py-2 text-xs text-[#DBDEE1] shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in duration-150`}
        >
          {content}
          <div className={`absolute left-1/2 -translate-x-1/2 ${position === 'top' ? 'top-full -mt-1 border-t-[#111214]' : 'bottom-full -mb-1 border-b-[#111214]'} border-4 border-transparent`}></div>
        </div>,
        document.body
      )}
    </div>
  );
};
