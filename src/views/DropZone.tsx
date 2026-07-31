import React, { useState, useRef } from 'react';

interface DropZoneProps {
  id: string; 
  onDrop: (memberId: string, sourceId: string, targetId: string) => void; 
  onTeamDrop?: (teamId: string, sourceAreaId: string, targetId: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  id, 
  onDrop, 
  onTeamDrop,
  children, 
  className = "",
  disabled = false
}) => {
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current = 0;
    setIsOver(false);
    if ((e as any).handled) return;
    (e as any).handled = true;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'team') {
        if (onTeamDrop && data.sourceAreaId !== id) {
          onTeamDrop(data.teamId, data.sourceAreaId, id);
        }
      } else if (data.memberId && data.sourceId !== id) {
        onDrop(data.memberId, data.sourceId, id);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all duration-200 ${isOver ? 'border-2 border-dashed border-[#5865F2] rounded-md bg-[#5865F2]/5' : 'border-2 border-dashed border-transparent'} ${className}`}
    >
      {children}
    </div>
  );
};
