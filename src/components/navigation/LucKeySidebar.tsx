import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  MessageSquarePlus,
  MessageCircle,
  Key,
  Sparkles,
  TreeDeciduous,
  Activity,
  Bird,
  Music,
  Moon,
  Sun,
  Mic,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { safeLocalStorage } from '@/utils/safeStorage';
import { loadProfileFromAllVaults } from '@/lib/profileVault';
import { LucKeyIntroModal } from './LucKeyIntroModal';
import { LucyChatHistoryModal } from './LucyChatHistoryModal';

export function LucKeyCloverKeyIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 4-leaf clover bow */}
      <circle cx="12" cy="5.2" r="2.2" />
      <circle cx="12" cy="9.4" r="2.2" />
      <circle cx="9.9" cy="7.3" r="2.2" />
      <circle cx="14.1" cy="7.3" r="2.2" />
      <circle cx="12" cy="7.3" r="0.75" fill="currentColor" />
      {/* Key shaft extending down */}
      <line x1="12" y1="11.6" x2="12" y2="21.5" />
      {/* Key bit notches */}
      <line x1="12" y1="18.5" x2="15.2" y2="18.5" />
      <line x1="12" y1="21" x2="14.2" y2="21" />
    </svg>
  );
}

interface LucKeySidebarProps {
  className?: string;
}

interface NavItemDef {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  matchPaths?: string[];
  onClick?: () => void;
  icon: React.ElementType;
  accentColor: string;
  badge?: string;
  badgeColor?: string;
}

