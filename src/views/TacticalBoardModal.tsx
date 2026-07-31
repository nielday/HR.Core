import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useTranslation } from 'react-i18next';
import { X, Pen, Eraser, Highlighter, Save, RotateCcw, Trash2, Edit2, Play, Circle, Download, ZoomIn, ZoomOut, Maximize, Minimize, Plus, Users, Hand, Move, Minimize2, Maximize2, ArrowUpRight, Square, Circle as CircleIcon, MousePointer, ChevronDown, ChevronRight, MessageSquare, MessageCircle, Type, Undo, Redo, Copy, SlidersHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';
// @ts-ignore
import tacticalMapBg from '../assets/images/map_blank.jpg';
// @ts-ignore
import bossImg from '../assets/images/Boss.png';
// @ts-ignore
import gooseeBlueImg from '../assets/images/Goosee-Blue.png';
// @ts-ignore
import gooseeRedImg from '../assets/images/Goosee-Red.png';
// @ts-ignore
import homeImg from '../assets/images/Home.png';
// @ts-ignore
import towerBlueImg from '../assets/images/Tower-Blue.png';
// @ts-ignore
import towerRedImg from '../assets/images/Tower-Red.png';
// @ts-ignore
import treeBlueImg from '../assets/images/Tree-Blue.png';
// @ts-ignore
import treeRedImg from '../assets/images/Tree-Red.png';
import { Area, Member } from '../models';

interface StickerData {
  type: string;
  label?: string;
  color?: string;
  name: string;
  icon?: string;
  teamId?: string;
}

interface TacticState {
  id: string;
  name: string;
  data: string;
  timestamp: number;
}

interface TacticalBoardModalProps {
  groupID: string;
  setupID: string;
  setupName: string;
  onClose: () => void;
  areas: Area[];
}

function getTailPoints(side: 'bottom' | 'top' | 'left' | 'right', offset: number, width: number, height: number, w: number, h: number) {
  if (side === 'top') {
    return [
      { x: offset - width / 2, y: 1 },
      { x: offset, y: -height },
      { x: offset + width / 2, y: 1 }
    ];
  } else if (side === 'left') {
    return [
      { x: 1, y: offset - width / 2 },
      { x: -height, y: offset },
      { x: 1, y: offset + width / 2 }
    ];
  } else if (side === 'right') {
    return [
      { x: w - 1, y: offset - width / 2 },
      { x: w + height, y: offset },
      { x: w - 1, y: offset + width / 2 }
    ];
  } else { // 'bottom'
    return [
      { x: offset - width / 2, y: h - 1 },
      { x: offset, y: h + height },
      { x: offset + width / 2, y: h - 1 }
    ];
  }
}

const getStickerSvg = (type: string, label: string, color: string) => {
  const isCong = type.includes('cong') || type.includes('công') || label.toLowerCase().includes('công');
  const isTanker = type.includes('tanker');
  const isMelee = type.includes('melee') || type.includes('meele');
  const isRanger = type.includes('ranger');
  const isHealer = type.includes('healer');

  const gradId = `grad-${type.replace(/[^a-zA-Z0-9]/g, '_')}-${label.replace(/[^a-zA-Z0-9]/g, '_')}-${color.replace('#', '')}`;

  if (isTanker) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <path d="M50 8 L82 18 C82 50, 72 78, 50 92 C28 78, 18 50, 18 18 Z" fill="url(#${gradId})" stroke="${color}" stroke-width="4" stroke-linejoin="round" />
      <path d="M50 14 L76 22 C76 48, 67 72, 50 84 C33 72, 24 48, 24 22 Z" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.3" />
      <path d="M50 25 L65 33 V50 C65 62, 58 72, 50 77 C42 72, 35 62, 35 50 V33 Z" fill="${color}" opacity="0.8" stroke="#ffffff" stroke-width="1.5" />
      <path d="M50 30 V70 M38 48 H62" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
  }

  if (isMelee) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#${gradId})" stroke="${color}" stroke-width="4" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.3" />
      <g transform="rotate(45 50 50)">
        <path d="M47 15 L50 8 L53 15 L52 68 L48 68 Z" fill="#f1f5f9" stroke="#0f172a" stroke-width="1" />
        <line x1="50" y1="12" x2="50" y2="66" stroke="#94a3b8" stroke-width="1" />
        <rect x="36" y="68" width="28" height="5" fill="${color}" rx="1.5" stroke="#ffffff" stroke-width="0.8" />
        <rect x="47" y="73" width="6" height="14" fill="#334155" rx="1" />
        <circle cx="50" cy="89" r="4" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
      </g>
      <g transform="rotate(-45 50 50)">
        <path d="M47 15 L50 8 L53 15 L52 68 L48 68 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1" />
        <line x1="50" y1="12" x2="50" y2="66" stroke="#cbd5e1" stroke-width="1" />
        <rect x="36" y="68" width="28" height="5" fill="${color}" rx="1.5" stroke="#ffffff" stroke-width="0.8" />
        <rect x="47" y="73" width="6" height="14" fill="#334155" rx="1" />
        <circle cx="50" cy="89" r="4" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
      </g>
      ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
  }

  if (isRanger) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#${gradId})" stroke="${color}" stroke-width="4" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="${color}" stroke-width="2" opacity="0.6" stroke-dasharray="4 3" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="#ffffff" stroke-width="2" />
      <circle cx="50" cy="50" r="6" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      <path d="M50 10 V30 M50 70 V90 M10 50 H30 M70 50 H90" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
      <path d="M50 18 L44 32 H56 Z" fill="${color}" stroke="#ffffff" stroke-width="1" />
      ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
  }

  if (isHealer) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#${gradId})" stroke="${color}" stroke-width="4" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="1.5" opacity="0.4" />
      <path d="M42 22 H58 V42 H78 V58 H58 V78 H42 V58 H22 V42 H42 Z" fill="#22c55e" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
      <path d="M45 25 H55 V45 H75 V55 H55 V75 H45 V55 H25 V45 H45 Z" fill="#ffffff" opacity="0.3" />
      <circle cx="28" cy="28" r="2" fill="#ffffff" />
      <circle cx="72" cy="28" r="2.5" fill="#ffffff" />
      <circle cx="74" cy="72" r="2" fill="#ffffff" />
      <circle cx="26" cy="74" r="2.5" fill="#ffffff" />
      ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
  }

  if (isCong) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#${gradId})" stroke="${color}" stroke-width="5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.3" />
      
      <!-- Sword 1 -->
      <g transform="rotate(42 50 50)">
        <path d="M47 22 L50 12 L53 22 L52 66 L48 66 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1" />
        <line x1="50" y1="16" x2="50" y2="64" stroke="#94a3b8" stroke-width="1" />
        <rect x="36" y="66" width="28" height="5" fill="${color}" rx="1.5" stroke="#ffffff" stroke-width="0.8" />
        <rect x="47" y="71" width="6" height="13" fill="#334155" rx="1" />
        <circle cx="50" cy="87" r="4" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
      </g>
      
      <!-- Sword 2 -->
      <g transform="rotate(-42 50 50)">
        <path d="M47 22 L50 12 L53 22 L52 66 L48 66 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1" />
        <line x1="50" y1="16" x2="50" y2="64" stroke="#cbd5e1" stroke-width="1" />
        <rect x="36" y="66" width="28" height="5" fill="${color}" rx="1.5" stroke="#ffffff" stroke-width="0.8" />
        <rect x="47" y="71" width="6" height="13" fill="#334155" rx="1" />
        <circle cx="50" cy="87" r="4" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
      </g>
      
      ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${label}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <path d="M50 12 C68 12, 80 16, 80 16 L80 50 C80 70, 50 88, 50 88 C50 88, 20 70, 20 50 L20 16 C20 16, 32 12, 50 12 Z" fill="url(#${gradId})" stroke="${color}" stroke-width="5" stroke-linejoin="round" />
    <path d="M50 16 C65 16, 75 19, 75 19 L75 48 C75 65, 50 81, 50 81 C50 81, 25 65, 25 48 L25 19 C25 19, 35 16, 50 16 Z" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.3" />
    ${label ? `<text x="50" y="52" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text>` : `<path d="M50 32 L50 62 M35 47 L65 47" stroke="${color}" stroke-width="5" stroke-linecap="round" />`}
    <circle cx="50" cy="74" r="2" fill="#ffffff" opacity="0.8" />
    <circle cx="42" cy="72" r="1.5" fill="#ffffff" opacity="0.5" />
    <circle cx="58" cy="72" r="1.5" fill="#ffffff" opacity="0.5" />
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
};

