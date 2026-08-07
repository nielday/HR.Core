import React from 'react';
import { Flag, Check, Settings, Trash2, UserMinus, Plus, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Member } from '../models';
import { RankFrame } from './RankFrame';
import { WeaponIcon } from './WeaponIcon';

interface MemberCardProps {
  member: Member;
  sourceId: string;
  isSelected?: boolean;
  onSelect?: (m: Member) => void;
  onInfoClick: (m: Member) => void;
  onRemove?: (m: Member) => void;
  onAdd?: (m: Member) => void;
  onDrop?: (memberId: string, sourceId: string, targetId: string, targetIndex?: number) => void;
  onTeamDrop?: (teamId: string, sourceAreaId: string, targetId: string) => void;
  isLeader?: boolean;
  index?: number;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  assignedTeamInfo?: { teamName: string; areaName: string };
  /** Điểm danh voice. Không truyền thì thẻ giữ nguyên màu theo vai trò như cũ. */
  voiceTrangThai?: 'dung' | 'lac' | 'vang' | 'khongro';
  voiceTenKenh?: string;
  memberSource?: 'discord' | 'custom';
  onDeleteCustomMember?: (id: string) => void;
  readOnly?: boolean;
  disableMenu?: boolean;
}

import { CATEGORY_LABELS, ROLE_OPTIONS, POSITION_OPTIONS, ROLES } from '../constants';

