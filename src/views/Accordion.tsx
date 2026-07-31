import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface AccordionProps {
  title: React.ReactNode; 
  count: number | string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  tooltipContent?: React.ReactNode;
  tooltipPosition?: 'top' | 'bottom';
  tooltipAlign?: 'left' | 'center' | 'right';
  hasWarning?: boolean;
  hasOfflineWarning?: boolean;
  level?: 1 | 2;
  className?: string;
  actionButton?: React.ReactNode;
  headerActionButton?: React.ReactNode;
  isSelected?: boolean;
  onHeaderClick?: () => void;
  forceOpen?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (memberId: string, sourceId: string, targetId: string) => void;
  onTeamDrop?: (teamId: string, sourceAreaId: string, targetId: string) => void;
  dropId?: string;
  contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ 
  title, 
  count, 
  defaultOpen = false, 
  children,
  tooltipContent,
  tooltipPosition = 'top',
  tooltipAlign = 'center',
  hasWarning = false,
  hasOfflineWarning = false,
  level = 1,
  className = "",
  actionButton,
  headerActionButton,
  isSelected = false,
  onHeaderClick,
  forceOpen,
  draggable,
  onDragStart,
  onDrop,
  onTeamDrop,
  dropId,
  contentClassName = "p-1 pt-0"
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = React.useRef(0);
  const expandTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  const bgClass = level === 1 
    ? (isSelected ? 'bg-[#35373C]' : 'bg-[#1E1F22]') 
    : (isSelected ? 'bg-[#404249]' : 'bg-[#2B2D31]');
  const hoverClass = level === 1 ? 'hover:bg-[#2B2D31]' : 'hover:bg-[#3F4147]';
  const borderClass = level === 1 ? 'border-[#111214]' : 'border-[#1E1F22]';

  const headerContent = (
    <div 
      onClick={(e) => {
        if (onHeaderClick) onHeaderClick();
        if (level === 2 && onHeaderClick) {
          if (isSelected) {
            setIsOpen(!isOpen);
          }
        } else {
          setIsOpen(!isOpen);
        }
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={() => {
        dragCounter.current = 0;
        setIsDragOver(false);
        if (expandTimeoutRef.current) {
          clearTimeout(expandTimeoutRef.current);
          expandTimeoutRef.current = null;
        }
      }}
      className={`group flex w-full items-center justify-between ${bgClass} p-3 text-left transition-colors ${hoverClass} rounded-t-md ${!isOpen ? 'rounded-b-md' : ''} cursor-pointer ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <div 
          className="shrink-0 rounded p-0.5 hover:bg-black/20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? <ChevronDown size={18} className="text-[#949BA4]" /> : <ChevronRight size={18} className="text-[#949BA4]" />}
        </div>
        <div className="flex-1 min-w-0 font-semibold text-[#F2F3F5]">{title}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-2">
        {actionButton}
        {headerActionButton}
        <span className={`flex h-5 min-w-[24px] items-center justify-center rounded px-1.5 text-[12px] font-bold transition-colors ${
          hasOfflineWarning 
            ? 'bg-[#e74c3c] text-white animate-pulse' 
            : hasWarning 
              ? 'bg-[#f39c12] text-white animate-pulse' 
              : count === 0 || count === '0' || count === '0/0'
                ? 'bg-[#2B2D31] text-[#F2F3F5]'
                : 'bg-white text-[#5865F2]'
        }`}>
          {count}
        </span>
      </div>
    </div>
  );

  return (
    <div 
      className={`flex flex-col rounded-md border ${borderClass} ${bgClass} ${className} relative hover:z-10 transition-all ${isOpen && level === 2 && count > 0 ? 'h-full' : ''} ${isDragOver ? 'outline-2 outline-dashed outline-[#5865F2] outline-offset-[-2px]' : ''}`}
      onDragOver={(e) => {
        if (onDrop || onTeamDrop) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDragEnter={(e) => {
        if (onDrop || onTeamDrop) {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current += 1;
          if (dragCounter.current === 1) {
            setIsDragOver(true);
            
            // Auto-expand after 400ms if closed
            if (!isOpen) {
              expandTimeoutRef.current = setTimeout(() => {
                setIsOpen(true);
              }, 400);
            }
          }
        }
      }}
      onDragLeave={(e) => {
        if (onDrop || onTeamDrop) {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current -= 1;
          if (dragCounter.current === 0) {
            setIsDragOver(false);
            if (expandTimeoutRef.current) {
              clearTimeout(expandTimeoutRef.current);
              expandTimeoutRef.current = null;
            }
          }
        }
      }}
      onDrop={(e) => {
        if (onDrop || onTeamDrop) {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current = 0;
          setIsDragOver(false);
          if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current);
            expandTimeoutRef.current = null;
          }
          if ((e as any).handled) return;
          (e as any).handled = true;
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.type === 'team') {
              if (onTeamDrop && dropId && data.sourceAreaId !== dropId) {
                onTeamDrop(data.teamId, data.sourceAreaId, dropId);
              }
            } else if (data.memberId && dropId && data.sourceId !== dropId) {
              onDrop?.(data.memberId, data.sourceId, dropId);
            }
          } catch (err) {
            console.error('Drop error:', err);
          }
        }
      }}
    >
      {tooltipContent ? (
        <Tooltip content={tooltipContent} position={tooltipPosition as 'top' | 'bottom'} align={tooltipAlign as 'left' | 'center' | 'right'}>
          {headerContent}
        </Tooltip>
      ) : (
        headerContent
      )}
      {isOpen && (
        <div className={`flex-1 flex flex-col min-h-0 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};
