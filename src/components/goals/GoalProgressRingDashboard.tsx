import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Plus, 
  Check, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Flame, 
  ChevronRight, 
  Heart, 
  BookOpen, 
  Activity, 
  Zap, 
  Sun,
  X
} from 'lucide-react';

export type GoalCategory = 'mind' | 'wellness' | 'creation' | 'wisdom' | 'routine';

export interface UserGoal {
  id: string;
  title: string;
  category: GoalCategory;
  current: number;
  target: number;
  unit: string;
  colorStart: string;
  colorEnd: string;
  glowColor: string;
  streakDays: number;
  completedAt?: string;
  createdAt: string;
}

const STORAGE_KEY = 'luckey_user_goals_v1';
const STORAGE_DATE_KEY = 'luckey_user_goals_date_v1';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const CATEGORY_META: Record<GoalCategory, { label: string; icon: string; defaultColorStart: string; defaultColorEnd: string; glow: string }> = {
  mind: {
    label: '마음챙김',
    icon: '🧘',
    defaultColorStart: '#8b5cf6',
    defaultColorEnd: '#6366f1',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  wellness: {
    label: '신체 웰니스',
    icon: '🌿',
    defaultColorStart: '#10b981',
    defaultColorEnd: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  creation: {
    label: '창작 & 영감',
    icon: '⚡',
    defaultColorStart: '#ec4899',
    defaultColorEnd: '#f43f5e',
    glow: 'rgba(236, 72, 153, 0.4)',
  },
  wisdom: {
    label: '지혜 & 독서',
    icon: '🌌',
    defaultColorStart: '#f59e0b',
    defaultColorEnd: '#eab308',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  routine: {
    label: '일상 습관',
    icon: '🕊️',
    defaultColorStart: '#0284c7',
    defaultColorEnd: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.4)',
  },
};

const DEFAULT_GOALS: UserGoal[] = [
  {
    id: 'goal-mindfulness',
    title: '내면 호흡 & 15분 명상',
    category: 'mind',
    current: 0,
    target: 15,
    unit: '분',
    colorStart: '#8b5cf6',
    colorEnd: '#6366f1',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    streakDays: 0,
    createdAt: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'goal-wellness',
    title: '몸을 깨우는 아침 스트레칭',
    category: 'wellness',
    current: 0,
    target: 20,
    unit: '분',
    colorStart: '#10b981',
    colorEnd: '#06b6d4',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    streakDays: 0,
    createdAt: '2026-09-18T00:00:00.000Z',
  },
  {
    id: 'goal-reading',
    title: '영혼의 양식 독서 성찰',
    category: 'wisdom',
    current: 0,
    target: 25,
    unit: '쪽',
    colorStart: '#f59e0b',
    colorEnd: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    streakDays: 0,
    createdAt: '2026-09-21T00:00:00.000Z',
  },
  {
    id: 'goal-creation',
    title: '창작 영감 노트 1편 기록',
    category: 'creation',
    current: 0,
    target: 2,
    unit: '편',
    colorStart: '#ec4899',
    colorEnd: '#f43f5e',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    streakDays: 0,
    createdAt: '2026-09-22T00:00:00.000Z',
  },
];

const PRESET_TEMPLATES = [
  { title: '마음챙김 호흡 명상', target: 15, unit: '분', category: 'mind' as GoalCategory },
  { title: '생명수 수분 충전', target: 2000, unit: 'ml', category: 'wellness' as GoalCategory },
  { title: '영혼의 도서 20쪽 읽기', target: 20, unit: '쪽', category: 'wisdom' as GoalCategory },
  { title: '하루 감사 일기 3가지', target: 3, unit: '개', category: 'routine' as GoalCategory },
  { title: '창작 아이디어 스케치', target: 1, unit: '회', category: 'creation' as GoalCategory },
  { title: '가벼운 산책 & 유산소', target: 30, unit: '분', category: 'wellness' as GoalCategory },
];

/**
 * Concentric Multi-Ring Progress SVG Visualizer
 */
function ConcentricProgressRings({
  goals,
  highlightedGoalId,
  onRingClick,
}: {
  goals: UserGoal[];
  highlightedGoalId?: string | null;
  onRingClick?: (goalId: string) => void;
}) {
  const size = 220;
  const center = size / 2;
  const baseStrokeWidth = 8;
  const ringGap = 13;

  // Use top 4 goals for the concentric rings to maintain visual balance
  const activeGoals = goals.slice(0, 4);

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 filter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {activeGoals.map((goal) => {
            const gradId = `ring-grad-${goal.id}`;
            return (
              <linearGradient key={gradId} id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goal.colorStart} />
                <stop offset="100%" stopColor={goal.colorEnd} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Render concentric rings from outer to inner */}
        {activeGoals.map((goal, index) => {
          const radius = center - 16 - index * ringGap;
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const percent = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
          const strokeDashoffset = circumference - (percent / 100) * circumference;
          const isHighlighted = highlightedGoalId === goal.id;
          const isCompleted = percent >= 100;

          return (
            <g 
              key={goal.id} 
              className="cursor-pointer transition-opacity duration-300"
              onClick={() => onRingClick && onRingClick(goal.id)}
            >
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.07)"
                strokeWidth={baseStrokeWidth}
              />

              {/* Progress Foreground Track */}
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`url(#ring-grad-${goal.id})`}
                strokeWidth={isHighlighted ? baseStrokeWidth + 2 : baseStrokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
                style={{
                  filter: isCompleted
                    ? `drop-shadow(0 0 6px ${goal.glowColor}) drop-shadow(0 0 14px ${goal.glowColor}90)`
                    : isHighlighted
                    ? `drop-shadow(0 0 8px ${goal.glowColor}) drop-shadow(0 0 16px ${goal.glowColor}80)`
                    : `drop-shadow(0 0 4px ${goal.glowColor}55) drop-shadow(0 0 10px ${goal.glowColor}30)`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center Core HUD */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
        <Target size={20} className="text-amber-300/80 mb-0.5 animate-pulse" />
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest leading-none">
          OVERALL
        </span>
        <span className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
          {Math.round(
            goals.length > 0
              ? goals.reduce((acc, g) => acc + Math.min(100, (g.current / g.target) * 100), 0) / goals.length
              : 0
          )}%
        </span>
        <span className="text-[9px] text-white/50 font-sans mt-0.5">
          {goals.filter(g => g.current >= g.target).length}/{goals.length} 달성
        </span>
      </div>
    </div>
  );
}

/**
 * Single Circular Progress Ring Indicator for individual cards
 */
function SingleProgressRing({
  current,
  target,
  colorStart,
  colorEnd,
  glowColor,
  size = 56,
  strokeWidth = 5,
}: {
  current: number;
  target: number;
  colorStart: string;
  colorEnd: string;
  glowColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = center - strokeWidth - 1;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, Math.max(0, (current / target) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const isCompleted = percent >= 100;
  const gradId = useMemo(() => `single-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div className="relative shrink-0 flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: isCompleted
              ? `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor}80)`
              : `drop-shadow(0 0 4px ${glowColor}50) drop-shadow(0 0 8px ${glowColor}25)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-center">
        {isCompleted ? (
          <Check size={16} className="text-emerald-400 stroke-[3]" />
        ) : (
          <span className="text-[11px] font-bold font-mono text-white/90">
            {Math.round(percent)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function GoalProgressRingDashboard() {
  const [goals, setGoals] = useState<UserGoal[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_GOALS;
    const today = getTodayKey();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored on a previous date or if legacy prefilled mock data is detected, reset daily progress to 0
          const isNewDay = savedDate !== today;
          const hasLegacyPrefilledMock = parsed.some(
            (g: UserGoal) =>
              (g.id === 'goal-wellness' && g.current >= 20) ||
              (g.id === 'goal-mindfulness' && g.current >= 10) ||
              (g.id === 'goal-reading' && g.current >= 18)
          );

          if (isNewDay || hasLegacyPrefilledMock) {
            const cleanGoals = parsed.map((g: UserGoal) => ({
              ...g,
              current: 0,
              completedAt: undefined,
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanGoals));
            localStorage.setItem(STORAGE_DATE_KEY, today);
            return cleanGoals;
          }
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_DATE_KEY, today);
    } catch (e) {
      console.warn('Failed to parse saved user goals:', e);
    }
    return DEFAULT_GOALS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [highlightedGoalId, setHighlightedGoalId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('mind');
  const [targetVal, setTargetVal] = useState<number>(15);
  const [unit, setUnit] = useState('분');

  // Sync to localStorage
  const saveGoals = useCallback((newGoals: UserGoal[]) => {
    setGoals(newGoals);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      localStorage.setItem(STORAGE_DATE_KEY, getTodayKey());
      window.dispatchEvent(new CustomEvent('luckey-goals-sync', { detail: newGoals }));
    } catch (e) {
      console.error('Failed to save user goals to storage:', e);
    }
  }, []);

  // Multi-tab listener & daily midnight/focus reset listener
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setGoals(parsed);
        } catch (_) {}
      }
    };
    const handleCustomSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setGoals(detail);
    };

    const checkDailyReset = () => {
      const today = getTodayKey();
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      if (savedDate && savedDate !== today) {
        setGoals((prev) => {
          const reset = prev.map((g) => ({
            ...g,
            current: 0,
            completedAt: undefined,
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
          localStorage.setItem(STORAGE_DATE_KEY, today);
          return reset;
        });
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('luckey-goals-sync', handleCustomSync);
    window.addEventListener('focus', checkDailyReset);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('luckey-goals-sync', handleCustomSync);
      window.removeEventListener('focus', checkDailyReset);
    };
  }, []);

  // Handlers for updating progress
  const handleIncrement = (id: string, step = 1) => {
    saveGoals(
      goals.map((g) => {
        if (g.id === id) {
          const nextVal = Math.max(0, Math.min(g.target * 2, g.current + step));
          const completedNow = nextVal >= g.target && g.current < g.target;
          return {
            ...g,
            current: nextVal,
            completedAt: completedNow ? new Date().toISOString() : g.completedAt,
            streakDays: completedNow ? g.streakDays + 1 : g.streakDays,
          };
        }
        return g;
      })
    );
  };

  const handleDecrement = (id: string, step = 1) => {
    saveGoals(
      goals.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            current: Math.max(0, g.current - step),
          };
        }
        return g;
      })
    );
  };

  const handleToggleComplete = (id: string) => {
    saveGoals(
      goals.map((g) => {
        if (g.id === id) {
          const isDone = g.current >= g.target;
          return {
            ...g,
            current: isDone ? 0 : g.target,
            completedAt: isDone ? undefined : new Date().toISOString(),
          };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id));
  };

  const handleResetDefaults = () => {
    if (window.confirm('기본 추천 목표 세트로 초기화하시겠습니까?')) {
      saveGoals(DEFAULT_GOALS);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetVal <= 0) return;

    const meta = CATEGORY_META[category];
    const newGoal: UserGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      category,
      current: 0,
      target: Number(targetVal) || 10,
      unit: unit.trim() || '회',
      colorStart: meta.defaultColorStart,
      colorEnd: meta.defaultColorEnd,
      glowColor: meta.glow,
      streakDays: 1,
      createdAt: new Date().toISOString(),
    };

    saveGoals([newGoal, ...goals]);
    setTitle('');
    setIsAddModalOpen(false);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTargetVal(preset.target);
    setUnit(preset.unit);
  };

  // Calculations
  const totalGoals = goals.length;
  const completedGoalsCount = useMemo(() => goals.filter((g) => g.current >= g.target).length, [goals]);
  const averageProgress = useMemo(() => {
    if (totalGoals === 0) return 0;
    const sum = goals.reduce((acc, g) => acc + Math.min(100, (g.current / g.target) * 100), 0);
    return Math.round(sum / totalGoals);
  }, [goals, totalGoals]);

  const isAllAchieved = totalGoals > 0 && completedGoalsCount === totalGoals;

  return (
    <div className="w-full mb-8">
      <div className="glass prism-xs-hub-card p-6 md:p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Ambient background glow */}
        <div className="hidden md:block absolute -top-12 -left-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-[110px] pointer-events-none" />
        <div className="hidden md:block absolute -bottom-12 -right-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-[110px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-[0.3em] font-mono flex items-center gap-1.5">
                <Target size={12} className="text-amber-400" />
                ENGAGEMENT & GOALS
              </span>
              <span className="text-white/20" aria-hidden="true">·</span>
              <span className="text-[10px] text-white/50 font-mono">
                {completedGoalsCount}/{totalGoals} 달성 완료
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <span>나만의 일일 몰입 목표 링</span>
              {isAllAchieved && (
                <span className="text-xs text-emerald-400 font-sans font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-bounce">
                  <Sparkles size={12} /> 올 클리어!
                </span>
              )}
            </h3>
            <p className="text-xs text-white/60 mt-1 font-medium">
              직접 정의한 목표를 프로그레스 링으로 시각화하여 오늘의 성장을 한눈에 체감하세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-white/40 hover:text-indigo-300 transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer"
              title="기본 목표 목록으로 리셋"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">추천 목표 리셋</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/80 to-rose-500/80 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_18px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>새 목표 추가</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout: Concentric Ring Showcase + Goal Cards List */}
        <div className="relative z-10 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left / Top: Concentric Master Progress Ring */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 rounded-[28px] bg-white/[0.02] border border-white/5">
            <ConcentricProgressRings
              goals={goals}
              highlightedGoalId={highlightedGoalId}
              onRingClick={(id) => setHighlightedGoalId(id === highlightedGoalId ? null : id)}
            />

            <div className="mt-4 text-center space-y-1">
              <p className="text-xs text-white/70 font-medium">
                {isAllAchieved 
                  ? '오늘의 모든 목표를 완벽하게 달성했습니다! 멋진 하루입니다.' 
                  : `평균 목표 달성률 ${averageProgress}% · 작은 실행이 큰 변화를 만듭니다.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] text-white/40 font-mono">
                {goals.slice(0, 4).map((g) => {
                  const isDone = g.current >= g.target;
                  return (
                    <div 
                      key={g.id} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all ${
                        highlightedGoalId === g.id ? 'bg-white/15 text-white' : 'hover:bg-white/5'
                      }`}
                      onClick={() => setHighlightedGoalId(highlightedGoalId === g.id ? null : g.id)}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: g.colorStart }} 
                      />
                      <span className="truncate max-w-[100px]">{g.title}</span>
                      {isDone && <Check size={10} className="text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right / Bottom: Individual Goals Interactive Ring Cards */}
          <div className="lg:col-span-7 space-y-3">
            {goals.length === 0 ? (
              <div className="p-8 text-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.01] space-y-3">
                <Target size={32} className="mx-auto text-white/30" />
                <p className="text-xs text-white/50">등록된 목표가 없습니다. 나만의 목표를 추가해보세요.</p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold transition-all"
                >
                  + 새 목표 등록하기
                </button>
              </div>
            ) : (
              goals.map((goal) => {
                const percent = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
                const isDone = percent >= 100;
                const meta = CATEGORY_META[goal.category] || CATEGORY_META.mind;
                const isSelected = highlightedGoalId === goal.id;

                // Determine step increment size based on unit
                const step = goal.unit === 'ml' ? 250 : goal.unit === '분' || goal.unit === '쪽' ? 5 : 1;

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    onMouseEnter={() => setHighlightedGoalId(goal.id)}
                    onMouseLeave={() => setHighlightedGoalId(null)}
                    className={`p-4 rounded-[22px] border transition-all duration-300 flex items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-emerald-950/10 border-emerald-500/30'
                        : isSelected
                        ? 'bg-white/[0.08] border-indigo-400/50 shadow-lg scale-[1.01]'
                        : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/10'
                    }`}
                  >
                    {/* Ring Indicator */}
                    <SingleProgressRing
                      current={goal.current}
                      target={goal.target}
                      colorStart={goal.colorStart}
                      colorEnd={goal.colorEnd}
                      glowColor={goal.glowColor}
                      size={54}
                      strokeWidth={5}
                    />

                    {/* Goal Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-0.5">
                        <span>{meta.icon} {meta.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-0.5 text-amber-300/80 font-mono">
                          <Flame size={11} className="text-amber-400" />
                          {goal.streakDays}일 연속
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold break-keep break-words whitespace-normal transition-colors ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                        {goal.title}
                      </h4>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold text-white/80">
                          {goal.current} <span className="text-white/40 font-normal">/ {goal.target} {goal.unit}</span>
                        </span>
                        {isDone && (
                          <span className="text-[10px] text-emerald-400 font-bold font-sans">
                            ✓ 완수
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Decrement Button */}
                      <button
                        type="button"
                        onClick={() => handleDecrement(goal.id, step)}
                        disabled={goal.current <= 0}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white/70 hover:text-white flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer"
                        title={`-${step} ${goal.unit}`}
                      >
                        -
                      </button>

                      {/* Increment Button */}
                      <button
                        type="button"
                        onClick={() => handleIncrement(goal.id, step)}
                        className="w-8 h-8 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 active:scale-95 border border-indigo-400/30 text-indigo-200 hover:text-white flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer"
                        title={`+${step} ${goal.unit}`}
                      >
                        +{step}
                      </button>

                      {/* Quick Complete / Reset Checkmark */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(goal.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'border-white/15 hover:border-emerald-400/60 bg-white/5 hover:bg-emerald-500/10 text-white/40 hover:text-emerald-300'
                        }`}
                        title={isDone ? '목표 진행 초기화' : '목표 100% 즉시 완료'}
                      >
                        <Check size={14} className={isDone ? 'stroke-[3]' : 'opacity-60'} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="w-7 h-7 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
                        title="목표 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ✍️ Add Goal Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-lg rounded-[28px] border border-amber-500/30 bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-5 text-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-amber-400" />
                    <h3 className="text-base font-bold">새로운 나만의 몰입 목표 등록</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] text-white/50 mb-2 font-mono">
                    💡 빠른 추천 프리셋 선택
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TEMPLATES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="px-2.5 py-1 rounded-xl text-[11px] bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
                      >
                        {preset.title} ({preset.target}{preset.unit})
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1.5 font-mono">
                      목표 제목
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 매일 저녁 20분 명상하기"
                      className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1.5 font-mono">
                        카테고리
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as GoalCategory)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="mind">🧘 마음챙김</option>
                        <option value="wellness">🌿 신체 웰니스</option>
                        <option value="creation">⚡ 창작 & 영감</option>
                        <option value="wisdom">🌌 지혜 & 독서</option>
                        <option value="routine">🕊️ 일상 습관</option>
                      </select>
                    </div>

                    {/* Target Quantity */}
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1.5 font-mono">
                        목표 수치
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={targetVal}
                        onChange={(e) => setTargetVal(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1.5 font-mono">
                        단위
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="분">분 (시간)</option>
                        <option value="회">회 (횟수)</option>
                        <option value="쪽">쪽 (페이지)</option>
                        <option value="개">개 (항목)</option>
                        <option value="ml">ml (수분)</option>
                        <option value="편">편 (기록)</option>
                        <option value="km">km (거리)</option>
                        <option value="%">% (퍼센트)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim() || targetVal <= 0}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-40 cursor-pointer"
                    >
                      목표 링 생성하기
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
