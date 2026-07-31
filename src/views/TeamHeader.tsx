import React, { useState } from 'react';
import { Check, X, Lock, Pencil, Settings, UserMinus, Trash2, RefreshCw, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Team, Member } from '../models';
import { Tooltip } from './Tooltip';

export const TeamHeader = ({ 
  team, 
  onRename, 
  onDelete, 
  onConfig,
  onClearMembers,
  onOpenStatsModal,
  hideConfig = false,
  readOnly = false
}: { 
  team: Team; 
  onRename: (id: string, name: string) => void; 
  onDelete: (id: string) => void; 
  onConfig: (team: Team) => void;
  onClearMembers: (id: string) => void;
  onOpenStatsModal: (members: Member[], title: string) => void;
  hideConfig?: boolean;
  readOnly?: boolean;
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(team.name);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRename = () => {
    if (team.isLocked || readOnly) return;
    onRename(team.id, tempName);
    setIsEditing(false);
  };

  const executeAction = async (action: () => void) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    action();
    setIsProcessing(false);
    setConfirmAction(null);
  };

  return (
    <div className="relative flex w-full items-center group/team-header min-w-0">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {isEditing && !team.isLocked && !readOnly ? (
          <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              className="w-full rounded bg-[#1E1F22] px-2 py-0.5 text-sm font-semibold text-[#F2F3F5] outline-none ring-1 ring-[#5865F2]"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button onClick={handleRename} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
            <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400"><X size={16} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
            <Tooltip content={team.name} position="top" align="left" onlyShowIfTruncated={true} className="flex-1 min-w-0 truncate text-base font-bold text-[#F2F3F5] cursor-default text-left">
              {team.name}
            </Tooltip>
            {team.isLocked && <Lock size={12} className="text-[#949BA4] shrink-0" />}
          </div>
        )}
      </div>
      
      {!isEditing && (
        <div 
          className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all z-10 bg-[#2B2D31]/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-[-4px_0_12px_rgba(0,0,0,0.3)] ${confirmAction ? 'opacity-100 translate-x-0' : (readOnly ? 'opacity-100' : 'opacity-0 group-hover/team-header:opacity-100 translate-x-1 group-hover:translate-x-0')}`}
          onClick={e => e.stopPropagation()}
        >
          {confirmAction === 'clear' ? (
            <div className="flex items-center gap-1 bg-[#1E1F22] p-0.5 rounded border border-orange-500/30">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                className="px-2 py-1 text-[10px] font-bold text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); executeAction(() => onClearMembers(team.id)); }}
                disabled={isProcessing}
                className="px-2 py-1 text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors flex items-center gap-1"
              >
                {isProcessing ? <RefreshCw size={10} className="animate-spin" /> : t('setup.clearAll')}
              </button>
            </div>
          ) : confirmAction === 'delete' ? (
            <div className="flex items-center gap-1 bg-[#1E1F22] p-0.5 rounded border border-[#ed4245]/30">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                className="px-2 py-1 text-[10px] font-bold text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); executeAction(() => onDelete(team.id)); }}
                disabled={isProcessing}
                className="px-2 py-1 text-[10px] font-bold text-white bg-[#ed4245] hover:bg-[#c03537] rounded transition-colors flex items-center gap-1"
              >
                {isProcessing ? <RefreshCw size={10} className="animate-spin" /> : t('common.delete')}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStatsModal(team.members, `${t('stats.teamStats')}: ${team.name}`);
                }}
                className="p-1.5 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                title={t('stats.areaTeamStats')}
              >
                <BarChart2 size={14} />
              </button>
              {!readOnly && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setTempName(team.name);
                    }}
                    className="p-1.5 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                    title={t('setup.renameTeam')}
                  >
                    <Pencil size={14} />
                  </button>
                  {!hideConfig && (
                    <button
                      onClick={() => onConfig(team)}
                      className="p-1.5 text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
                      title={t('setup.configTeam')}
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction('clear')}
                    className="p-1.5 text-[#949BA4] hover:text-orange-400 hover:bg-orange-500/20 rounded transition-colors"
                    title={t('setup.clearMembers')}
                  >
                    <UserMinus size={14} />
                  </button>
                  {!team.isLocked && (
                    <button
                      onClick={() => setConfirmAction('delete')}
                      className="p-1.5 text-[#949BA4] hover:text-[#ed4245] hover:bg-[#ed4245]/10 rounded transition-colors"
                      title={t('setup.deleteTeam')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