const StickerIcon = ({ sticker, size = 42 }: { sticker: StickerData; size?: number }) => {
  if (sticker.icon) {
    return (
      <div className="flex items-center justify-center relative p-1" style={{ width: size, height: size }}>
        <img
          src={sticker.icon}
          alt={sticker.name}
          className="w-full h-full object-contain filter drop-shadow"
        />
      </div>
    );
  }

  const isCong = sticker.type.includes('cong') || sticker.type.includes('công') || sticker.name.toLowerCase().includes('công');
  const isTanker = sticker.type.includes('tanker');
  const isMelee = sticker.type.includes('melee') || sticker.type.includes('meele');
  const isRanger = sticker.type.includes('ranger');
  const isHealer = sticker.type.includes('healer');

  const color = sticker.color || '#3b82f6';
  const label = sticker.label || '';

  if (isTanker) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`tankerGrad-icon-${sticker.type}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <path d="M50 8 L82 18 C82 50, 72 78, 50 92 C28 78, 18 50, 18 18 Z" fill={`url(#tankerGrad-icon-${sticker.type}-${color.replace('#', '')})`} stroke={color} strokeWidth="4" strokeLinejoin="round" />
          <path d="M50 14 L76 22 C76 48, 67 72, 50 84 C33 72, 24 48, 24 22 Z" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
          <path d="M50 25 L65 33 V50 C65 62, 58 72, 50 77 C42 72, 35 62, 35 50 V33 Z" fill={color} opacity="0.8" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M50 30 V70 M38 48 H62" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          {label && (
            <text x="50" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" stroke="#000000" strokeWidth="2.5" paintOrder="stroke fill">{label}</text>
          )}
        </svg>
      </div>
    );
  }

  if (isMelee) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`meleeGrad-icon-${sticker.type}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill={`url(#meleeGrad-icon-${sticker.type}-${color.replace('#', '')})`} stroke={color} strokeWidth="4" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
          <g transform="rotate(45 50 50)">
            <path d="M47 15 L50 8 L53 15 L52 68 L48 68 Z" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />
            <line x1="50" y1="12" x2="50" y2="66" stroke="#94a3b8" strokeWidth="1" />
            <rect x="36" y="68" width="28" height="5" fill={color} rx="1.5" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="47" y="73" width="6" height="14" fill="#334155" rx="1" />
            <circle cx="50" cy="89" r="4" fill={color} stroke="#ffffff" strokeWidth="0.8" />
          </g>
          <g transform="rotate(-45 50 50)">
            <path d="M47 15 L50 8 L53 15 L52 68 L48 68 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
            <line x1="50" y1="12" x2="50" y2="66" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="36" y="68" width="28" height="5" fill={color} rx="1.5" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="47" y="73" width="6" height="14" fill="#334155" rx="1" />
            <circle cx="50" cy="89" r="4" fill={color} stroke="#ffffff" strokeWidth="0.8" />
          </g>
          {label && (
            <text x="50" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" stroke="#000000" strokeWidth="2.5" paintOrder="stroke fill">{label}</text>
          )}
        </svg>
      </div>
    );
  }

  if (isRanger) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`rangerGrad-icon-${sticker.type}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill={`url(#rangerGrad-icon-${sticker.type}-${color.replace('#', '')})`} stroke={color} strokeWidth="4" />
          <circle cx="50" cy="50" r="32" fill="none" stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="4 3" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill={color} stroke="#ffffff" strokeWidth="1.5" />
          <path d="M50 10 V30 M50 70 V90 M10 50 H30 M70 50 H90" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M50 18 L44 32 H56 Z" fill={color} stroke="#ffffff" strokeWidth="1" />
          {label && (
            <text x="50" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" stroke="#000000" strokeWidth="2.5" paintOrder="stroke fill">{label}</text>
          )}
        </svg>
      </div>
    );
  }

  if (isHealer) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`healerGrad-icon-${sticker.type}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill={`url(#healerGrad-icon-${sticker.type}-${color.replace('#', '')})`} stroke={color} strokeWidth="4" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.4" />
          <path d="M42 22 H58 V42 H78 V58 H58 V78 H42 V58 H22 V42 H42 Z" fill="#22c55e" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M45 25 H55 V45 H75 V55 H55 V75 H45 V55 H25 V45 H45 Z" fill="#ffffff" opacity="0.3" />
          <circle cx="28" cy="28" r="2" fill="#ffffff" />
          <circle cx="72" cy="28" r="2.5" fill="#ffffff" />
          <circle cx="74" cy="72" r="2" fill="#ffffff" />
          <circle cx="26" cy="74" r="2.5" fill="#ffffff" />
          {label && (
            <text x="50" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" stroke="#000000" strokeWidth="2.5" paintOrder="stroke fill">{label}</text>
          )}
        </svg>
      </div>
    );
  }

  // Shield for Thủ / Team
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id={`shieldGrad-icon-${sticker.type}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <path d="M50 12 C68 12, 80 16, 80 16 L80 50 C80 70, 50 88, 50 88 C50 88, 20 70, 20 50 L20 16 C20 16, 32 12, 50 12 Z" fill={`url(#shieldGrad-icon-${sticker.type}-${color.replace('#', '')})`} stroke={color} strokeWidth="5" strokeLinejoin="round" />
        <path d="M50 16 C65 16, 75 19, 75 19 L75 48 C75 65, 50 81, 50 81 C50 81, 25 65, 25 48 L25 19 C25 19, 35 16, 50 16 Z" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
        {label ? (
          <text x="50" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#ffffff" textAnchor="middle" dominantBaseline="middle">{label}</text>
        ) : (
          <path d="M50 32 L50 62 M35 47 L65 47" stroke={color} strokeWidth="5" strokeLinecap="round" />
        )}
        <circle cx="50" cy="74" r="2" fill="#ffffff" opacity="0.8" />
        <circle cx="42" cy="72" r="1.5" fill="#ffffff" opacity="0.5" />
        <circle cx="58" cy="72" r="1.5" fill="#ffffff" opacity="0.5" />
      </svg>
    </div>
  );
};

