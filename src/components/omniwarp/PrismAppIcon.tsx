import React from 'react';
import {
  Sun,
  TreeDeciduous,
  Sparkles,
  Activity,
  Bird,
  Music,
  Moon,
  Zap,
  Compass,
  AlertCircle,
  MessageCircle,
  Eye,
  Triangle,
  LucideProps,
} from 'lucide-react';
import { CrystalOrbIcon } from '@/components/icons/CrystalOrbIcon';

export interface PrismAppIconProps {
  nameOrId?: string;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * 🌌 PrismAppIcon
 * 프리즘 메인(Prologue Hub & BottomNav)에서 사용하는 정통 Lucide 벡터 아이콘 통합 맵핑 컴포넌트.
 * 이모티콘(이모지)을 완전 배제하고, 프리즘 메인 디자인 시스템의 순수 벡터 아이콘을 렌더링합니다.
 */
export function PrismAppIcon({
  nameOrId = '',
  size = 20,
  className = '',
  color,
  strokeWidth = 1.8,
}: PrismAppIconProps) {
  const normalized = (nameOrId || '').toLowerCase().trim();

  // 1. Crystal Orb
  if (
    normalized === 'orb' ||
    normalized === 'crystal' ||
    normalized === '/orb' ||
    normalized === 'crystalorb' ||
    normalized.includes('오브') ||
    normalized === '🔮'
  ) {
    return <CrystalOrbIcon size={size} className={className} />;
  }

  // 2. Hub / Prologue
  if (
    normalized === 'hub' ||
    normalized === 'prologue' ||
    normalized === '/' ||
    normalized === 'universe' ||
    normalized.includes('프롤로그') ||
    normalized.includes('허브') ||
    normalized === '🏛️'
  ) {
    return (
      <Sun
        size={size}
        className={className}
        color={color || '#ef4444'} // 빨강 (Red)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 3. Orange
  if (
    normalized === 'orange' ||
    normalized === '/orange' ||
    normalized.includes('오렌지') ||
    normalized.includes('성찰') ||
    normalized.includes('소원') ||
    normalized === '🍊'
  ) {
    return (
      <TreeDeciduous
        size={size}
        className={className}
        color={color || '#f97316'} // 주황 (Orange)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 4. Trinity
  if (
    normalized === 'trinity' ||
    normalized === '/trinity' ||
    normalized === '/oracle' ||
    normalized.includes('트리니티') ||
    normalized.includes('오라클') ||
    normalized.includes('타로') ||
    normalized.includes('사주') ||
    normalized === '🔺'
  ) {
    return (
      <Sparkles
        size={size}
        className={className}
        color={color || '#eab308'} // 노랑 (Yellow)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 5. Aura / Heal
  if (
    normalized === 'heal' ||
    normalized === 'aura' ||
    normalized === '/heal' ||
    normalized.includes('아우라') ||
    normalized.includes('치유') ||
    normalized.includes('호흡')
  ) {
    return (
      <Activity
        size={size}
        className={className}
        color={color || '#10b981'} // 초록 (Green)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 6. Bluebird
  if (
    normalized === 'bluebird' ||
    normalized === '/bluebird' ||
    normalized.includes('블루버드') ||
    normalized.includes('파랑새') ||
    normalized.includes('메신저') ||
    normalized === '🐦'
  ) {
    return (
      <Bird
        size={size}
        className={className}
        color={color || '#0ea5e9'} // 파랑 (Blue)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 7. Muse
  if (
    normalized === 'muse' ||
    normalized === '/muse' ||
    normalized.includes('뮤즈') ||
    normalized.includes('예술') ||
    normalized.includes('영감') ||
    normalized === '🎵'
  ) {
    return (
      <Music
        size={size}
        className={className}
        color={color || '#4f46e5'} // 남색 (Indigo)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 8. Epilogue
  if (
    normalized === 'epilogue' ||
    normalized === '/epilogue' ||
    normalized.includes('에필로그') ||
    normalized.includes('서재') ||
    normalized.includes('회고') ||
    normalized === '📜'
  ) {
    return (
      <Moon
        size={size}
        className={className}
        color={color || '#a855f7'} // 보라 (Violet)
        strokeWidth={strokeWidth}
      />
    );
  }

  // 9. Lucy Chat (원래 루시 버튼 아이콘: 별빛 스파클 Sparkles)
  if (
    normalized === 'lucy' ||
    normalized === 'chat' ||
    normalized === '/chat' ||
    normalized.includes('루시') ||
    normalized === '💬' ||
    normalized === '✨'
  ) {
    return (
      <Sparkles
        size={size}
        className={className}
        color={color || '#fde68a'} // Warm amber-200
        strokeWidth={strokeWidth}
      />
    );
  }

  // 10. Cosmological Phases
  if (normalized === 'whitehole' || normalized === '☀️') {
    return (
      <Sparkles
        size={size}
        className={className}
        color={color || '#fde68a'}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (
    normalized === 'mirrorhole' ||
    normalized === '🪞' ||
    normalized === 'mirror' ||
    normalized === 'prism' ||
    normalized === 'prismhome'
  ) {
    return (
      <Triangle
        size={size}
        className={className}
        color={color || '#38bdf8'}
        fill="rgba(56, 189, 248, 0.28)"
        strokeWidth={strokeWidth || 2.2}
      />
    );
  }

  if (normalized === 'blackhole' || normalized === '🕳️') {
    return (
      <CrystalOrbIcon
        size={size}
        className={className}
      />
    );
  }

  if (normalized === 'wormhole' || normalized === '🌀') {
    return (
      <Zap
        size={size}
        className={className}
        color={color || '#c084fc'}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (normalized === 'event_horizon' || normalized === '🌌') {
    return (
      <Compass
        size={size}
        className={className}
        color={color || '#a855f7'}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (normalized === 'aborted' || normalized === 'cancel' || normalized === '🛑') {
    return (
      <AlertCircle
        size={size}
        className={className}
        color={color || '#ef4444'}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Fallback default
  return (
    <Sparkles
      size={size}
      className={className}
      color={color || '#38bdf8'}
      strokeWidth={strokeWidth}
    />
  );
}
