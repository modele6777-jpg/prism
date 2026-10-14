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
  UserCheck,
  BookMarked,
  Library,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Compass,
  Layers,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Flame,
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
}

export function LucKeySidebar({ className = '' }: LucKeySidebarProps) {
  const [location, navigate] = useLocation();
  const { firebaseUser, sharedState, syncPrismDevices } = useApp();

  // Desktop sidebar collapsed state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return safeLocalStorage.getItem('luckey_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Load user profile safely
  const profile = useMemo(() => {
    const vault = loadProfileFromAllVaults();
    return {
      name: sharedState?.userProfile?.basic?.name || vault?.basic?.name || firebaseUser?.displayName || '박주형',
      birthdate: sharedState?.userProfile?.basic?.birthdate || vault?.basic?.birthdate || '1994-01-24',
      natalTag: '9H 물병 태양 & 토성',
    };
  }, [sharedState?.userProfile, firebaseUser?.displayName]);

  // Handle sidebar collapse toggle
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        safeLocalStorage.setItem('luckey_sidebar_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Listen for global toggle/open/close events
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleOpen = () => setIsMobileOpen(true);
    const handleClose = () => setIsMobileOpen(false);

    window.addEventListener('prism:toggle_sidebar', handleToggle);
    window.addEventListener('prism:open_sidebar', handleOpen);
    window.addEventListener('prism:close_sidebar', handleClose);

    return () => {
      window.removeEventListener('prism:toggle_sidebar', handleToggle);
      window.removeEventListener('prism:open_sidebar', handleOpen);
      window.removeEventListener('prism:close_sidebar', handleClose);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Reset or Start New Chat
  const handleNewChat = useCallback(() => {
    setIsMobileOpen(false);
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

  // Navigation Items Definitions
  const CORE_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'lucy',
        title: '루시 홈 (Lucy Chat)',
        subtitle: '행운의 올인원 AI 실시간 대화',
        path: '/',
        matchPaths: ['/', '/chat', '/lucy'],
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

  const STUDIOS_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'trinity',
        title: 'TRINITY (트리니티)',
        subtitle: '운명 오라클 · 천문 사주 · 타로 제단',
        path: '/trinity',
        icon: Sparkles,
        accentColor: 'amber',
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
      {
        id: 'prologue',
        title: 'PROLOGUE (프롤로그)',
        subtitle: '종합 유니버스 대시보드',
        path: '/prologue',
        matchPaths: ['/prologue', '/universe', '/hub', '/ecpr', '/todo', '/mission', '/synergy', '/aegis'],
        icon: Sun,
        accentColor: 'teal',
      },
    ],
    []
  );

  const WISDOM_ITEMS: NavItemDef[] = useMemo(
    () => [
      {
        id: 'profile',
        title: '내 정보 & 네이탈 차트',
        subtitle: `${profile.name} 님 (${profile.natalTag})`,
        path: '/profile',
        matchPaths: ['/profile', '/chronicle'],
        icon: UserCheck,
        accentColor: 'amber',
      },
      {
        id: 'handbook',
        title: '지혜 & 성서 핸드북',
        subtitle: 'ReBible 오디오북 · 40기법 사전',
        path: '/handbook',
        matchPaths: ['/handbook', '/rebible'],
        icon: BookMarked,
        accentColor: 'cyan',
      },
      {
        id: 'library',
        title: '소울 라이브러리',
        subtitle: '통합 지혜 & 독서 아카이브',
        path: '/library',
        icon: Library,
        accentColor: 'emerald',
      },
    ],
    [profile]
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
            navigate(item.path);
            setIsMobileOpen(false);
          }}
          title={`${item.title} — ${item.subtitle}`}
          className={`w-11 h-11 mx-auto rounded-2xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
            active
              ? 'bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Icon size={19} className="transition-transform group-hover:scale-110" />
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
          navigate(item.path);
          setIsMobileOpen(false);
        }}
        className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-200 group text-left cursor-pointer border ${
          active
            ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent text-white border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.18)] ring-1 ring-emerald-400/30'
            : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/10'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            active
              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
              : 'bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:bg-white/10'
          }`}
        >
          <Icon size={18} className="transition-transform group-hover:scale-110" />
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

  // Shared Sidebar Body Content
  const sidebarContent = (compact = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div
        className={`shrink-0 flex items-center justify-between border-b border-white/10 transition-all ${
          compact ? 'px-2 py-3.5 justify-center' : 'px-4 py-3.5'
        }`}
      >
        <div
          onClick={() => {
            navigate('/');
            setIsMobileOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer group min-w-0"
          title="루시 홈으로 이동"
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
                  SOUL SANCTUARY · ALL-IN-ONE
                </span>
              </div>
            </>
          )}
        </div>

        {/* Desktop Collapse / Mobile Close Button */}
        {!compact && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="사이드바 접기"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* "+ 새 대화 (New Chat)" Button */}
      <div className={`shrink-0 ${compact ? 'p-2' : 'px-3.5 py-3'}`}>
        {compact ? (
          <button
            type="button"
            onClick={handleNewChat}
            className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 active:scale-95 text-slate-950 font-black flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-all cursor-pointer"
            title="새 대화 시작"
          >
            <MessageSquarePlus size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-400/40 text-emerald-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(52,211,153,0.2)] active:scale-98 transition-all cursor-pointer group"
          >
            <MessageSquarePlus
              size={17}
              className="text-emerald-400 group-hover:rotate-12 transition-transform"
            />
            <span>+ 새 대화 시작</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-mono ml-auto">
              Ctrl+K
            </span>
          </button>
        )}
      </div>

      {/* Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-4 no-scrollbar">
        {/* Core Section */}
        <div className="space-y-1">
          {!compact && (
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-emerald-400" />
              <span>핵심 게이트웨이</span>
            </div>
          )}
          {CORE_ITEMS.map((item) => renderItemRow(item, compact))}
        </div>

        {/* 7 Studios Section */}
        <div className="space-y-1">
          {!compact && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-t border-white/5">
              <Layers size={11} className="text-amber-400" />
              <span>7대 전문 스튜디오</span>
            </div>
          )}
          {STUDIOS_ITEMS.map((item) => renderItemRow(item, compact))}
        </div>

        {/* Wisdom & Profile Section */}
        <div className="space-y-1">
          {!compact && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-t border-white/5">
              <BookMarked size={11} className="text-cyan-400" />
              <span>지혜 & 내 정보</span>
            </div>
          )}
          {WISDOM_ITEMS.map((item) => renderItemRow(item, compact))}
        </div>
      </div>

      {/* Footer User Profile & Collapse Bar */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-md p-2 sm:p-2.5">
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigate('/profile');
                setIsMobileOpen(false);
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer"
              title={`${profile.name} 님의 프로필`}
            >
              {profile.name.slice(0, 1)}
            </button>
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="사이드바 펼치기"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => {
                navigate('/profile');
                setIsMobileOpen(false);
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1 p-1 rounded-xl hover:bg-white/5 transition-colors"
              title="내 프로필 및 출생차트 보기"
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm ring-1 ring-amber-400/40 group-hover:scale-105 transition-transform">
                  {profile.name.slice(0, 1)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight truncate">
                    {profile.name} 님
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    INTJ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{profile.natalTag}</p>
              </div>
            </div>

            {/* Sync Action Button */}
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
                setTimeout(() => setSyncNotice(null), 2000);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer shrink-0 border border-white/5"
              title={syncNotice || '클라우드 실시간 동기화'}
            >
              <RefreshCw
                size={14}
                className={syncNotice === '동기화 중...' ? 'animate-spin text-emerald-400' : ''}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 🖥️ Desktop Left Sidebar (>= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-full bg-[#080A12]/95 backdrop-blur-2xl border-r border-slate-800/80 shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-40 transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'w-[70px]' : 'w-[264px] xl:w-[280px]'
        } ${className}`}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      {/* 📱 Mobile Slide-over Drawer (< 1024px) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[600] flex">
            {/* Dark Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-[285px] sm:w-[320px] max-w-[85vw] h-full bg-[#080A12]/98 backdrop-blur-2xl border-r border-slate-800/90 shadow-[10px_0_40px_rgba(0,0,0,0.7)] flex flex-col z-10"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {sidebarContent(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LucKeySidebar;