export default function TacticalBoardModal({ groupID, setupID, setupName, onClose, areas }: TacticalBoardModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tactics, setTactics] = useState<Record<string, TacticState>>({});
  const [activeTacticId, setActiveTacticId] = useState<string | null>(null);
  const [selectedBubble, setSelectedBubble] = useState<any | null>(null);
  const [selectedTextObj, setSelectedTextObj] = useState<any | null>(null);
  const [textUpdateCount, setTextUpdateCount] = useState(0);
  const [tool, setTool] = useState<'select' | 'pen' | 'eraser' | 'highlighter' | 'arrow' | 'rect' | 'oval' | 'speech_bubble_oval' | 'speech_bubble_rect' | 'textbox'>('select');
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState<boolean>(true);
  const [drawingColor, setDrawingColor] = useState<string>('#ff0000');
  const [drawingWidth, setDrawingWidth] = useState<number>(3);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [rightPanelExpanded, setRightPanelExpanded] = useState<Record<string, boolean>>({ drawing: true, stickers: true, status: true });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [stickerTab, setStickerTab] = useState<'all' | 'roles' | 'default' | 'teams'>('all');
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<fabric.Object | null>(null);
  const lastClonedRef = useRef<{ obj: fabric.Object; origLeft: number; origTop: number } | null>(null);
  const bgImageRef = useRef<fabric.Image | null>(null);
  const mapDimensionsRef = useRef<{ width: number; height: number }>({ width: 1920, height: 1080 });
  const zoomRef = useRef<number>(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const el = modalRef.current || document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  const [editingTextObject, setEditingTextObject] = useState<{
    fabricObject: any;
    textElement: any;
    x: number;
    y: number;
    width: number;
    height: number;
    value: string;
  } | null>(null);
  const hTrackRef = useRef<HTMLDivElement>(null);
  const vTrackRef = useRef<HTMLDivElement>(null);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryUpdate = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveStateToHistory = () => {
    if (!fabricCanvasRef.current || isHistoryUpdate.current) return;
    const json = fabricCanvasRef.current.toJSON(['stickerType', 'isSpeechBubble', 'bubbleType', 'bubbleWidth', 'bubbleHeight', 'tailOffset', 'tailWidth', 'tailHeight', 'tailSide', 'textObject', 'drawingColor']);
    const state = JSON.stringify(json);
    
    // Don't save if it's identical to current state
    if (historyIndexRef.current >= 0 && historyRef.current[historyIndexRef.current] === state) {
      return;
    }

    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(state);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const handleUndo = async () => {
    if (historyIndexRef.current > 0) {
      isHistoryUpdate.current = true;
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      await fabricCanvasRef.current?.loadFromJSON(state);
      fabricCanvasRef.current?.requestRenderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      isHistoryUpdate.current = false;
    }
  };

  const handleRedo = async () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isHistoryUpdate.current = true;
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      await fabricCanvasRef.current?.loadFromJSON(state);
      fabricCanvasRef.current?.requestRenderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      isHistoryUpdate.current = false;
    }
  };
  
  const toggleTool = (t: 'pen' | 'eraser' | 'highlighter' | 'arrow' | 'rect' | 'oval' | 'speech_bubble_oval' | 'speech_bubble_rect' | 'textbox') => {
    setTool(prev => prev === t ? 'select' : t);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeElement = document.activeElement;
        const isInputEditing = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable);
        if (isInputEditing) return;

        const canvas = fabricCanvasRef.current;
        if (canvas) {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length > 0) {
            isHistoryUpdate.current = true;
            activeObjects.forEach(obj => canvas.remove(obj));
            isHistoryUpdate.current = false;
            saveStateToHistory();
            canvas.discardActiveObject();
            canvas.renderAll();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchTactics();
  }, [groupID, setupID]);

  const fetchTactics = async () => {
    try {
      const res = await fetch(`/api/tactics/${groupID}/${setupID}`);
      if (res.ok) {
        const data = await res.json();
        setTactics(data);
      }
    } catch (error) {
      console.error('Failed to fetch tactics:', error);
    }
  };

  const saveTacticsToServer = async (newTactics: Record<string, TacticState>) => {
    try {
      await fetch(`/api/tactics/${groupID}/${setupID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTactics)
      });
      setTactics(newTactics);
    } catch (error) {
      console.error('Failed to save tactics:', error);
    }
  };

  const recreateSpeechBubble = (
    bubble: any,
    updates: {
      tailOffset?: number;
      tailWidth?: number;
      tailHeight?: number;
      tailSide?: 'bottom' | 'top' | 'left' | 'right';
    }
  ) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Get old properties
    const bubbleType = bubble.bubbleType || 'rect';
    const w = bubble.bubbleWidth || 160;
    const h = bubble.bubbleHeight || 100;
    const drawingColor = bubble.drawingColor || '#ff0000';
    const textValue = bubble.textObject ? bubble.textObject.text : 'Gõ thông tin...';

    const tailOffset = updates.tailOffset !== undefined ? updates.tailOffset : (bubble.tailOffset ?? (bubbleType === 'rect' ? 30 : w / 2));
    const tailWidth = updates.tailWidth !== undefined ? updates.tailWidth : (bubble.tailWidth ?? (bubbleType === 'rect' ? 20 : 30));
    const tailHeight = updates.tailHeight !== undefined ? updates.tailHeight : (bubble.tailHeight ?? (bubbleType === 'rect' ? 15 : 12));
    const tailSide = updates.tailSide !== undefined ? updates.tailSide : (bubble.tailSide ?? 'bottom');

    let bodyObj: any;
    if (bubbleType === 'rect') {
      bodyObj = new fabric.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: 'rgba(30, 41, 59, 0.6)',
        stroke: drawingColor,
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        originX: 'left',
        originY: 'top',
      });
    } else {
      bodyObj = new fabric.Ellipse({
        left: 0,
        top: 0,
        rx: w / 2,
        ry: h / 2,
        fill: 'rgba(30, 41, 59, 0.6)',
        stroke: drawingColor,
        strokeWidth: 2,
        originX: 'left',
        originY: 'top',
      });
    }

    // Get updated tail points
    const points = getTailPoints(tailSide, tailOffset, tailWidth, tailHeight, w, h);
    const tailPoly = new fabric.Polygon(points, {
      fill: 'rgba(30, 41, 59, 0.6)',
      stroke: drawingColor,
      strokeWidth: 2,
      strokeLineJoin: 'miter',
      originX: 'left',
      originY: 'top',
    });

    // Create text
    let textObj: any;
    if (bubbleType === 'rect') {
      textObj = new fabric.Text(textValue, {
        left: 12,
        top: 12,
        width: w - 24,
        fontSize: 14,
        fontFamily: 'Inter',
        fill: '#ffffff',
        originX: 'left',
        originY: 'top',
      });
    } else {
      textObj = new fabric.Text(textValue, {
        left: w * 0.15,
        top: h * 0.15,
        width: w * 0.7,
        fontSize: 14,
        fontFamily: 'Inter',
        fill: '#ffffff',
        originX: 'left',
        originY: 'top',
      });
    }

    const group = new fabric.Group([bodyObj, tailPoly, textObj], {
      left: bubble.left,
      top: bubble.top,
      scaleX: bubble.scaleX,
      scaleY: bubble.scaleY,
      angle: bubble.angle,
      selectable: true,
      evented: true,
    });

    (group as any).isSpeechBubble = true;
    (group as any).bubbleType = bubbleType;
    (group as any).bubbleWidth = w;
    (group as any).bubbleHeight = h;
    (group as any).tailOffset = tailOffset;
    (group as any).tailWidth = tailWidth;
    (group as any).tailHeight = tailHeight;
    (group as any).tailSide = tailSide;
    (group as any).textObject = textObj;
    (group as any).drawingColor = drawingColor;

    isHistoryUpdate.current = true;
    canvas.remove(bubble);
    canvas.add(group);
    isHistoryUpdate.current = false;
    saveStateToHistory();
    group.setCoords();
    canvas.setActiveObject(group);
    canvas.renderAll();

    setSelectedBubble(group);
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Initialize Fabric.js Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      isDrawingMode: false,
      fireRightClick: true,
      stopContextMenu: true,
    });
    
    fabricCanvasRef.current = canvas;
    
    // Set background image
    fabric.Image.fromURL(tacticalMapBg).then((img) => {
      const mw = img.width || 1920;
      const mh = img.height || 1080;
      mapDimensionsRef.current = { width: mw, height: mh };

      img.set({
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        selectable: false,
        evented: false,
      });
      bgImageRef.current = img;
      canvas.backgroundImage = img;

      updateCanvasViewport(1);
      saveStateToHistory(); // Save initial blank state
    });

    // Handle window resize
    const handleResize = () => {
      updateCanvasViewport();
    };
    window.addEventListener('resize', handleResize);

    // History tracking
    canvas.on('object:added', saveStateToHistory);
    canvas.on('object:modified', saveStateToHistory);
    canvas.on('object:removed', saveStateToHistory);
    canvas.on('path:created', saveStateToHistory);

    const handleSelection = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 1) {
        const obj = activeObjects[0] as any;
        if (obj.isSpeechBubble) {
          setSelectedBubble(obj);
          setSelectedTextObj(obj.textObject || obj.item(2));
        } else if (obj.isTextbox || obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
          setSelectedBubble(null);
          setSelectedTextObj(obj);
        } else {
          setSelectedBubble(null);
          setSelectedTextObj(null);
        }
        if (obj.stickerType && obj.stickerType.startsWith('team_')) {
          const teamId = obj.stickerType.replace('team_', '');
          setSelectedTeamId(teamId);
          return;
        }
      } else {
        setSelectedBubble(null);
        setSelectedTextObj(null);
      }
      setSelectedTeamId(null);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      setSelectedTeamId(null);
      setSelectedBubble(null);
      setSelectedTextObj(null);
    });

    const handleAfterRender = () => {
      const vpt = canvas.viewportTransform;
      if (vpt) {
        setPanX(vpt[4]);
        setPanY(vpt[5]);
        setZoom(canvas.getZoom());
        setCanvasDimensions({
          width: canvas.width || 800,
          height: canvas.height || 600
        });
      }
    };
    canvas.on('after:render', handleAfterRender);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset properties
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('mouse:wheel');
    canvas.off('mouse:dblclick');
    canvas.defaultCursor = 'default';

    // Scroll to Zoom
    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let z = zoomRef.current || 1;
      z *= 0.999 ** delta;
      if (z > 5) z = 5;
      if (z < 1) z = 1;

      const cw = canvas.width!;
      const ch = canvas.height!;
      const mw = mapDimensionsRef.current.width;
      const mh = mapDimensionsRef.current.height;
      const fitScale = Math.min(cw / mw, ch / mh);
      const targetScale = fitScale * z;

      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, targetScale);
      constrainCanvasPan(canvas);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;
    
    let isDrawingShape = false;
    let shapeStartPoint = { x: 0, y: 0 };
    let currentShape: fabric.Object | null = null;
    let arrowLine: fabric.Line | null = null;
    let arrowHead: fabric.Triangle | null = null;

    const onMouseDown = (opt: any) => {
      const evt = opt.e;
      const isCtrl = evt.ctrlKey || evt.metaKey;

      if (evt.button === 2) {
        // Right click pan
        isPanning = true;
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Ctrl + Left click / drag to duplicate sticker/object
      if (evt.button === 0 && isCtrl) {
        const targetObj = opt.target || canvas.getActiveObject();
        if (targetObj && targetObj !== canvas.backgroundImage) {
          const origLeft = targetObj.left || 0;
          const origTop = targetObj.top || 0;

          targetObj.clone().then((cloned: fabric.Object) => {
            // Keep original object anchored in place
            targetObj.set({ left: origLeft, top: origTop });
            targetObj.setCoords();

            cloned.set({
              left: origLeft,
              top: origTop,
              evented: true,
              selectable: true,
            });

            if ((targetObj as any).stickerType) {
              (cloned as any).stickerType = (targetObj as any).stickerType;
            }
            if ((targetObj as any).isSpeechBubble) {
              (cloned as any).isSpeechBubble = (targetObj as any).isSpeechBubble;
              (cloned as any).bubbleType = (targetObj as any).bubbleType;
              (cloned as any).bubbleWidth = (targetObj as any).bubbleWidth;
              (cloned as any).bubbleHeight = (targetObj as any).bubbleHeight;
              (cloned as any).tailOffset = (targetObj as any).tailOffset;
              (cloned as any).tailWidth = (targetObj as any).tailWidth;
              (cloned as any).tailHeight = (targetObj as any).tailHeight;
              (cloned as any).tailSide = (targetObj as any).tailSide;
              (cloned as any).textObject = (targetObj as any).textObject;
              (cloned as any).drawingColor = (targetObj as any).drawingColor;
            }
            if ((targetObj as any).isTextbox) {
              (cloned as any).isTextbox = (targetObj as any).isTextbox;
            }

            canvas.add(cloned);
            cloned.setCoords();
            canvas.setActiveObject(cloned);

            lastClonedRef.current = { obj: cloned, origLeft, origTop };

            if ((canvas as any)._currentTransform) {
              (canvas as any)._currentTransform.target = cloned;
            }

            canvas.requestRenderAll();
            saveStateToHistory();
          });
          return;
        }
      }

      if (tool === 'eraser' && evt.button === 0) {
        if (opt.target && !(opt.target instanceof fabric.Image && opt.target === canvas.backgroundImage)) {
          canvas.remove(opt.target);
        }
      }
      
      if ((tool === 'rect' || tool === 'oval' || tool === 'arrow' || tool === 'speech_bubble_rect' || tool === 'speech_bubble_oval' || tool === 'textbox') && evt.button === 0) {
        isDrawingShape = true;
        const pointer = opt.scenePoint || canvas.getScenePoint(evt);
        shapeStartPoint = { x: pointer.x, y: pointer.y };

        if (tool === 'rect' || tool === 'speech_bubble_rect' || tool === 'textbox') {
          currentShape = new fabric.Rect({
            left: shapeStartPoint.x,
            top: shapeStartPoint.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: drawingColor,
            strokeWidth: tool === 'textbox' ? 1 : drawingWidth,
            strokeDashArray: (tool === 'speech_bubble_rect' || tool === 'textbox') ? [5, 5] : undefined,
            selectable: false,
            evented: false
          });
          canvas.add(currentShape);
        } else if (tool === 'oval' || tool === 'speech_bubble_oval') {
          currentShape = new fabric.Ellipse({
            left: shapeStartPoint.x,
            top: shapeStartPoint.y,
            rx: 0,
            ry: 0,
            fill: 'transparent',
            stroke: drawingColor,
            strokeWidth: drawingWidth,
            strokeDashArray: tool === 'speech_bubble_oval' ? [5, 5] : undefined,
            selectable: false,
            evented: false
          });
          canvas.add(currentShape);
        } else if (tool === 'arrow') {
          arrowLine = new fabric.Line([shapeStartPoint.x, shapeStartPoint.y, shapeStartPoint.x, shapeStartPoint.y], {
            stroke: drawingColor,
            strokeWidth: drawingWidth,
            selectable: false,
            evented: false
          });
          arrowHead = new fabric.Triangle({
            width: drawingWidth * 4,
            height: drawingWidth * 4,
            fill: drawingColor,
            left: shapeStartPoint.x,
            top: shapeStartPoint.y,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            angle: 90
          });
          canvas.add(arrowLine, arrowHead);
        }
      }
    };

    const onMouseMove = (opt: any) => {
      if (isPanning) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          constrainCanvasPan(canvas);
        }
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
      
      if (isDrawingShape) {
        const pointer = opt.scenePoint || canvas.getScenePoint(opt.e);
        if ((tool === 'rect' || tool === 'speech_bubble_rect' || tool === 'textbox') && currentShape) {
          const w = Math.abs(pointer.x - shapeStartPoint.x);
          const h = Math.abs(pointer.y - shapeStartPoint.y);
          currentShape.set({
            left: Math.min(pointer.x, shapeStartPoint.x),
            top: Math.min(pointer.y, shapeStartPoint.y),
            width: w,
            height: h
          });
          canvas.requestRenderAll();
        } else if ((tool === 'oval' || tool === 'speech_bubble_oval') && currentShape) {
          const rx = Math.abs(pointer.x - shapeStartPoint.x) / 2;
          const ry = Math.abs(pointer.y - shapeStartPoint.y) / 2;
          currentShape.set({
            left: Math.min(pointer.x, shapeStartPoint.x),
            top: Math.min(pointer.y, shapeStartPoint.y),
            rx: rx,
            ry: ry,
            width: rx * 2,
            height: ry * 2
          });
          canvas.requestRenderAll();
        } else if (tool === 'arrow' && arrowLine && arrowHead) {
          arrowLine.set({ x2: pointer.x, y2: pointer.y });
          const dx = pointer.x - shapeStartPoint.x;
          const dy = pointer.y - shapeStartPoint.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          arrowHead.set({
            left: pointer.x,
            top: pointer.y,
            angle: angle + 90
          });
          canvas.requestRenderAll();
        }
      }
    };

    const onMouseUp = (opt: any) => {
      const evt = opt.e;

      if (lastClonedRef.current) {
        const { obj, origLeft, origTop } = lastClonedRef.current;
        if (Math.abs((obj.left || 0) - origLeft) < 3 && Math.abs((obj.top || 0) - origTop) < 3) {
          obj.set({ left: origLeft + 15, top: origTop + 15 });
          obj.setCoords();
          canvas.requestRenderAll();
        }
        lastClonedRef.current = null;
      }

      if (evt.button === 2 || isPanning) {
        isPanning = false;
        canvas.defaultCursor = tool === 'eraser' ? 'pointer' : (tool !== 'select' ? 'crosshair' : 'default');
        canvas.selection = tool === 'select';
        constrainCanvasPan(canvas);
      }
      
      if (isDrawingShape) {
        isDrawingShape = false;
        const pointer = opt.scenePoint || canvas.getScenePoint(evt);
        const endX = pointer.x;
        const endY = pointer.y;

        const startX = shapeStartPoint.x;
        const startY = shapeStartPoint.y;

        let w = Math.abs(endX - startX);
        let h = Math.abs(endY - startY);
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);

        if (w < 15) w = 160;
        if (h < 15) h = 100;

        const isSelectTool = tool === 'select';

        if (tool === 'textbox') {
          if (currentShape) canvas.remove(currentShape);
          
          const textbox = new fabric.Textbox('Nhấp đôi để gõ...', {
            left: left,
            top: top,
            width: w,
            fontSize: 16,
            fontFamily: 'Inter',
            fill: drawingColor,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderColor: drawingColor,
            editingBorderColor: '#6366f1',
            padding: 8,
            cornerSize: 8,
            transparentCorners: false,
            cornerColor: '#6366f1',
            splitByGrapheme: true,
            selectable: true,
            evented: true,
          });
          (textbox as any).isTextbox = true;
          canvas.add(textbox);
          textbox.setCoords();
          
          setTool('select');
          canvas.setActiveObject(textbox);
          setTimeout(() => {
            textbox.enterEditing();
            textbox.selectAll();
            canvas.renderAll();
          }, 50);

        } else if (tool === 'speech_bubble_rect') {
          if (currentShape) canvas.remove(currentShape);

          const rectBody = new fabric.Rect({
            left: 0,
            top: 0,
            width: w,
            height: h,
            fill: 'rgba(30, 41, 59, 0.6)',
            stroke: drawingColor,
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            originX: 'left',
            originY: 'top',
          });

          const tailPoly = new fabric.Polygon([
            { x: 20, y: h - 1 },
            { x: 30, y: h + 15 },
            { x: 40, y: h - 1 }
          ], {
            fill: 'rgba(30, 41, 59, 0.6)',
            stroke: drawingColor,
            strokeWidth: 2,
            strokeLineJoin: 'miter',
            originX: 'left',
            originY: 'top',
          });

          const textObj = new fabric.Text('Gõ thông tin...', {
            left: 12,
            top: 12,
            width: w - 24,
            fontSize: 14,
            fontFamily: 'Inter',
            fill: '#ffffff',
            originX: 'left',
            originY: 'top',
          });

          const group = new fabric.Group([rectBody, tailPoly, textObj], {
            left: left,
            top: top,
            selectable: true,
            evented: true,
          });

          (group as any).isSpeechBubble = true;
          (group as any).bubbleType = 'rect';
          (group as any).bubbleWidth = w;
          (group as any).bubbleHeight = h;
          (group as any).tailOffset = 30;
          (group as any).tailWidth = 20;
          (group as any).tailHeight = 15;
          (group as any).tailSide = 'bottom';
          (group as any).textObject = textObj;
          (group as any).drawingColor = drawingColor;

          canvas.add(group);
          group.setCoords();

          setTool('select');
          canvas.setActiveObject(group);
          
          setTimeout(() => {
            const bound = group.getBoundingRect();
            const canvasEl = canvas.getElement();
            const rect = canvasEl.getBoundingClientRect();
            setEditingTextObject({
              fabricObject: group,
              textElement: textObj,
              x: rect.left + bound.left + 12 * (canvas.getZoom()),
              y: rect.top + bound.top + 12 * (canvas.getZoom()),
              width: (w - 24) * canvas.getZoom(),
              height: (h - 24) * canvas.getZoom(),
              value: 'Gõ thông tin...',
            });
          }, 100);

        } else if (tool === 'speech_bubble_oval') {
          if (currentShape) canvas.remove(currentShape);

          const ovalBody = new fabric.Ellipse({
            left: 0,
            top: 0,
            rx: w / 2,
            ry: h / 2,
            fill: 'rgba(30, 41, 59, 0.6)',
            stroke: drawingColor,
            strokeWidth: 2,
            originX: 'left',
            originY: 'top',
          });

          const tailPoly = new fabric.Polygon([
            { x: w / 2 - 20, y: h - 3 },
            { x: w / 2 - 35, y: h + 12 },
            { x: w / 2 - 5, y: h - 3 }
          ], {
            fill: 'rgba(30, 41, 59, 0.6)',
            stroke: drawingColor,
            strokeWidth: 2,
            strokeLineJoin: 'miter',
            originX: 'left',
            originY: 'top',
          });

          const textObj = new fabric.Text('Gõ thông tin...', {
            left: w * 0.15,
            top: h * 0.15,
            width: w * 0.7,
            fontSize: 14,
            fontFamily: 'Inter',
            fill: '#ffffff',
            originX: 'left',
            originY: 'top',
          });

          const group = new fabric.Group([ovalBody, tailPoly, textObj], {
            left: left,
            top: top,
            selectable: true,
            evented: true,
          });

          (group as any).isSpeechBubble = true;
          (group as any).bubbleType = 'oval';
          (group as any).bubbleWidth = w;
          (group as any).bubbleHeight = h;
          (group as any).tailOffset = w / 2;
          (group as any).tailWidth = 30;
          (group as any).tailHeight = 12;
          (group as any).tailSide = 'bottom';
          (group as any).textObject = textObj;
          (group as any).drawingColor = drawingColor;

          canvas.add(group);
          group.setCoords();

          setTool('select');
          canvas.setActiveObject(group);

          setTimeout(() => {
            const bound = group.getBoundingRect();
            const canvasEl = canvas.getElement();
            const rect = canvasEl.getBoundingClientRect();
            setEditingTextObject({
              fabricObject: group,
              textElement: textObj,
              x: rect.left + bound.left + (w * 0.15) * canvas.getZoom(),
              y: rect.top + bound.top + (h * 0.15) * canvas.getZoom(),
              width: (w * 0.7) * canvas.getZoom(),
              height: (h * 0.7) * canvas.getZoom(),
              value: 'Gõ thông tin...',
            });
          }, 100);

        } else {
          // Check for accidental single clicks / tiny movements for general shapes
          if ((tool === 'rect' || tool === 'oval' || tool === 'arrow') && w < 5 && h < 5) {
            if (currentShape) canvas.remove(currentShape);
            if (arrowLine) canvas.remove(arrowLine);
            if (arrowHead) canvas.remove(arrowHead);
          } else {
            if (currentShape) {
              currentShape.set({ selectable: true, evented: true });
              currentShape.setCoords();
              canvas.setActiveObject(currentShape);
              saveStateToHistory();
            }
            if (arrowLine && arrowHead) {
              canvas.remove(arrowLine, arrowHead);
              const group = new fabric.Group([arrowLine, arrowHead], {
                selectable: true,
                evented: true
              });
              canvas.add(group);
              group.setCoords();
              canvas.setActiveObject(group);
              saveStateToHistory();
            }
            setTool('select');
          }
        }

        currentShape = null;
        arrowLine = null;
        arrowHead = null;
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    const onDblClick = (opt: any) => {
      const target = opt.target;
      if (!target) return;

      const canvasEl = canvas.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const bound = target.getBoundingRect();

      if (target.isSpeechBubble) {
        const textObj = target.textObject || target.item(2);
        const w = target.width * target.scaleX;
        const h = target.height * target.scaleY;
        const paddingRatio = target.bubbleType === 'rect' ? 0.12 : 0.15;

        setEditingTextObject({
          fabricObject: target,
          textElement: textObj,
          x: rect.left + bound.left + (w * paddingRatio) * canvas.getZoom(),
          y: rect.top + bound.top + (h * paddingRatio) * canvas.getZoom(),
          width: (w * (1 - paddingRatio * 2)) * canvas.getZoom(),
          height: (h * (1 - paddingRatio * 2)) * canvas.getZoom(),
          value: textObj.text || '',
        });
      }
    };
    canvas.on('mouse:dblclick', onDblClick);

    if (tool === 'eraser') {
      canvas.defaultCursor = 'pointer';
    } else if (tool === 'pen' || tool === 'highlighter') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = tool === 'highlighter' ? `${drawingColor}66` : drawingColor;
      brush.width = tool === 'highlighter' ? 20 : drawingWidth;
      canvas.freeDrawingBrush = brush;
    } else if (tool === 'rect' || tool === 'oval' || tool === 'arrow' || tool === 'speech_bubble_rect' || tool === 'speech_bubble_oval' || tool === 'textbox') {
      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;
    }

    const isSelectTool = tool === 'select';
    canvas.forEachObject(obj => {
      if (obj !== canvas.backgroundImage) {
        obj.selectable = isSelectTool;
        obj.evented = isSelectTool || tool === 'eraser';
        obj.setCoords();
      }
    });

    if (!isSelectTool) {
      canvas.discardActiveObject();
    }
    
    canvas.requestRenderAll();
  }, [tool, drawingColor, drawingWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key.toLowerCase() === 'c') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj !== canvas.backgroundImage) {
          clipboardRef.current = activeObj;
        }
      } else if (isCtrl && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current) {
          e.preventDefault();
          const srcObj = clipboardRef.current;
          srcObj.clone().then((cloned: fabric.Object) => {
            cloned.set({
              left: (srcObj.left || 0) + 20,
              top: (srcObj.top || 0) + 20,
              evented: true,
              selectable: true,
            });

            if ((srcObj as any).stickerType) (cloned as any).stickerType = (srcObj as any).stickerType;
            if ((srcObj as any).isSpeechBubble) {
              (cloned as any).isSpeechBubble = (srcObj as any).isSpeechBubble;
              (cloned as any).bubbleType = (srcObj as any).bubbleType;
              (cloned as any).bubbleWidth = (srcObj as any).bubbleWidth;
              (cloned as any).bubbleHeight = (srcObj as any).bubbleHeight;
              (cloned as any).tailOffset = (srcObj as any).tailOffset;
              (cloned as any).tailWidth = (srcObj as any).tailWidth;
              (cloned as any).tailHeight = (srcObj as any).tailHeight;
              (cloned as any).tailSide = (srcObj as any).tailSide;
              (cloned as any).textObject = (srcObj as any).textObject;
              (cloned as any).drawingColor = (srcObj as any).drawingColor;
            }
            if ((srcObj as any).isTextbox) (cloned as any).isTextbox = (srcObj as any).isTextbox;

            canvas.add(cloned);
            cloned.setCoords();
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            saveStateToHistory();
            clipboardRef.current = cloned;
          });
        }
      } else if (isCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj !== canvas.backgroundImage) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fabricCanvasRef.current && containerRef.current) {
        updateCanvasViewport();
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [isRightPanelOpen]);

  const handleAddSticker = (type: string, label?: string, color?: string, x?: number, y?: number, name?: string, iconUrl?: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    let dropX: number;
    let dropY: number;

    if (x !== undefined && y !== undefined) {
      dropX = (x - vpt[4]) / vpt[0];
      dropY = (y - vpt[5]) / vpt[3];
    } else {
      dropX = (canvas.width! / 2 - vpt[4]) / vpt[0];
      dropY = (canvas.height! / 2 - vpt[5]) / vpt[3];
    }

    let imgUrl = iconUrl;
    if (!imgUrl) {
      const found = stickers.find(s => s.type === type);
      if (found && found.icon) {
        imgUrl = found.icon;
      }
    }

    if (!imgUrl) {
      imgUrl = getStickerSvg(type, label || '', color || '#3b82f6');
    }

    const displayName = name || label || '';

    fabric.Image.fromURL(imgUrl).then((img) => {
      // Set image properties
      // Desired icon size is 48x48
      const size = 48;
      const maxDim = Math.max(img.width || 1, img.height || 1);
      const scale = size / maxDim;

      img.set({
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        left: 0,
        top: displayName ? -10 : 0, // shifted up slightly to make room for text below
      });

      const groupObjs: fabric.Object[] = [img];

      if (displayName) {
        const text = new fabric.Text(displayName, {
          fontSize: 12,
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          fontWeight: 'bold',
          fontFamily: 'Inter',
          left: 0,
          top: 22, // shifted down below the icon
          stroke: '#000000',
          strokeWidth: 2,
          paintFirst: 'stroke',
          shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.8)',
            blur: 3,
            offsetX: 1,
            offsetY: 1
          })
        });
        groupObjs.push(text);
      }

      const isSelectTool = tool === 'select';
      const group = new fabric.Group(groupObjs, {
        left: dropX,
        top: dropY,
        originX: 'center',
        originY: 'center',
        selectable: isSelectTool,
        evented: isSelectTool || tool === 'eraser',
      });
      
      // Add custom properties to identify sticker types if needed later
      (group as any).stickerType = type;

      canvas.add(group);
      group.setCoords();
      if (isSelectTool) {
        canvas.setActiveObject(group);
      }
      canvas.renderAll();
    });
  };

  const handleClear = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    
    // Remove all objects except the background
    const objects = canvas.getObjects();
    isHistoryUpdate.current = true;
    objects.forEach(obj => {
      canvas.remove(obj);
    });
    isHistoryUpdate.current = false;
    saveStateToHistory();
    canvas.renderAll();
  };

  const handleSaveState = async (asNew: boolean = false) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    
    // Convert to JSON
    const json = canvas.toJSON(['stickerType']);
    
    if (activeTacticId && tactics[activeTacticId] && !asNew) {
      // Update existing
      const updatedTactics = {
        ...tactics,
        [activeTacticId]: {
          ...tactics[activeTacticId],
          data: JSON.stringify(json),
          timestamp: Date.now()
        }
      };
      await saveTacticsToServer(updatedTactics);
    } else {
      // Create new
      const id = Date.now().toString();
      const newTactic: TacticState = {
        id,
        name: `Tactic ${Object.keys(tactics).length + 1}`,
        data: JSON.stringify(json),
        timestamp: Date.now()
      };
      const updatedTactics = { ...tactics, [id]: newTactic };
      await saveTacticsToServer(updatedTactics);
      setActiveTacticId(id);
    }
  };

  const handleDuplicateSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj !== canvas.backgroundImage) {
      activeObj.clone().then((cloned: fabric.Object) => {
        cloned.set({
          left: (activeObj.left || 0) + 20,
          top: (activeObj.top || 0) + 20,
          evented: true,
          selectable: true,
        });

        if ((activeObj as any).stickerType) (cloned as any).stickerType = (activeObj as any).stickerType;
        if ((activeObj as any).isSpeechBubble) {
          (cloned as any).isSpeechBubble = (activeObj as any).isSpeechBubble;
          (cloned as any).bubbleType = (activeObj as any).bubbleType;
          (cloned as any).bubbleWidth = (activeObj as any).bubbleWidth;
          (cloned as any).bubbleHeight = (activeObj as any).bubbleHeight;
          (cloned as any).tailOffset = (activeObj as any).tailOffset;
          (cloned as any).tailWidth = (activeObj as any).tailWidth;
          (cloned as any).tailHeight = (activeObj as any).tailHeight;
          (cloned as any).tailSide = (activeObj as any).tailSide;
          (cloned as any).textObject = (activeObj as any).textObject;
          (cloned as any).drawingColor = (activeObj as any).drawingColor;
        }
        if ((activeObj as any).isTextbox) (cloned as any).isTextbox = (activeObj as any).isTextbox;

        canvas.add(cloned);
        cloned.setCoords();
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
        saveStateToHistory();
      });
    }
  };

  const handleDeleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        isHistoryUpdate.current = true;
        activeObjects.forEach(obj => canvas.remove(obj));
        isHistoryUpdate.current = false;
        saveStateToHistory();
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    }
  };

  const updateCanvasViewport = (targetZoom?: number) => {
    const canvas = fabricCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw <= 0 || ch <= 0) return;

    canvas.setDimensions({ width: cw, height: ch });

    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;

    const fitScale = Math.min(cw / mw, ch / mh);
    const z = targetZoom !== undefined ? targetZoom : (zoomRef.current || 1);
    const totalScale = fitScale * z;

    const baseOffsetX = (cw - mw * totalScale) / 2;
    const baseOffsetY = (ch - mh * totalScale) / 2;

    const vpt: fabric.TMat2D = [totalScale, 0, 0, totalScale, baseOffsetX, baseOffsetY];
    canvas.setViewportTransform(vpt);
    setZoom(z);
    zoomRef.current = z;
    canvas.requestRenderAll();
  };

  const constrainCanvasPan = (canvas: fabric.Canvas) => {
    const vpt = canvas.viewportTransform;
    if (!vpt || !containerRef.current) return;
    
    const cw = canvas.width!;
    const ch = canvas.height!;
    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;

    const fitScale = Math.min(cw / mw, ch / mh);
    const totalScale = vpt[0];
    const currentZoom = fitScale > 0 ? totalScale / fitScale : 1;

    if (currentZoom <= 1.001) {
      vpt[0] = fitScale;
      vpt[3] = fitScale;
      vpt[4] = (cw - mw * fitScale) / 2;
      vpt[5] = (ch - mh * fitScale) / 2;
      setZoom(1);
      zoomRef.current = 1;
    } else {
      setZoom(currentZoom);
      zoomRef.current = currentZoom;

      const baseOffsetX = (cw - mw * totalScale) / 2;
      const baseOffsetY = (ch - mh * totalScale) / 2;

      if (mw * totalScale <= cw) {
        vpt[4] = baseOffsetX;
      } else {
        const minPanX = cw - mw * totalScale;
        vpt[4] = Math.min(0, Math.max(minPanX, vpt[4]));
      }

      if (mh * totalScale <= ch) {
        vpt[5] = baseOffsetY;
      } else {
        const minPanY = ch - mh * totalScale;
        vpt[5] = Math.min(0, Math.max(minPanY, vpt[5]));
      }
    }

    canvas.setViewportTransform(vpt);
    canvas.requestRenderAll();
  };

  const handleHorizontalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = fabricCanvasRef.current;
    if (!canvas || !hTrackRef.current) return;
    
    const track = hTrackRef.current;
    const rect = track.getBoundingClientRect();
    const trackWidth = rect.width;
    const cw = canvas.width!;
    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;
    const fitScale = Math.min(cw / mw, canvas.height! / mh);
    const z = zoomRef.current || 1;
    const totalScale = fitScale * z;
    const maxPanX = mw * totalScale - cw;
    const baseOffsetX = (cw - mw * totalScale) / 2;

    if (maxPanX <= 0) return;
    
    const updatePosition = (clientX: number) => {
      const offsetX = Math.max(0, Math.min(clientX - rect.left, trackWidth));
      const fraction = offsetX / trackWidth;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] = baseOffsetX - fraction * maxPanX;
        constrainCanvasPan(canvas);
        canvas.requestRenderAll();
      }
    };
    
    updatePosition(e.clientX);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updatePosition(moveEvent.clientX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = fabricCanvasRef.current;
    if (!canvas || !vTrackRef.current) return;
    
    const track = vTrackRef.current;
    const rect = track.getBoundingClientRect();
    const trackHeight = rect.height;
    const ch = canvas.height!;
    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;
    const fitScale = Math.min(canvas.width! / mw, ch / mh);
    const z = zoomRef.current || 1;
    const totalScale = fitScale * z;
    const maxPanY = mh * totalScale - ch;
    const baseOffsetY = (ch - mh * totalScale) / 2;

    if (maxPanY <= 0) return;
    
    const updatePosition = (clientY: number) => {
      const offsetY = Math.max(0, Math.min(clientY - rect.top, trackHeight));
      const fraction = offsetY / trackHeight;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[5] = baseOffsetY - fraction * maxPanY;
        constrainCanvasPan(canvas);
        canvas.requestRenderAll();
      }
    };
    
    updatePosition(e.clientY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updatePosition(moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const currentZ = zoomRef.current || 1;
    const newZ = Math.min(5, currentZ * 1.25);
    
    const cw = canvas.width!;
    const ch = canvas.height!;
    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;
    const fitScale = Math.min(cw / mw, ch / mh);
    const targetScale = fitScale * newZ;

    canvas.zoomToPoint({ x: cw / 2, y: ch / 2 }, targetScale);
    constrainCanvasPan(canvas);
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const currentZ = zoomRef.current || 1;
    const newZ = Math.max(1, currentZ / 1.25);

    if (newZ <= 1.001) {
      handleResetZoom();
      return;
    }

    const cw = canvas.width!;
    const ch = canvas.height!;
    const mw = mapDimensionsRef.current.width;
    const mh = mapDimensionsRef.current.height;
    const fitScale = Math.min(cw / mw, ch / mh);
    const targetScale = fitScale * newZ;

    canvas.zoomToPoint({ x: cw / 2, y: ch / 2 }, targetScale);
    constrainCanvasPan(canvas);
  };

  const handleResetZoom = () => {
    zoomRef.current = 1;
    updateCanvasViewport(1);
  };

  const handleLoadState = async (id: string) => {
    if (!fabricCanvasRef.current || !tactics[id]) return;
    const canvas = fabricCanvasRef.current;
    
    try {
      handleClear();
      await canvas.loadFromJSON(tactics[id].data);
      if (bgImageRef.current) {
        canvas.backgroundImage = bgImageRef.current;
      }
      updateCanvasViewport();
      canvas.renderAll();
      setActiveTacticId(id);
    } catch (err) {
      console.error('Failed to load canvas state:', err);
    }
  };

  const handleDeleteState = async (id: string) => {
    const updatedTactics = { ...tactics };
    delete updatedTactics[id];
    await saveTacticsToServer(updatedTactics);
    if (activeTacticId === id) {
      setActiveTacticId(null);
      handleClear();
    }
  };

  const startRename = (id: string) => {
    if (!tactics[id]) return;
    setActiveTacticId(id);
    setEditName(tactics[id].name);
    setIsEditingName(true);
  };

  const commitRename = async () => {
    if (activeTacticId && editName.trim()) {
      const updatedTactics = {
        ...tactics,
        [activeTacticId]: {
          ...tactics[activeTacticId],
          name: editName.trim()
        }
      };
      await saveTacticsToServer(updatedTactics);
    }
    setIsEditingName(false);
  };

  const defaultStickers: StickerData[] = [
    { type: 'cong_red', label: 'Công', name: 'Công Đỏ', color: '#ef4444' },
    { type: 'thu_red', label: 'Thủ', name: 'Thủ Đỏ', color: '#ef4444' },
    { type: 'boss', label: 'Boss', name: 'Boss', icon: bossImg, color: '#ef4444' },
    { type: 'goosee_blue', label: 'Goosee', name: 'Goosee Xanh', icon: gooseeBlueImg, color: '#3b82f6' },
    { type: 'goosee_red', label: 'Goosee', name: 'Goosee Đỏ', icon: gooseeRedImg, color: '#ef4444' },
    { type: 'home', label: 'Home', name: 'Home', icon: homeImg, color: '#eab308' },
    { type: 'tower_blue', label: 'Tower', name: 'Tower Xanh', icon: towerBlueImg, color: '#3b82f6' },
    { type: 'tower_red', label: 'Tower', name: 'Tower Đỏ', icon: towerRedImg, color: '#ef4444' },
    { type: 'tree_blue', label: 'Tree', name: 'Tree Xanh', icon: treeBlueImg, color: '#22c55e' },
    { type: 'tree_red', label: 'Tree', name: 'Tree Đỏ', icon: treeRedImg, color: '#ef4444' },
  ];

  const roleStickers: StickerData[] = [
    { type: 'role_tanker_blue', label: 'Tanker', name: 'Tanker upd', color: '#3b82f6' },
    { type: 'role_tanker_red', label: 'Tanker', name: 'Tanker Đỏ', color: '#ef4444' },
    { type: 'role_melee_blue', label: 'Melee', name: 'Melee Xanh', color: '#3b82f6' },
    { type: 'role_melee_red', label: 'Melee', name: 'Melee Đỏ', color: '#ef4444' },
    { type: 'role_ranger_blue', label: 'Ranger', name: 'Ranger Xanh', color: '#3b82f6' },
    { type: 'role_ranger_red', label: 'Ranger', name: 'Ranger Đỏ', color: '#ef4444' },
    { type: 'role_healer_blue', label: 'Healer', name: 'Healer Xanh', color: '#3b82f6' },
    { type: 'role_healer_red', label: 'Healer', name: 'Healer Đỏ', color: '#ef4444' },
  ];

  const activeAreas = areas.filter(area => !area.isLocked);

  useEffect(() => {
    if (selectedTeamId) {
      const parentArea = activeAreas.find(area => area.teams.some(t => t.id === selectedTeamId));
      if (parentArea) {
        const nextExpanded: Record<string, boolean> = {};
        activeAreas.forEach(area => {
          nextExpanded[area.id] = area.id === parentArea.id;
        });
        setExpandedGroups(nextExpanded);
      }
    }
  }, [selectedTeamId]);

  const toggleGroup = (areaId: string) => {
    setExpandedGroups(prev => {
      const currentlyExpanded = prev[areaId] !== false;
      return {
        ...prev,
        [areaId]: !currentlyExpanded
      };
    });
  };

  const teamStickers: StickerData[] = activeAreas.flatMap(area => 
    area.teams.map((team, index) => {
      const isRed = team.name.toLowerCase().includes('đỏ') || area.name.toLowerCase().includes('đỏ');
      const color = isRed ? '#ef4444' : '#3b82f6';
      
      const isCong = team.name.toLowerCase().includes('công') || area.name.toLowerCase().includes('công');
      const type = isCong ? `team_cong_${team.id}` : `team_thu_${team.id}`;
      return {
        type,
        label: String(team.members?.length || 0),
        name: team.name,
        color: color,
        teamId: team.id
      };
    })
  );

  const stickers = [...defaultStickers, ...roleStickers, ...teamStickers];

  const displayedStickers = 
    stickerTab === 'roles' ? roleStickers :
    stickerTab === 'default' ? defaultStickers :
    stickerTab === 'teams' ? teamStickers :
    stickers;

  // Scrollbar calculations
  const maxPanX = canvasDimensions.width * (zoom - 1);
  const thumbWidthPct = Math.max(10, Math.min(100, (1 / zoom) * 100));
  const panRatioX = maxPanX === 0 ? 0 : -panX / maxPanX;
  const leftPct = panRatioX * (100 - thumbWidthPct);

  const maxPanY = canvasDimensions.height * (zoom - 1);
  const thumbHeightPct = Math.max(10, Math.min(100, (1 / zoom) * 100));
  const panRatioY = maxPanY === 0 ? 0 : -panY / maxPanY;
  const topPct = panRatioY * (100 - thumbHeightPct);

  return (
    <div ref={modalRef} className={`fixed inset-0 z-50 flex animate-fade-in ${isFullscreen ? 'bg-slate-900 p-0' : 'bg-black/80 backdrop-blur-sm p-2 sm:p-4'}`}>
      <div className={`flex-1 flex flex-col bg-slate-900 ${isFullscreen ? 'rounded-none border-none' : 'rounded-xl border border-slate-700'} overflow-hidden shadow-2xl`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">Sa Bàn Chiến Thuật - {setupName}</h2>
            {activeTacticId && tactics[activeTacticId] && (
              <div className="flex items-center space-x-2 bg-slate-700 px-2.5 py-1 rounded-md">
                {isEditingName ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                    className="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-indigo-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-slate-200">{tactics[activeTacticId].name}</span>
                    <button onClick={() => startRename(activeTacticId)} className="text-slate-400 hover:text-white transition-colors" title="Đổi tên">
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Status Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 border-r border-slate-700 pr-2 sm:pr-3 mr-1 sm:mr-2">
              <button
                onClick={() => handleSaveState(false)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                title={activeTacticId ? 'Cập nhật trạng thái hiện tại' : 'Lưu trạng thái sa bàn'}
              >
                <Save size={16} />
                <span className="hidden sm:inline">{activeTacticId ? 'Cập nhật' : 'Lưu'}</span>
              </button>

              <button
                onClick={() => handleSaveState(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                title="Thêm mới trạng thái sa bàn"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Thêm mới</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center space-x-1.5 bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                title="Xóa trắng sa bàn"
              >
                <RotateCcw size={16} />
                <span className="hidden md:inline">Xóa trắng</span>
              </button>
            </div>

            <button 
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
              className={`p-2 rounded-lg transition-colors flex items-center space-x-1.5 ${isRightPanelOpen ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              title={isRightPanelOpen ? "Thu gọn bảng công cụ" : "Mở bảng công cụ"}
            >
              <SlidersHorizontal size={18} />
              <span className="text-xs font-medium hidden sm:inline">Công cụ</span>
            </button>

            <button 
              onClick={toggleFullscreen} 
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1.5"
              title={isFullscreen ? "Thoát toàn màn hình" : "Phóng to toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              <span className="text-xs font-medium hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Đóng">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Canvas Area */}
          <div 
            className="flex-1 relative bg-slate-950 min-w-0 overflow-hidden" 
            ref={containerRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('text/plain');
              if (data) {
                try {
                  const { source, type } = JSON.parse(data);
                  if (source === 'team_list' || source === 'sticker_list') {
                    const sticker = stickers.find(s => s.type === type);
                    if (sticker) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        handleAddSticker(sticker.type, sticker.label, sticker.color, x, y, sticker.name, sticker.icon);
                      }
                    }
                  }
                } catch (err) {}
              }
            }}
          >
            <canvas ref={canvasRef} />

            {/* Nút floating mở Right Panel khi đang ẩn */}
            {!isRightPanelOpen && (
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="absolute top-4 right-4 z-30 flex items-center space-x-2 bg-slate-900/95 hover:bg-indigo-600 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md border border-slate-700/80 hover:border-indigo-400 transition-all text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-right-2 duration-200"
                title="Mở bảng công cụ & chức năng"
              >
                <PanelRightOpen size={18} />
                <span>Bảng công cụ</span>
              </button>
            )}
            <div className="absolute bottom-4 left-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl space-x-1 text-slate-200">
              {/* Lịch sử: Undo / Redo */}
              <div className="flex items-center space-x-0.5 bg-slate-800/60 rounded-xl p-0.5 border border-slate-700/50">
                <button 
                  onClick={handleUndo} 
                  disabled={!canUndo} 
                  className={`p-2 rounded-lg transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'hover:bg-slate-700 hover:text-white text-slate-200'}`} 
                  title="Hoàn tác (Ctrl+Z)"
                >
                  <Undo size={18} />
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={!canRedo} 
                  className={`p-2 rounded-lg transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed text-slate-500' : 'hover:bg-slate-700 hover:text-white text-slate-200'}`} 
                  title="Làm lại (Ctrl+Y)"
                >
                  <Redo size={18} />
                </button>
              </div>

              <div className="w-px h-6 bg-slate-700/80 my-auto mx-0.5" />

              {/* Thu phóng: Zoom Out / Zoom % / Zoom In / Reset Zoom / Fullscreen */}
              <div className="flex items-center space-x-0.5 bg-slate-800/60 rounded-xl p-0.5 border border-slate-700/50">
                <button 
                  onClick={handleZoomOut} 
                  className="p-2 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-slate-300" 
                  title="Thu nhỏ (-)"
                >
                  <ZoomOut size={18} />
                </button>
                
                <button 
                  onClick={handleResetZoom} 
                  className="px-2 py-1 min-w-[48px] text-center text-xs font-mono font-bold text-slate-300 hover:text-indigo-400 hover:bg-slate-700/80 rounded-lg transition-colors" 
                  title="Đặt lại độ thu phóng (100%)"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button 
                  onClick={handleZoomIn} 
                  className="p-2 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-slate-300" 
                  title="Phóng to (+)"
                >
                  <ZoomIn size={18} />
                </button>

                <button 
                  onClick={handleResetZoom} 
                  className="p-2 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-slate-300" 
                  title="Khung hình chuẩn"
                >
                  <Maximize size={18} />
                </button>

                <button 
                  onClick={toggleFullscreen} 
                  className="p-2 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-slate-300" 
                  title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>

              <div className="w-px h-6 bg-slate-700/80 my-auto mx-0.5" />

              {/* Thao tác đối tượng: Duplicate / Delete */}
              <div className="flex items-center space-x-0.5 bg-slate-800/60 rounded-xl p-0.5 border border-slate-700/50">
                <button 
                  onClick={handleDuplicateSelected} 
                  className="p-2 hover:bg-slate-700 hover:text-indigo-400 rounded-lg transition-colors text-slate-300" 
                  title="Sao chép đối tượng đang chọn (Ctrl+C / Ctrl+D)"
                >
                  <Copy size={18} />
                </button>
                <button 
                  onClick={handleDeleteSelected} 
                  className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors text-slate-300" 
                  title="Xóa đối tượng đang chọn (Delete)"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Member List Panel */}
            <div className={`absolute top-4 right-4 bg-slate-800/90 backdrop-blur border border-slate-600 rounded-lg shadow-xl flex flex-col transition-all duration-300 ${isMemberPanelOpen ? 'w-64 max-h-[calc(100%-2rem)]' : 'w-auto'}`}>
              <div className="flex items-center justify-between p-3 border-b border-slate-700 cursor-pointer" onClick={() => setIsMemberPanelOpen(!isMemberPanelOpen)}>
                <div className="flex items-center space-x-2 text-white font-medium">
                  <Users size={18} />
                  {isMemberPanelOpen && <span>Danh sách Team</span>}
                </div>
                <button className="text-slate-400 hover:text-white transition-colors">
                  {isMemberPanelOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
              
              {isMemberPanelOpen && (
                <div className="overflow-y-auto p-2 space-y-4">
                  {activeAreas.map(area => {
                    const isExpanded = expandedGroups[area.id] !== false;
                    const hasSelectedTeam = area.teams.some(t => t.id === selectedTeamId);
                    
                    return (
                      <div key={area.id} className={`rounded-lg border transition-all ${hasSelectedTeam ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'bg-slate-850/40 border-slate-700/50'} overflow-hidden`}>
                        {/* Header for Accordion */}
                        <button 
                          onClick={() => toggleGroup(area.id)}
                          className={`w-full flex items-center justify-between p-2.5 text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors uppercase tracking-wider ${hasSelectedTeam ? 'text-indigo-400' : ''}`}
                        >
                          <span className="truncate">{area.name}</span>
                          {isExpanded ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                        </button>
                        
                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-2 space-y-2 border-t border-slate-700/30">
                            {area.teams.map(team => (
                              <div 
                                key={team.id} 
                                className={`rounded p-2 cursor-grab active:cursor-grabbing border transition-colors ${selectedTeamId === team.id ? 'bg-slate-700 border-indigo-500 opacity-100 shadow-lg shadow-indigo-500/20' : selectedTeamId ? 'bg-slate-700/30 border-transparent opacity-40 hover:opacity-80' : 'bg-slate-700/50 border-transparent hover:border-indigo-500/50 opacity-100'}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    source: 'team_list',
                                    type: `team_${team.id}`,
                                  }));
                                }}
                              >
                                <div className="text-sm font-medium text-indigo-300 mb-1">{team.name}</div>
                                <div className="space-y-1">
                                  {team.members.length === 0 ? (
                                    <div className="text-xs text-slate-500 italic">Chưa có thành viên</div>
                                  ) : (
                                    team.members.map(member => (
                                      <div key={member.id} className="text-sm text-slate-200 flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="truncate">{member.ingameName?.trim() || member.name}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeAreas.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-4">Không có dữ liệu team</div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Bottom and Right Scrollbars for zoomed canvas navigation */}
            {zoom > 1 && (
              <>
                {/* Horizontal Scrollbar */}
                <div 
                  ref={hTrackRef}
                  onMouseDown={handleHorizontalMouseDown}
                  className="absolute bottom-2 left-20 right-4 h-2 bg-slate-800/40 hover:bg-slate-800/60 rounded-full backdrop-blur-sm z-20 cursor-pointer transition-colors group"
                  title="Kéo để cuộn ngang"
                >
                  <div 
                    className="h-full rounded-full bg-slate-500/50 group-hover:bg-indigo-500/80 active:bg-indigo-500 transition-colors"
                    style={{
                      width: `${thumbWidthPct}%`,
                      left: `${leftPct}%`,
                      position: 'absolute'
                    }}
                  />
                </div>

                {/* Vertical Scrollbar */}
                <div 
                  ref={vTrackRef}
                  onMouseDown={handleVerticalMouseDown}
                  className="absolute top-4 bottom-12 right-2 w-2 bg-slate-800/40 hover:bg-slate-800/60 rounded-full backdrop-blur-sm z-20 cursor-pointer transition-colors group"
                  title="Kéo để cuộn dọc"
                >
                  <div 
                    className="w-full rounded-full bg-slate-500/50 group-hover:bg-indigo-500/80 active:bg-indigo-500 transition-colors"
                    style={{
                      height: `${thumbHeightPct}%`,
                      top: `${topPct}%`,
                      position: 'absolute'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Toolbar */}
          {isRightPanelOpen && (
            <div className="w-80 max-w-[85vw] sm:max-w-xs bg-slate-800 border-l border-slate-700 flex flex-col z-20 flex-shrink-0 h-full shadow-2xl relative animate-in slide-in-from-right duration-200">
              {/* Header của Bảng chức năng */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/95 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
                  <SlidersHorizontal size={16} className="text-indigo-400" />
                  <span>Bảng chức năng</span>
                </div>
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
                  title="Thu gọn bảng công cụ"
                >
                  <PanelRightClose size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-700/60">
                {/* Drawing Tools Accordion */}
            <div className="border-b border-slate-700">
              <button
                onClick={() => setRightPanelExpanded(p => ({ ...p, drawing: !p.drawing }))}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors uppercase tracking-wider"
              >
                <span>Công cụ vẽ</span>
                {rightPanelExpanded.drawing ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>
              
              {rightPanelExpanded.drawing && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTool('select')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'select' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Chọn & Di chuyển"
                    >
                      <MousePointer size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('pen')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Bút vẽ"
                    >
                      <Pen size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('highlighter')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'highlighter' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Bút đánh dấu"
                    >
                      <Highlighter size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('eraser')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Tẩy"
                    >
                      <Eraser size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('arrow')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'arrow' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Mũi tên"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('rect')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'rect' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Hình chữ nhật"
                    >
                      <Square size={18} />
                    </button>
                    <button
                      onClick={() => toggleTool('oval')}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'oval' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      title="Hình elip"
                    >
                      <CircleIcon size={18} />
                    </button>
                  </div>

                  {/* Speech Bubbles & Text annotations */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Chú thích & Văn bản
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => toggleTool('speech_bubble_rect')}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'speech_bubble_rect' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        title="Chú thích hình hộp"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button
                        onClick={() => toggleTool('speech_bubble_oval')}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'speech_bubble_oval' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        title="Chú thích bong bóng oval"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={() => toggleTool('textbox')}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${tool === 'textbox' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        title="Hộp văn bản"
                      >
                        <Type size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {(tool === 'pen' || tool === 'highlighter' || tool === 'arrow' || tool === 'rect' || tool === 'oval' || tool === 'speech_bubble_rect' || tool === 'speech_bubble_oval' || tool === 'textbox') && (
                    <div className="mt-3 flex items-center space-x-2">
                      <input
                        type="color"
                        value={drawingColor}
                        onChange={(e) => setDrawingColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent p-0"
                      />
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={drawingWidth}
                        onChange={(e) => setDrawingWidth(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Text Formatting Controller */}
            {selectedTextObj && (
              <div className="border-b border-slate-700 bg-slate-800/60 animate-in fade-in duration-200" key={`text-format-${textUpdateCount}`}>
                <div className="p-4 border-l-4 border-emerald-500">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Định dạng văn bản</span>
                    <button 
                      onClick={() => {
                        const canvas = fabricCanvasRef.current;
                        if (canvas) {
                          canvas.discardActiveObject();
                          canvas.renderAll();
                        }
                        setSelectedTextObj(null);
                        setSelectedBubble(null);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Bỏ chọn"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Text Color */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Màu chữ</div>
                      <div className="flex flex-wrap gap-2">
                        {['#ffffff', '#000000', '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              selectedTextObj.set({ fill: color });
                              selectedTextObj.dirty = true;
                              fabricCanvasRef.current?.requestRenderAll();
                              saveStateToHistory();
                              setTextUpdateCount(prev => prev + 1);
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedTextObj.fill === color ? 'border-emerald-400 scale-110 shadow-lg' : 'border-slate-500 hover:scale-105 shadow'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Text Align */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Căn lề</div>
                      <div className="flex space-x-2">
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            onClick={() => {
                              selectedTextObj.set({ textAlign: align });
                              selectedTextObj.dirty = true;
                              fabricCanvasRef.current?.requestRenderAll();
                              saveStateToHistory();
                              setTextUpdateCount(prev => prev + 1);
                            }}
                            className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${selectedTextObj.textAlign === align ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {align === 'left' && <><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></>}
                              {align === 'center' && <><line x1="3" y1="6" x2="21" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></>}
                              {align === 'right' && <><line x1="3" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></>}
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Speech Bubble Tail Controller */}
            {selectedBubble && (
              <div className="border-b border-slate-700 bg-slate-800/60 animate-in fade-in duration-200">
                <div className="p-4 border-l-4 border-indigo-500">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Cấu hình mũi tên chỉ</span>
                    <button 
                      onClick={() => {
                        const canvas = fabricCanvasRef.current;
                        if (canvas) {
                          canvas.discardActiveObject();
                          canvas.renderAll();
                        }
                        setSelectedBubble(null);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Bỏ chọn"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Tail Side Choice */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Hướng mũi tên</label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                          <button
                            key={side}
                            onClick={() => recreateSpeechBubble(selectedBubble, { tailSide: side })}
                            className={`py-1 rounded text-xs font-semibold capitalize transition-colors ${selectedBubble.tailSide === side ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                          >
                            {side === 'top' ? 'Trên' : side === 'bottom' ? 'Dưới' : side === 'left' ? 'Trái' : 'Phải'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tail Offset Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Vị trí đuôi</span>
                        <span>{Math.round(selectedBubble.tailOffset || 0)}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max={selectedBubble.tailSide === 'left' || selectedBubble.tailSide === 'right' ? Math.round(selectedBubble.bubbleHeight || 100) - 10 : Math.round(selectedBubble.bubbleWidth || 160) - 10}
                        value={Math.round(selectedBubble.tailOffset || 0)}
                        onChange={(e) => recreateSpeechBubble(selectedBubble, { tailOffset: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    {/* Tail Width Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Độ rộng mũi tên</span>
                        <span>{selectedBubble.tailWidth || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="80"
                        value={selectedBubble.tailWidth || 0}
                        onChange={(e) => recreateSpeechBubble(selectedBubble, { tailWidth: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    {/* Tail Height Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Độ dài mũi tên</span>
                        <span>{selectedBubble.tailHeight || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={selectedBubble.tailHeight || 0}
                        onChange={(e) => recreateSpeechBubble(selectedBubble, { tailHeight: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stickers Accordion */}
            <div className="border-b border-slate-700">
              <button
                onClick={() => setRightPanelExpanded(p => ({ ...p, stickers: !p.stickers }))}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors uppercase tracking-wider"
              >
                <span>Stickers</span>
                {rightPanelExpanded.stickers ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>
              
              {rightPanelExpanded.stickers && (
                <div className="p-4 pt-0">
                  {/* Sticker Tabs */}
                  <div className="flex bg-slate-900/80 p-1 rounded-lg mb-3 border border-slate-700/60 text-[11px] gap-0.5">
                    <button
                      onClick={() => setStickerTab('all')}
                      className={`flex-1 py-1 px-1 rounded-md font-medium text-center transition-colors ${
                        stickerTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setStickerTab('roles')}
                      className={`flex-1 py-1 px-1 rounded-md font-medium text-center transition-colors ${
                        stickerTab === 'roles' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Roles
                    </button>
                    <button
                      onClick={() => setStickerTab('default')}
                      className={`flex-1 py-1 px-1 rounded-md font-medium text-center transition-colors ${
                        stickerTab === 'default' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Cơ bản
                    </button>
                    <button
                      onClick={() => setStickerTab('teams')}
                      className={`flex-1 py-1 px-1 rounded-md font-medium text-center transition-colors ${
                        stickerTab === 'teams' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Đội
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {displayedStickers.map((s) => (
                      <button
                        key={s.type}
                        onClick={() => {
                          handleAddSticker(s.type, s.label, s.color, undefined, undefined, s.name, s.icon);
                        }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({
                            source: 'sticker_list',
                            type: s.type,
                          }));
                        }}
                        className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl transition-all duration-200 text-center cursor-grab active:cursor-grabbing space-y-0.5 shadow-sm group"
                        title={s.name}
                      >
                        <div className="transform group-hover:scale-105 transition-transform duration-200">
                          <StickerIcon sticker={s} size={42} />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate w-full px-0.5 mt-0.5 transition-colors">{s.name}</span>
                      </button>
                    ))}
                    {displayedStickers.length === 0 && (
                      <div className="col-span-3 text-center py-4 text-xs text-slate-500">
                        Không có sticker nào
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* State Management Accordion */}
            <div className="flex-1 flex flex-col min-h-0">
              <button
                onClick={() => setRightPanelExpanded(p => ({ ...p, status: !p.status }))}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors uppercase tracking-wider flex-shrink-0"
              >
                <span>Trạng thái</span>
                {rightPanelExpanded.status ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>
              
              {rightPanelExpanded.status && (
                <div className="p-4 pt-0 flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {Object.values(tactics).sort((a: TacticState, b: TacticState) => b.timestamp - a.timestamp).map((tactic: TacticState) => (
                      <div
                        key={tactic.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${activeTacticId === tactic.id ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-700/50 border-transparent hover:bg-slate-700'}`}
                      >
                        <button
                          onClick={() => handleLoadState(tactic.id)}
                          className="flex-1 flex flex-col items-start text-left min-w-0"
                        >
                          <span className={`font-medium text-sm truncate w-full ${activeTacticId === tactic.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {tactic.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(tactic.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </button>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => startRename(tactic.id)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Đổi tên"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteState(tactic.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-600 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(tactics).length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm">
                        Chưa có trạng thái nào được lưu.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {editingTextObject && (
        <div 
          className="fixed inset-0 z-[100] bg-black/10"
          onClick={() => {
            if (editingTextObject) {
              const canvas = fabricCanvasRef.current;
              if (canvas) {
                editingTextObject.textElement.set({ text: editingTextObject.value });
                editingTextObject.fabricObject.dirty = true;
                canvas.renderAll();
                saveStateToHistory();
              }
              setEditingTextObject(null);
            }
          }}
        >
          <textarea
            value={editingTextObject.value}
            onChange={(e) => {
              setEditingTextObject(prev => prev ? { ...prev, value: e.target.value } : null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const canvas = fabricCanvasRef.current;
                if (canvas) {
                  editingTextObject.textElement.set({ text: editingTextObject.value });
                  editingTextObject.fabricObject.dirty = true;
                  canvas.renderAll();
                  saveStateToHistory();
                }
                setEditingTextObject(null);
              } else if (e.key === 'Escape') {
                setEditingTextObject(null);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{
              position: 'fixed',
              left: `${editingTextObject.x}px`,
              top: `${editingTextObject.y}px`,
              width: `${Math.max(120, editingTextObject.width)}px`,
              height: `${Math.max(60, editingTextObject.height)}px`,
              fontFamily: 'Inter, sans-serif',
              fontSize: `${Math.max(12, 14 * zoom)}px`,
              lineHeight: '1.4',
              color: '#0f172a',
              background: '#f8fafc',
              border: '2px solid #6366f1',
              borderRadius: '6px',
              padding: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              outline: 'none',
              resize: 'both',
              zIndex: 101,
            }}
          />
        </div>
      )}
    </div>
  );
}