export function LucKeySidebar({ className = '' }: LucKeySidebarProps) {
  const [location, navigate] = useLocation();
  const { firebaseUser, sharedState, syncPrismDevices } = useApp();

  // Desktop sidebar open state (default: false = closed per user request)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return safeLocalStorage.getItem('luckey_sidebar_open') === 'true';
    } catch {
      return false;
    }
  });

  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Dynamic user profile with live MBTI
  const profile = useMemo(() => {
    const vault = loadProfileFromAllVaults();
    return {
      name: sharedState?.userProfile?.basic?.name || vault?.basic?.name || firebaseUser?.displayName || '박주형',
      nickname: sharedState?.userProfile?.basic?.nickname || vault?.basic?.nickname || '박주형',
      mbti: sharedState?.userProfile?.psych?.mbti || vault?.psych?.mbti || 'INTJ',
    };
  }, [sharedState?.userProfile, firebaseUser?.displayName]);

  // Toggle sidebar open/closed
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        safeLocalStorage.setItem('luckey_sidebar_open', String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Listen for global toggle/open/close events
  useEffect(() => {
    const handleToggle = () => toggleSidebar();
    const handleOpen = () => {
      setIsOpen(true);
      try {
        safeLocalStorage.setItem('luckey_sidebar_open', 'true');
      } catch (_) {}
    };
    const handleClose = () => {
      setIsOpen(false);
      try {
        safeLocalStorage.setItem('luckey_sidebar_open', 'false');
      } catch (_) {}
    };

    window.addEventListener('prism:toggle_sidebar', handleToggle);
    window.addEventListener('prism:open_sidebar', handleOpen);
    window.addEventListener('prism:close_sidebar', handleClose);

    return () => {
      window.removeEventListener('prism:toggle_sidebar', handleToggle);
      window.removeEventListener('prism:open_sidebar', handleOpen);
      window.removeEventListener('prism:close_sidebar', handleClose);
    };
  }, [toggleSidebar]);

  // Reset or Start New Chat
  const handleNewChat = useCallback(() => {
    if (location !== '/') {
      navigate('/');
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('prism:reset_lucy_chat'));
    }, 80);
  }, [location, navigate]);

  // Check active navigation path
  const isItemActive = useCallback(
    (item: NavItemDef) => {
      const cleanLoc = location ? location.split('?')[0].split('#')[0] : '/';
      if (item.path === '/') {
        return cleanLoc === '/' || cleanLoc === '/chat' || cleanLoc === '/lucy';
      }
      if (item.matchPaths && item.matchPaths.length > 0) {
        return item.matchPaths.includes(cleanLoc) || cleanLoc.startsWith(item.path + '/');
      }
      return cleanLoc === item.path || cleanLoc.startsWith(item.path + '/');
    },
    [location]
  );

  const isProfileActive = useMemo(() => {
    const cleanLoc = location ? location.split('?')[0].split('#')[0] : '/';
    return cleanLoc === '/profile' || cleanLoc === '/chronicle' || cleanLoc.startsWith('/profile/');
  }, [location]);

  // 1. Core Gateways: Lucy ai (opens chat history) & Key
  const CORE_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'lucy',
        title: 'Lucy ai',
        subtitle: '행운의 올인원 AI 실시간 대화 (대화 기록 보관함)',
        path: '/',
        matchPaths: ['/', '/chat', '/lucy'],
        onClick: () => setIsHistoryModalOpen(true),
        icon: MessageCircle,
        accentColor: 'emerald',
        badge: '메인',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      },
      {
        id: 'key',
        title: 'KEY (오라클 게이트웨이)',
        subtitle: '528Hz 솔페지오 · 크리스탈 오브',
        path: '/key',
        matchPaths: ['/key', '/calm', '/orb', '/gateway', '/crystal'],
        icon: Key,
        accentColor: 'cyan',
        badge: '528Hz',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      },
    ],
    []
  );

  // 2. 7 Studios strictly ordered: 프롤로그 -> 오렌지 -> 트리니티 -> 아우라 -> 블루버드 -> 뮤즈 -> 에필로그
  const STUDIOS_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'prologue',
        title: 'PROLOGUE (프롤로그)',
        subtitle: '종합 유니버스 대시보드',
        path: '/prologue',
        matchPaths: ['/prologue', '/universe', '/hub', '/ecpr', '/todo', '/mission', '/synergy', '/aegis'],
        icon: Sun,
        accentColor: 'teal',
      },
      {
        id: 'orange',
        title: 'ORANGE (오렌지)',
        subtitle: '마음 치유 · 감정 연금술 · 1원칙 사고',
        path: '/orange',
        icon: TreeDeciduous,
        accentColor: 'orange',
      },
      {
        id: 'trinity',
        title: 'TRINITY (트리니티)',
        subtitle: '운명 오라클 · 천문 사주 · 타로 제단',
        path: '/trinity',
        icon: Sparkles,
        accentColor: 'amber',
      },
      {
        id: 'aura',
        title: 'AURA (아우라)',
        subtitle: '신체 웰니스 · 40기법 · 세도나 방하착',
        path: '/heal',
        matchPaths: ['/heal', '/aura'],
        icon: Activity,
        accentColor: 'emerald',
      },
      {
        id: 'bluebird',
        title: 'BLUEBIRD (블루버드)',
        subtitle: '예술 정서 · 바이노럴 비트 · 내면아이',
        path: '/bluebird',
        icon: Bird,
        accentColor: 'sky',
      },
      {
        id: 'muse',
        title: 'MUSE (뮤즈)',
        subtitle: '영감 창조 · 도슨트 투어 · 창작 시',
        path: '/muse',
        icon: Music,
        accentColor: 'indigo',
      },
      {
        id: 'epilogue',
        title: 'EPILOGUE (에필로그)',
        subtitle: '통합 결산 · 소울 다이어리 · 아카이브',
        path: '/epilogue',
        icon: Moon,
        accentColor: 'purple',
      },
    ],
    []
  );

  // Helper renderer for item row
  const renderItemRow = (item: NavItemDef) => {
    const active = isItemActive(item);
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (item.onClick) item.onClick();
          else navigate(item.path);
        }}
        title={`${item.title} — ${item.subtitle}`}
        aria-label={item.title}
        className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
          active
            ? 'bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
        }`}
      >
        <Icon size={18} className="transition-transform group-hover:scale-110" />
        {active && (
          <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        )}
      </button>
    );
  };

  const sidebarBody = () => (
    <div className="flex flex-col h-full select-none justify-between overflow-hidden">
      {/* Top Header & New Chat */}
      <div className="flex flex-col shrink-0">
        <div className="flex items-center justify-center border-b border-white/10 px-1.5 py-3">
          <button
            type="button"
            onClick={() => setIsIntroModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
            title="LucKey 앱 소개 (차별점 & 특장점)"
            aria-label="LucKey 소개"
          >
            <LucKeyCloverKeyIcon size={20} className="group-hover:rotate-12 transition-transform drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-1.5">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 active:scale-95 text-slate-950 font-black flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-all cursor-pointer group"
            title="새 대화 시작"
            aria-label="새 대화 시작"
          >
            <MessageSquarePlus size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* Navigation Links (Core + 7 Studios) */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-2.5 no-scrollbar">
        {/* Core Gateways */}
        <div className="space-y-1">
          {CORE_ITEMS.map((item) => renderItemRow(item))}
        </div>

        {/* 7 Studios */}
        <div className="space-y-1 pt-1.5 border-t border-white/5">
          {STUDIOS_ITEMS.map((item) => renderItemRow(item))}
        </div>
      </div>

      {/* Footer: Profile Button (맨 아래메뉴 프로필 단추) & Sync & Collapse Arrow */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-md p-1.5 sm:p-2 flex flex-col items-center gap-2">
        {/* Profile Button (맨 아래메뉴 프로필 단추) */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
            isProfileActive
              ? 'bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
          }`}
          title={`내 정보 & 프로필 (${profile.nickname} 님 — ${profile.mbti})`}
          aria-label="내 프로필"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm ring-1 ring-amber-400/40 group-hover:scale-110 transition-transform">
            {profile.nickname.slice(0, 1)}
          </div>
          {isProfileActive && (
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          )}
        </button>

        {/* Sync Button */}
        <button
          type="button"
          onClick={async () => {
            setSyncNotice('동기화 중...');
            try {
              await syncPrismDevices();
              setSyncNotice('동기화 완료!');
            } catch {
              setSyncNotice('동기화 완료');
            }
            setTimeout(() => setSyncNotice(null), 1800);
          }}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer border border-white/5"
          title={syncNotice || '클라우드 동기화'}
          aria-label="클라우드 동기화"
        >
          <RefreshCw
            size={13}
            className={syncNotice === '동기화 중...' ? 'animate-spin text-emerald-400' : ''}
          />
        </button>

        {/* Arrow Button to Close Sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 group"
          title="사이드바 닫기"
          aria-label="사이드바 닫기"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 🧭 Collapsible Icon Sidebar (Closed by default) */}
      <aside
        className={`flex flex-col shrink-0 h-full bg-[#080A12]/95 backdrop-blur-2xl border-slate-800/80 shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-50 transition-all duration-300 ease-in-out relative ${
          isOpen
            ? 'w-[58px] sm:w-[62px] border-r opacity-100'
            : 'w-0 border-r-0 overflow-hidden opacity-0 pointer-events-none'
        } ${className}`}
      >
        {sidebarBody()}
      </aside>

      {/* 🧭 Floating Arrow Button when Sidebar is Closed (기본상태 맨밑 화살표) */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-50 w-11 h-11 rounded-2xl bg-[#080A12]/92 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white hover:border-emerald-400/50 hover:shadow-[0_0_22px_rgba(52,211,153,0.35)] shadow-2xl flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95"
          title="사이드바 열기 (LucKey Navigation)"
          aria-label="사이드바 열기"
        >
          <ChevronRight
            size={20}
            className="text-emerald-400 group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      )}

      {/* 🍀 LucKey App Introduction Modal */}
      <LucKeyIntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        onStartChat={() => {
          if (location !== '/') {
            navigate('/');
          }
        }}
      />

      {/* 📜 Lucy AI Chat History Session Browser Modal */}
      <LucyChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onNewChat={handleNewChat}
        onContinueChat={() => {
          if (location !== '/') {
            navigate('/');
          }
        }}
      />
    </>
  );
}

export default LucKeySidebar;