export const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  sourceId,
  isSelected = false,
  onSelect,
  onInfoClick,
  onRemove,
  onAdd,
  onDrop,
  onTeamDrop,
  isLeader = false,
  index,
  isDimmed = false,
  isHighlighted = false,
  assignedTeamInfo,
  memberSource,
  voiceTrangThai,
  voiceTenKenh,
  onDeleteCustomMember,
  readOnly = false,
  disableMenu = false
}) => {
  const { t } = useTranslation();
  const [confirmAction, setConfirmAction] = React.useState<'remove' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.stopPropagation();
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else if (onSelect) {
      onSelect(member);
    }
  };

  const executeAction = async (action: () => void | Promise<void>) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await action();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
      setIsMobileMenuOpen(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify({ memberId: member.id, sourceId, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // No local drag state to reset here, but good for consistency
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    (e as any).handled = true;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'team') {
        if (onTeamDrop && data.sourceAreaId !== sourceId) {
          onTeamDrop(data.teamId, data.sourceAreaId, sourceId);
        }
      } else {
        if (onDrop) {
          onDrop(data.memberId, data.sourceId, sourceId, index);
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  const isOffline = member.status === 'offline';
  const isBackup = member.participationStatus === 'backup';
  
  const displayRole = ROLE_OPTIONS.find(r => r.id === member.role) || Object.values(ROLES).find(r => r.id === member.role) || ROLES[member.role.toUpperCase()];
  const displayPosition = POSITION_OPTIONS.find(p => {
    const posValue = member.position?.toLowerCase();
    if (p.id === 'pos_cong') return posValue === 'công' || posValue === 'pos_cong';
    if (p.id === 'pos_thu') return posValue === 'thủ' || posValue === 'pos_thu';
    if (p.id === 'pos_flex') return posValue === 'flex' || posValue === 'pos_flex';
    return false;
  });
  
  const hasRole = !!displayRole;
  const roleColor = displayRole?.color || CATEGORY_LABELS[member.primaryWeapon1.category]?.color || '#4F545C';
  const bgColor = isSelected ? `${roleColor}CC` : (hasRole ? `${roleColor}99` : `${roleColor}33`); // 80%, 60%, or 20% opacity
  const borderColor = isSelected 
    ? roleColor 
    : (isBackup ? `${roleColor}FF` : (hasRole ? `${roleColor}CC` : `${roleColor}80`)); // 100%, 80%, or 50% opacity
  const borderWidth = isBackup ? '2px' : (isSelected ? '2px' : '1.5px');
  const borderStyle = isBackup ? 'dashed' : 'solid';

  // ĐIỂM DANH VOICE ĐÈ LÊN MÀU VAI TRÒ.
  // Đến giờ đánh thì câu hỏi duy nhất là "ai chưa vào đúng chỗ", không phải "ai là heal".
  // Vai trò vẫn đọc được qua icon và khung rank, nên đổi nền là đánh đổi đúng.
  // 'dung' KHÔNG đổi gì: thẻ đúng chỗ phải trông y như thường, có vậy màu lạ mới đập vào mắt.
  // 'khongro' cũng không đổi: không tra được thì im lặng, tô đỏ là vu oan cho người đang
  // ngồi sẵn trong voice mà chỉ vì thiếu Discord ID.
  const mauDiemDanh = voiceTrangThai === 'vang' ? { nen: 'rgba(237,66,69,0.35)', vien: '#ED4245' }
    : voiceTrangThai === 'lac' ? { nen: 'rgba(250,166,26,0.35)', vien: '#FAA61A' }
    : null;

  const bgStyle = isOffline
    ? { backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4) 4px, ${bgColor} 4px, ${bgColor} 8px)`, borderColor, borderWidth, borderStyle }
    : mauDiemDanh
      ? { backgroundColor: mauDiemDanh.nen, borderColor: mauDiemDanh.vien, borderWidth: '2px', borderStyle: 'solid' }
      : { backgroundColor: bgColor, borderColor, borderWidth, borderStyle };

  const dimClass = isDimmed ? 'opacity-20 grayscale blur-[1px]' : '';
  const highlightClass = isHighlighted ? 'ring-2 ring-[#5865F2] ring-offset-1 ring-offset-[#313338] shadow-[0_0_25px_rgba(88,101,242,0.5)] scale-[1.01] z-10' : '';
  const actionCount = 1 + (onRemove ? 1 : 0) + (onAdd ? 1 : 0) + (memberSource === 'custom' && onDeleteCustomMember ? 1 : 0);
  const hoverPaddingClass = actionCount > 0 ? 'hover:pr-[140px]' : 'hover:pr-10';
  
  const displayName = member.ingameName?.trim() || member.name;
  const displayTitle = member.ingameName?.trim() ? `${member.ingameName} (${member.name})` : member.name;

  return (
    <motion.div 
      draggable={!readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCardClick}
      whileHover={readOnly ? {} : { backgroundColor: 'rgba(255,255,255,0.05)' }}
      className={`group relative flex items-center gap-2 rounded-lg border p-[1px] transition-all ${dimClass} ${highlightClass} h-[58px] cursor-grab`}
      style={bgStyle}
    >
      {/* Avatar Section */}
      <div className="relative shrink-0 ml-[1px]">
        <RankFrame rank={member.rank} size={56} isOffline={isOffline}>
          <img
            src={member.avatar}
            alt={displayName}
            className="h-full w-full object-cover pointer-events-none"
            // URL avatar Discord chứa mã băm CỦA CHÍNH TẤM ẢNH, nên người ta đổi ảnh là URL
            // cũ chết hẳn (404) và thẻ hiện ra ô đen kèm chữ alt. Máy chủ có làm tươi lại,
            // nhưng trong lúc chưa kịp thì rơi về ảnh mặc định của Discord cho đỡ vỡ mặt.
            // Gỡ onerror ngay sau khi đổi để ảnh mặc định lỡ hỏng nốt thì không lặp vô tận.
            onError={(e) => {
              const el = e.currentTarget;
              el.onerror = null;
              el.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
            }}
          />
        </RankFrame>
        
        <div 
          className={`absolute bottom-0 -right-0.5 m-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2B2D31] shadow-sm z-30 text-[11px] ${isOffline ? 'grayscale opacity-80' : ''}`}
          style={{ backgroundColor: '#FFFFFF' }}
          title={displayRole ? t(displayRole.name) : t('setup.noRole')}
        >
          {displayRole?.icon || '👤'}
        </div>

        {isLeader && (
          <div className="absolute -left-0.5 top-0 m-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#f1c40f] text-[#111214] shadow-lg border border-[#111214]/20 z-30" title="Leader">
            <Flag size={10} strokeWidth={3} />
          </div>
        )}
        {member.isConfirmed && (
          <div className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#2ecc71] text-white shadow-lg border border-[#111214]/20 z-30" title={t('setup.confirmed')}>
            <Check size={10} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 gap-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <span 
              className={`block truncate font-sans font-bold text-[12px] leading-none transition-colors ${isOffline ? 'text-[#949BA4]' : 'text-[#F2F3F5]'}`} 
              title={displayTitle}
              style={{ 
                textShadow: isOffline ? 'none' : '0 1px 1px rgba(0,0,0,0.4)'
              }}
            >
              {displayName}
            </span>
          </div>
          {displayPosition && (
            <span 
              className="shrink-0 text-[12px] leading-none"
              style={{ color: displayPosition.color }}
              title={t(displayPosition.name)}
            >
              {displayPosition.icon}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className={`flex shrink-0 items-center gap-1.5 transition-all ${isOffline ? 'grayscale opacity-60' : ''}`}>
            {member.primaryWeapon1.id !== 'w0' && (
              <div className="flex h-6 w-6 items-center justify-center transition-transform group-hover:scale-110 shrink-0" title={`${t(member.primaryWeapon1.name)}`}>
                <WeaponIcon icon={member.primaryWeapon1.icon} name={t(member.primaryWeapon1.name)} size={24} />
              </div>
            )}
            {member.primaryWeapon2.id !== 'w0' && (
              <div className="flex h-6 w-6 items-center justify-center transition-transform group-hover:scale-110 shrink-0" title={`${t(member.primaryWeapon2.name)}`}>
                <WeaponIcon icon={member.primaryWeapon2.icon} name={t(member.primaryWeapon2.name)} size={24} />
              </div>
            )}
            
            {/* Match Stats Summary */}
            <div className={`flex items-center gap-2 ${(member.primaryWeapon1.id !== 'w0' || member.primaryWeapon2.id !== 'w0') ? 'ml-1 border-l border-[#3F4147] pl-2' : ''}`}>
              <div className="flex flex-col items-center gap-1 leading-none">
                <span className="text-[9px] font-bold text-[#949BA4] uppercase text-center">{t('setup.match')}</span>
                <span className="text-[11px] font-bold text-[#F2F3F5] text-center mt-0.5">
                  {(member.matchStats?.League?.Win || 0) + (member.matchStats?.League?.Lose || 0) +
                   (member.matchStats?.Rated?.Win || 0) + (member.matchStats?.Rated?.Lose || 0) +
                   (member.matchStats?.Scrim?.Win || 0) + (member.matchStats?.Scrim?.Lose || 0)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 leading-none">
                <span className="text-[9px] font-bold text-[#949BA4] uppercase text-center">Win%</span>
                <span className="text-[11px] font-bold text-[#2ecc71] text-center mt-0.5">
                  {(() => {
                    const totalWins = (member.matchStats?.League?.Win || 0) + (member.matchStats?.Rated?.Win || 0) + (member.matchStats?.Scrim?.Win || 0);
                    const totalLosses = (member.matchStats?.League?.Lose || 0) + (member.matchStats?.Rated?.Lose || 0) + (member.matchStats?.Scrim?.Lose || 0);
                    const totalMatches = totalWins + totalLosses;
                    return totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
                  })()}%
                </span>
              </div>
            </div>
          </div>

          {/* Nhãn kênh voice. Lấy người từ nhiều kênh cùng lúc thì nhìn danh sách gộp phải
              phân biệt được ai bên công ai bên thủ, không thì gộp xong lại rối hơn.
              Chỉ hiện ở danh sách chờ và khi người này chưa được xếp vào đội nào, để không
              chen với nhãn đội vốn quan trọng hơn. */}
          {/* Nhãn điểm danh. Màu nền đã hét lên rồi, nhãn này trả lời câu tiếp theo: lạc thì
              lạc sang ĐÂU. Biết họ đang ở "Hoàng đế" thì gọi một câu là xong, còn chỉ biết
              "sai chỗ" thì phải đi dò từng kênh. */}
          {voiceTrangThai === 'vang' && (
            <div className="flex shrink-0 items-center rounded bg-[#ED4245]/25 px-1.5 py-1 text-[10px] font-bold text-[#ff9b9d] border border-[#ED4245]/40 mr-1"
                 title="Không ở kênh voice nào">
              vắng
            </div>
          )}
          {voiceTrangThai === 'lac' && (
            <div className="flex min-w-0 shrink items-center gap-1 rounded bg-[#FAA61A]/25 px-1.5 py-1 text-[10px] font-bold text-[#ffcf7a] border border-[#FAA61A]/40 mr-1"
                 title={`Đang ở kênh voice khác: ${voiceTenKenh || '?'}`}>
              <span className="shrink-0">🔊</span>
              <span className="block truncate">{voiceTenKenh || 'kênh khác'}</span>
            </div>
          )}

          {/* Người ngồi trong voice nhưng không có trong danh sách bang. Phải nhìn ra ngay,
              không thì xếp nhầm khách vào đội mà không ai biết. */}
          {member.laKhach && (
            <div
              className="flex shrink-0 items-center rounded bg-amber-500/20 px-1.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30 mr-1"
              title="Đang trong voice nhưng chưa có trong danh sách thành viên"
            >
              khách
            </div>
          )}

          {member.voiceChannelName && sourceId === 'unassigned' && !assignedTeamInfo && !member.laKhach && (
            <div
              className="flex min-w-0 items-center gap-1 rounded bg-[#5865F2]/20 px-1.5 py-1 text-[10px] font-bold text-[#a5b0ff] border border-[#5865F2]/30 mr-1"
              title={`Đang trong kênh voice: ${member.voiceChannelName}`}
            >
              <span className="shrink-0">🔊</span>
              <span className="block truncate">{member.voiceChannelName}</span>
            </div>
          )}

          {assignedTeamInfo && sourceId === 'unassigned' && (
            <div className="flex min-w-0 items-center gap-1 rounded bg-[#2ecc71]/20 px-1.5 py-1 text-[10px] font-bold text-[#2ecc71] border border-[#2ecc71]/30 mr-1" title={`${t('setup.assignedTo')}: ${assignedTeamInfo.teamName}`}>
              <UserCheck size={12} className="shrink-0" />
              <span className="block truncate">{assignedTeamInfo.teamName}</span>
            </div>
          )}
        </div>
      </div>
      
      {!readOnly && !disableMenu && (
        <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex h-auto flex-row-reverse items-center justify-center gap-1 transition-all z-40 bg-[#2B2D31]/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-[-4px_0_12px_rgba(0,0,0,0.3)] ${confirmAction || isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0'}`}>
          {confirmAction ? (
            <div className={`flex items-center gap-1 bg-[#1E1F22] p-0.5 rounded border ${confirmAction === 'delete' ? 'border-red-600/30' : 'border-red-500/30'}`}>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                className="px-2 py-1 text-[10px] font-bold text-[#949BA4] hover:text-white hover:bg-[#4E5058] rounded transition-colors"
              >
                {t('setup.cancel')}
              </button>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirmAction === 'delete' && onDeleteCustomMember) {
                    executeAction(() => onDeleteCustomMember(member.id));
                  } else if (confirmAction === 'remove' && onRemove) {
                    executeAction(() => onRemove(member));
                  }
                }}
                disabled={isProcessing}
                className={`px-2 py-1 text-[10px] font-bold text-white rounded transition-colors flex items-center gap-1 ${confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isProcessing ? <RefreshCw size={10} className="animate-spin" /> : t('setup.delete')}
              </button>
            </div>
          ) : (
            <>
              {memberSource === 'custom' && onDeleteCustomMember && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setConfirmAction('delete'); 
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all hover:scale-110"
                  title={t('setup.removeFromGuildList')}
                >
                  <Trash2 size={14} />
                </button>
              )}

              {onRemove && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setConfirmAction('remove'); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all hover:scale-110"
                  title={t('setup.removeFromGroup')}
                >
                  <UserMinus size={14} />
                </button>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); onInfoClick(member); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-all hover:scale-110"
                title={t('setup.viewInfo')}
              >
                <Settings size={14} />
              </button>
              
              {onAdd && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAdd(member); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/40 hover:text-green-300 transition-all hover:scale-110"
                  title={t('setup.addToSelectedGroup')}
                >
                  <Plus size={14} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};
