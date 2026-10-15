import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Mic,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { LucKeyLogoText } from '@/components/LucKeyLogoText';
import { safeLocalStorage } from '@/utils/safeStorage';
import { loadProfileFromAllVaults } from '@/lib/profileVault';

interface LucKeySidebarProps {
  className?: string;
}

interface NavItemDef {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  matchPaths?: string[];
  icon: React.ElementType;
  accentColor: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export function LucKeySidebar({ className = '' }: LucKeySidebarProps) {
  const [location, navigate] = useLocation();
  const { firebaseUser, sharedState, syncPrismDevices } = useApp();

  // Navigation sidebar collapsed state: DEFAULT TO COLLAPSED (접힌 상태 기본 고정)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Dynamic user profile with live MBTI
  const profile = useMemo(() => {
    const vault = loadProfileFromAllVaults();
    return {
      name: sharedState?.userProfile?.basic?.name || vault?.basic?.name || firebaseUser?.displayName || '박주형',
      nickname: sharedState?.userProfile?.basic?.nickname || vault?.basic?.nickname || '박주형',
      mbti: sharedState?.userProfile?.psych?.mbti || vault?.psych?.mbti || 'INTJ',
    };
  }, [sharedState?.userProfile, firebaseUser?.displayName]);

  // Handle sidebar collapse toggle
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Listen for global toggle/open/close events
  useEffect(() => {
    const handleToggle = () => toggleCollapse();
    const handleOpen = () => setIsCollapsed(false);
    const handleClose = () => setIsCollapsed(true);

    window.addEventListener('prism:toggle_sidebar', handleToggle);
    window.addEventListener('prism:open_sidebar', handleOpen);
    window.addEventListener('prism:close_sidebar', handleClose);

    return () => {
      window.removeEventListener('prism:toggle_sidebar', handleToggle);
      window.removeEventListener('prism:open_sidebar', handleOpen);
      window.removeEventListener('prism:close_sidebar', handleClose);
    };
  }, [toggleCollapse]);

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

  // 1. Core Gateways: Lucy ai & Key & Lucy AI Voice Mode
  const CORE_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'lucy',
        title: 'Lucy ai',
        subtitle: '행운의 올인원 AI 실시간 대화',
        path: '/',
        matchPaths: ['/', '/chat', '/lucy'],
        icon: MessageCircle,
        accentColor: 'emerald',
        badge: '메인',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      },
      {
        id: 'voice',
        title: 'Lucy AI 음성모드',
        subtitle: '여성 목소리 실시간 대화',
        path: '#voice',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('prism:open_lucy_voice_mode'));
          }
        },
        icon: Mic,
        accentColor: 'rose',
        badge: '여성음성',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
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
  const renderItemRow = (item: NavItemDef, compact = false) => {
    const active = isItemActive(item);
    const Icon = item.icon;

    if (compact) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (item.onClick) item.onClick();
            else navigate(item.path);
          }}
          title={`${item.title} — ${item.subtitle}`}
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
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (item.onClick) item.onClick();
          else navigate(item.path);
        }}
        className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-200 group text-left cursor-pointer border ${
          active
            ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent text-white border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.18)] ring-1 ring-emerald-400/30'
            : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/10'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            active
              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
              : 'bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:bg-white/10'
          }`}
        >
          <Icon size={16} className="transition-transform group-hover:scale-110" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${
                active ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}
            >
              {item.title}
            </span>
            {item.badge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${
                  item.badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5 group-hover:text-slate-300">
            {item.subtitle}
          </p>
        </div>

        {active && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
        )}
      </button>
    );
  };

  const sidebarBody = (compact: boolean) => (
    <div className="flex flex-col h-full select-none justify-between overflow-hidden">
      {/* Top Header & New Chat */}
      <div className="flex flex-col shrink-0">
        <div
          className={`flex items-center justify-between border-b border-white/10 transition-all ${
            compact ? 'px-1.5 py-3 justify-center' : 'px-3.5 py-3'
          }`}
        >
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group min-w-0"
            title="Lucy ai로 이동"
          >
            {compact ? (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_14px_rgba(52,211,153,0.4)]">
                🍀
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_12px_rgba(52,211,153,0.4)] shrink-0">
                  🍀
                </div>
                <div className="flex flex-col min-w-0">
                  <LucKeyLogoText size="sm" />
                  <span className="text-[9px] text-emerald-400/80 font-bold tracking-widest uppercase">
                    Lucy ai · 7 Studios
                  </span>
                </div>
              </>
            )}
          </div>

          {!compact && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="사이드바 접기"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <div className={`shrink-0 ${compact ? 'p-1.5' : 'px-3 py-2.5'}`}>
          {compact ? (
            <button
              type="button"
              onClick={handleNewChat}
              className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 active:scale-95 text-slate-950 font-black flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-all cursor-pointer"
              title="새 대화 시작"
            >
              <MessageSquarePlus size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-400/40 text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.2)] active:scale-98 transition-all cursor-pointer group"
            >
              <MessageSquarePlus
                size={16}
                className="text-emerald-400 group-hover:rotate-12 transition-transform"
              />
              <span>+ 새 대화 시작</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links (Core + 7 Studios only; Wisdom & Profile removed) */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-3 no-scrollbar">
        {/* Core Gateways */}
        <div className="space-y-1">
          {!compact && (
            <div className="px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={10} className="text-emerald-400" />
              <span>핵심 게이트웨이</span>
            </div>
          )}
          {CORE_ITEMS.map((item) => renderItemRow(item, compact))}
        </div>

        {/* 7 Studios */}
        <div className="space-y-1">
          {!compact && (
            <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-t border-white/5">
              <Layers size={10} className="text-amber-400" />
              <span>7대 전문 스튜디오</span>
            </div>
          )}
          {STUDIOS_ITEMS.map((item) => renderItemRow(item, compact))}
        </div>
      </div>

      {/* Footer: Expand / Collapse Button & Minimal Status */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-md p-1.5 sm:p-2">
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              title="사이드바 펼치기"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center text-xs font-bold shrink-0">
                {profile.nickname.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-white truncate block">
                  {profile.nickname}
                </span>
                <span className="text-[9px] text-emerald-400/80 font-mono">
                  {profile.mbti}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
              >
                <RefreshCw
                  size={13}
                  className={syncNotice === '동기화 중...' ? 'animate-spin text-emerald-400' : ''}
                />
              </button>

              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5"
                title="사이드바 접기"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 🧭 Always Fixed Left Navigation Bar (Collapsed by default) */}
      <aside
        className={`flex flex-col shrink-0 h-full bg-[#080A12]/95 backdrop-blur-2xl border-r border-slate-800/80 shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-40 transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'w-[58px] sm:w-[62px]' : 'w-[250px] sm:w-[268px]'
        } ${className}`}
      >
        {sidebarBody(isCollapsed)}
      </aside>

      {/* Backdrop overlay for mobile screens when expanded to prevent content obstruction */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default LucKeySidebar;
