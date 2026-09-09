import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  Sparkles,
  Heart,
  BookOpen,
  Calendar,
  Save,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  TreeDeciduous,
  Leaf,
  Bird,
  Music,
  Plus,
  PenLine,
  Copy,
  Volume2,
  Wand2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getTodayDateKey } from '@/lib/dailyCache';
import { invokeEpilogueSummaryLLM, invokeMindDiaryLLM } from '@/lib/ai';
import { TTSButton } from '@/components/TTSButton';

export interface EpilogueDiaryEntry {
  id: string;
  dateKey: string;
  createdAt: number;
  mood: string;
  moodEmoji: string;
  gratitudes: string[];
  rawNotes?: string;
  mindDiary: string;
  reflection?: string;
  anchor?: string;
  aiFeedback?: string;
  cosmicFootprint?: {
    orange?: string;
    trinity?: string;
    heal?: string;
    bluebird?: string;
    muse?: string;
  };
}

const MOOD_OPTIONS = [
  { label: '평온함', emoji: '😌', color: 'rgba(56, 189, 248, 0.25)', border: 'rgba(56, 189, 248, 0.5)' },
  { label: '성취감', emoji: '✨', color: 'rgba(250, 204, 21, 0.25)', border: 'rgba(250, 204, 21, 0.5)' },
  { label: '비움과 자유', emoji: '🌊', color: 'rgba(168, 85, 247, 0.25)', border: 'rgba(168, 85, 247, 0.5)' },
  { label: '따뜻한 감사', emoji: '💖', color: 'rgba(244, 114, 182, 0.25)', border: 'rgba(244, 114, 182, 0.5)' },
  { label: '포근한 휴식', emoji: '🌙', color: 'rgba(129, 140, 248, 0.25)', border: 'rgba(129, 140, 248, 0.5)' },
  { label: '새로운 영감', emoji: '💡', color: 'rgba(251, 146, 60, 0.25)', border: 'rgba(251, 146, 60, 0.5)' },
];

const GRATITUDE_SUGGESTIONS = [
  '따뜻한 차 한 잔과 고요한 아침',
  '오늘 나를 지탱해 준 소중한 인연',
  '어려운 순간에도 중심을 지킨 나 자신',
  '마음을 편안하게 해 준 자연의 소리와 햇살',
  '오늘 배운 새로운 생각과 깨달음',
  '무사히 하루를 마무리할 수 있는 평화',
];

const DIARY_NOTE_IDEAS = [
  '오늘 유난히 분주했지만 끝까지 해낸 나를 칭찬함',
  '저녁 노을을 바라보며 마음에 고요한 쉼표를 찍음',
  '마음속 복잡한 걱정을 밤하늘에 가볍게 띄워 보냄',
  '작은 성취 속에서 나만의 소중한 보람을 발견함',
];

export function ensureGratitudes(raw?: string[]): string[] {
  const list = Array.isArray(raw)
    ? raw.map((item) => (typeof item === 'string' ? item : '')).filter((item) => Boolean(item && item.trim()))
    : [];
  const result = [...list];
  while (result.length < 3) {
    result.push('');
  }
  return result;
}

export function EpilogueDiaryView() {
  const { sharedState, updateSharedState, openLucyChat } = useApp();
  const todayKey = getTodayDateKey();

  // Local & Shared History
  const [entries, setEntries] = useState<EpilogueDiaryEntry[]>(() => {
    let localList: EpilogueDiaryEntry[] = [];
    try {
      const cached = localStorage.getItem('epilogue_diary_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) localList = parsed;
      }
    } catch {
      // ignore
    }
    const fromShared = sharedState?.epilogueHistory;
    if (Array.isArray(fromShared) && fromShared.length > 0) {
      const map = new Map<string, EpilogueDiaryEntry>();
      localList.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
      (fromShared as EpilogueDiaryEntry[]).forEach((e) => {
        if (e?.dateKey) {
          const existing = map.get(e.dateKey);
          if (!existing || (e.createdAt || 0) >= (existing.createdAt || 0)) {
            map.set(e.dateKey, e);
          }
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return localList;
  });

  // Today's Form State
  const existingTodayEntry = useMemo(
    () => entries.find((e) => e.dateKey === todayKey),
    [entries, todayKey]
  );

  const cachedTodayDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(`epilogue_diary_draft_${todayKey}`);
      if (raw) return JSON.parse(raw) as Partial<EpilogueDiaryEntry>;
    } catch {}
    return null;
  }, [todayKey]);

  const [selectedMood, setSelectedMood] = useState<string>(() =>
    existingTodayEntry?.mood || cachedTodayDraft?.mood || '평온함'
  );
  const [gratitudes, setGratitudes] = useState<string[]>(() =>
    ensureGratitudes(existingTodayEntry?.gratitudes || cachedTodayDraft?.gratitudes)
  );
  const [rawNotes, setRawNotes] = useState<string>(() =>
    existingTodayEntry?.rawNotes || cachedTodayDraft?.rawNotes || ''
  );
  const [mindDiary, setMindDiary] = useState<string>(() =>
    existingTodayEntry?.mindDiary || existingTodayEntry?.reflection || cachedTodayDraft?.mindDiary || (cachedTodayDraft as any)?.reflection || ''
  );
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);

  const [aiFeedback, setAiFeedback] = useState<string>(() =>
    existingTodayEntry?.aiFeedback || cachedTodayDraft?.aiFeedback || ''
  );

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Sync entries from sharedState and real-time cross-device events with safe deduplicating merge
  useEffect(() => {
    const mergeIntoEntries = (incoming: any[]) => {
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      setEntries((prev) => {
        const map = new Map<string, EpilogueDiaryEntry>();
        prev.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
        try {
          const cached = localStorage.getItem('epilogue_diary_history');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) parsed.forEach((e: any) => { if (e?.dateKey) map.set(e.dateKey, e); });
          }
        } catch {}

        incoming.forEach((e) => {
          if (e?.dateKey) {
            const existing = map.get(e.dateKey);
            if (!existing || (e.createdAt || 0) >= (existing.createdAt || 0)) {
              map.set(e.dateKey, e);
            }
          }
        });

        const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        try {
          localStorage.setItem('epilogue_diary_history', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    };

    if (Array.isArray(sharedState?.epilogueHistory) && sharedState.epilogueHistory.length > 0) {
      mergeIntoEntries(sharedState.epilogueHistory);
    }

    const handleFeatureUpdate = (e: any) => {
      const updatedHistory = e?.detail?.epilogueHistory;
      if (Array.isArray(updatedHistory) && updatedHistory.length > 0) {
        mergeIntoEntries(updatedHistory);
      }
    };

    window.addEventListener('prism:feature_updated', handleFeatureUpdate);
    window.addEventListener('prism:state_changed', handleFeatureUpdate);
    return () => {
      window.removeEventListener('prism:feature_updated', handleFeatureUpdate);
      window.removeEventListener('prism:state_changed', handleFeatureUpdate);
    };
  }, [sharedState?.epilogueHistory]);

  // Synchronize form state when existingTodayEntry is resolved/updated from cloud or cache
  useEffect(() => {
    if (existingTodayEntry) {
      if (existingTodayEntry.mood) setSelectedMood(existingTodayEntry.mood);
      if (Array.isArray(existingTodayEntry.gratitudes)) {
        setGratitudes((prev) => {
          // If the user already has content typed, merge smartly; otherwise use ensureGratitudes
          const hasUserContent = prev.some((g) => g.trim());
          if (hasUserContent && existingTodayEntry.gratitudes.length === 0) return prev;
          return ensureGratitudes(existingTodayEntry.gratitudes);
        });
      }
      if (existingTodayEntry.rawNotes) {
        setRawNotes((prev) => (prev.trim() ? prev : existingTodayEntry.rawNotes || ''));
      }
      if (existingTodayEntry.mindDiary || existingTodayEntry.reflection) {
        setMindDiary((prev) => (prev.trim() ? prev : (existingTodayEntry.mindDiary || existingTodayEntry.reflection || '')));
      }
      if (existingTodayEntry.aiFeedback) {
        setAiFeedback((prev) => (prev.trim() ? prev : existingTodayEntry.aiFeedback || ''));
      }
    }
  }, [existingTodayEntry]);

  // Real-time Auto-Save Engine: debounced auto-persist on any content change
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeMoodObj = MOOD_OPTIONS.find((m) => m.label === selectedMood) || MOOD_OPTIONS[0];
      const validGratitudes = gratitudes.map((g) => g.trim()).filter(Boolean);
      const effectiveDiary = mindDiary.trim() || rawNotes.trim();

      // Only auto-save if user has typed something
      if (!effectiveDiary && validGratitudes.length === 0 && !rawNotes.trim()) return;

      const newEntry: EpilogueDiaryEntry = {
        id: existingTodayEntry?.id || `epilogue_${todayKey}_${Date.now()}`,
        dateKey: todayKey,
        createdAt: existingTodayEntry?.createdAt || Date.now(),
        mood: selectedMood,
        moodEmoji: activeMoodObj.emoji,
        gratitudes: validGratitudes,
        rawNotes: rawNotes.trim(),
        mindDiary: effectiveDiary || '오늘 하루를 평온하게 마무리함',
        aiFeedback: aiFeedback.trim() || undefined,
        cosmicFootprint: {
          orange: orangeData ? 'Secret 완료' : undefined,
          trinity: trinityData ? 'Lucky 완료' : undefined,
          heal: healData ? 'Letting Go 완료' : undefined,
          bluebird: hoponoponoData ? 'Ho\'oponopono 완료' : undefined,
          muse: museData ? 'Art 완료' : undefined,
        },
      };

      setEntries((prev) => {
        let diskEntries: EpilogueDiaryEntry[] = [];
        try {
          const cached = localStorage.getItem('epilogue_diary_history');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) diskEntries = parsed;
          }
        } catch (_) {}

        const map = new Map<string, EpilogueDiaryEntry>();
        diskEntries.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
        prev.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
        map.set(todayKey, newEntry);

        const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        try {
          localStorage.setItem('epilogue_diary_history', JSON.stringify(merged));
          localStorage.setItem(`epilogue_diary_draft_${todayKey}`, JSON.stringify(newEntry));
        } catch (_) {}

        void updateSharedState(
          {
            epilogueHistory: merged,
            epilogueMemory: effectiveDiary || aiFeedback || `${todayKey} 성찰 진행 중`,
          },
          'epilogue'
        ).catch(() => {});

        return merged;
      });

      setAutoSaved(true);
      const hideTimer = setTimeout(() => setAutoSaved(false), 2000);
      return () => clearTimeout(hideTimer);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedMood, gratitudes, rawNotes, mindDiary, aiFeedback, todayKey]);

  // Today's Cosmic Footprints
  const orangeData = sharedState?.dailySecrets?.[todayKey];
  const trinityData = sharedState?.trinityDailyLucky?.[todayKey];
  const hoponoponoData = sharedState?.hoponoponoDaily?.[todayKey];
  const museData = sharedState?.dailyArts?.[todayKey];
  const healData = (sharedState?.healHistory || [])[0];

  const footprints = useMemo(() => [
    {
      app: 'orange',
      name: 'Orange',
      title: 'Secret',
      icon: TreeDeciduous,
      color: '#f97316',
      active: Boolean(orangeData),
      summary: orangeData?.wishText || orangeData?.affirmation || '데일리 시크릿 여정',
    },
    {
      app: 'trinity',
      name: 'Trinity',
      title: 'Lucky',
      icon: Sparkles,
      color: '#eab308',
      active: Boolean(trinityData),
      summary: trinityData?.luckyData?.fortuneSummary || '천문 사주 & 타로 리딩',
    },
    {
      app: 'heal',
      name: 'Heal',
      title: 'Letting Go',
      icon: Leaf,
      color: '#10b981',
      active: Boolean(healData),
      summary: healData?.themeName || '세도나 방하착 릴리징',
    },
    {
      app: 'bluebird',
      name: 'Bluebird',
      title: "Ho'oponopono",
      icon: Bird,
      color: '#38bdf8',
      active: Boolean(hoponoponoData),
      summary: hoponoponoData?.completed ? '정화 4구절 실천 완료' : '호오포노포노 정화',
    },
    {
      app: 'muse',
      name: 'Muse',
      title: 'Art',
      icon: Music,
      color: '#a855f7',
      active: Boolean(museData),
      summary: museData?.recommendation?.title ? `명화 [${museData.recommendation.title}]` : '아트 테라피 처방',
    },
  ], [orangeData, trinityData, healData, hoponoponoData, museData]);

  // Handle Gratitude Update (maintains at least 3 slots)
  const updateGratitude = (index: number, val: string) => {
    setGratitudes((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const addGratitudeField = () => {
    setGratitudes((prev) => [...prev, '']);
  };

  const removeGratitudeField = (index: number) => {
    setGratitudes((prev) => {
      if (prev.length <= 3) {
        const updated = [...prev];
        updated[index] = '';
        return updated;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const addSuggestion = (text: string) => {
    setGratitudes((prev) => {
      const emptyIndex = prev.findIndex((g) => !g.trim());
      if (emptyIndex !== -1) {
        const updated = [...prev];
        updated[emptyIndex] = text;
        return updated;
      }
      return [...prev, text];
    });
  };

  const appendNoteIdea = (text: string) => {
    setRawNotes((prev) => (prev ? `${prev}\n• ${text}` : text));
  };

  // 🪄 AI Mind Diary Generator: Transforms simple notes into polished diary
  const handleGenerateMindDiary = async () => {
    if (isGeneratingDiary) return;
    setIsGeneratingDiary(true);
    try {
      const activeMoodObj = MOOD_OPTIONS.find((m) => m.label === selectedMood) || MOOD_OPTIONS[0];
      const validGratitudes = gratitudes.filter((g) => g.trim());
      const footprintSummary = footprints
        .filter((f) => f.active)
        .map((f) => `[${f.name}]: ${f.summary}`)
        .join(', ');

      const userName = sharedState?.userProfile?.basic?.nickname || sharedState?.userProfile?.basic?.name || '나';

      const generated = await invokeMindDiaryLLM({
        rawNotes: rawNotes.trim(),
        mood: `${activeMoodObj.emoji} ${activeMoodObj.label}`,
        gratitudes: validGratitudes,
        footprintSummary,
        userName,
      });

      if (generated && generated.trim()) {
        setMindDiary(generated.trim());
        setIsEditingDiary(false);
      }
    } catch (err) {
      console.error('[EpilogueDiary] AI Diary generation failed:', err);
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  // Request Lucy's Midnight Reflection
  const handleRequestAiReflection = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const activeMoodObj = MOOD_OPTIONS.find((m) => m.label === selectedMood) || MOOD_OPTIONS[0];
      const validGratitudes = gratitudes.map((g) => g.trim()).filter(Boolean);
      
      const footprintSummary = footprints
        .filter((f) => f.active)
        .map((f) => `[${f.name}]: ${f.summary}`)
        .join(', ');

      const systemPrompt = `당신은 PRISM 우주의 지혜롭고 다정한 수호자 루시(Lucy)입니다.
사용자가 오늘 하루를 마무리하며 작성한 소울 마음일기와 5대 우주 활동(Secret, Lucky, Letting Go, Ho'oponopono, Art)을 보고, 
따뜻하고 시적이며 깊은 위로와 평화가 담긴 3~4문장의 "자정의 축복 성찰 메시지(Midnight Whisper)"를 건네주세요.
오늘 하루를 온전히 안아주고, 내일을 향한 편안한 안식을 축복해 주세요.`;

      const userContent = `[사용자 오늘의 다이어리]
- 오늘의 기분/에너지: ${activeMoodObj.emoji} ${activeMoodObj.label}
- 감사한 일들: ${validGratitudes.length > 0 ? validGratitudes.join(' / ') : '마음의 평온함'}
- 오늘의 마음일기: ${mindDiary || rawNotes || '오늘 하루를 무사히 살아내고 마음을 정리함'}
- 오늘 거쳐간 5대 우주 발자취: ${footprintSummary || '하루의 고요한 성찰'}`;

      const res = await invokeEpilogueSummaryLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ]);

      if (res && res.trim()) {
        setAiFeedback(res.trim());
      } else {
        setAiFeedback('오늘 하루도 온 힘을 다해 빛나주신 당신께 깊은 감사를 전합니다. 모든 무거운 짐을 밤하늘에 가볍게 내려놓고, 깊고 고요한 평화 속에서 안식하시길 바랍니다. 내일은 더욱 온전한 빛으로 당신을 맞이할 것입니다.');
      }
    } catch {
      setAiFeedback('오늘 하루 수고 많으셨습니다. 당신이 걸어온 모든 순간이 아름다운 배움이었음을 기억하세요. 평온한 밤 보내시길 기도합니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Diary Entry
  const handleSaveDiary = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const activeMoodObj = MOOD_OPTIONS.find((m) => m.label === selectedMood) || MOOD_OPTIONS[0];
      const validGratitudes = gratitudes.map((g) => g.trim()).filter(Boolean);

      const effectiveDiary = mindDiary.trim() || rawNotes.trim() || '오늘 하루를 평온하게 마무리함';

      const newEntry: EpilogueDiaryEntry = {
        id: existingTodayEntry?.id || `epilogue_${todayKey}_${Date.now()}`,
        dateKey: todayKey,
        createdAt: Date.now(),
        mood: selectedMood,
        moodEmoji: activeMoodObj.emoji,
        gratitudes: validGratitudes,
        rawNotes: rawNotes.trim(),
        mindDiary: effectiveDiary,
        aiFeedback: aiFeedback.trim() || undefined,
        cosmicFootprint: {
          orange: orangeData ? 'Secret 완료' : undefined,
          trinity: trinityData ? 'Lucky 완료' : undefined,
          heal: healData ? 'Letting Go 완료' : undefined,
          bluebird: hoponoponoData ? 'Ho\'oponopono 완료' : undefined,
          muse: museData ? 'Art 완료' : undefined,
        },
      };

      let finalMergedEntries: EpilogueDiaryEntry[] = [];
      setEntries((prev) => {
        let diskEntries: EpilogueDiaryEntry[] = [];
        try {
          const cached = localStorage.getItem('epilogue_diary_history');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) diskEntries = parsed;
          }
        } catch (_) {}

        const map = new Map<string, EpilogueDiaryEntry>();
        diskEntries.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
        prev.forEach((e) => { if (e?.dateKey) map.set(e.dateKey, e); });
        map.set(todayKey, newEntry);

        const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        try {
          localStorage.setItem('epilogue_diary_history', JSON.stringify(merged));
          localStorage.setItem(`epilogue_diary_draft_${todayKey}`, JSON.stringify(newEntry));
        } catch (_) {}
        finalMergedEntries = merged;
        return merged;
      });

      await updateSharedState(
        {
          epilogueHistory: finalMergedEntries,
          epilogueMemory: effectiveDiary || aiFeedback || `${todayKey} 성찰 완료`,
        },
        'epilogue'
      ).catch(() => {});

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('[EpilogueDiary] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = async (key: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  // Delete an entry from history
  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 성찰 다이어리 기록을 삭제하시겠습니까?')) return;

    const filtered = entries.filter((item) => item.id !== id);
    setEntries(filtered);
    try {
      localStorage.setItem('epilogue_diary_history', JSON.stringify(filtered));
    } catch {
      // ignore
    }
    await updateSharedState({ epilogueHistory: filtered }, 'epilogue').catch(() => {});
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-home md:pt-home-md space-y-8 pb-16">
      {/* 🌟 Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass p-6 sm:p-8 rounded-[36px] border border-purple-500/20 shadow-2xl relative overflow-hidden backdrop-blur-2xl space-y-4 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10 opacity-70 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-mono">
                <Calendar size={12} className="text-purple-400" />
                {todayKey} • 오늘 하루의 피날레
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70 font-mono">
                SOUL DIARY
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
              오늘 하루의 소울 다이어리 &amp; 마음일기
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/70 font-sans leading-relaxed">
              자유롭게 적은 생각과 감정이 AI의 감성 문체와 Kore 음성으로 살아 숨 쉬는 나만의 밤 공간입니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {autoSaved && (
              <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 animate-pulse px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check size={12} className="text-emerald-400" />
                자동 저장됨
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDiary}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold font-sans transition-all cursor-pointer shadow-lg shadow-purple-500/20 active:scale-95 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white border border-purple-300/30"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : savedSuccess ? (
                <Check size={15} className="text-white animate-bounce" />
              ) : (
                <Save size={15} />
              )}
              <span>{savedSuccess ? '기록 저장됨' : '다이어리 저장'}</span>
            </button>
          </div>
        </div>

        {/* 5 Universe Footprints Micro Cards */}
        <div className="pt-2 border-t border-white/10 relative z-10 space-y-2">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
            <Compass size={13} className="text-purple-400" />
            오늘의 5대 우주 발자취 (Cosmic Footprints)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {footprints.map((fp) => {
              const Icon = fp.icon;
              return (
                <div
                  key={fp.app}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 ${
                    fp.active
                      ? 'bg-white/10 border-white/20 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-white/70">{fp.name}</span>
                    <Icon size={14} style={{ color: fp.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{fp.title}</p>
                    <p className="text-[9px] text-white/50 truncate font-mono">
                      {fp.active ? '기록 연동됨' : '여정 대기 중'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 🌟 Main Diary Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass p-6 sm:p-8 rounded-[36px] border border-white/10 shadow-2xl backdrop-blur-2xl space-y-6 relative overflow-hidden group"
      >
        {/* Section 1: Mood & Energy Spectrum */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-white/60 tracking-wider font-sans uppercase flex items-center gap-2">
            <Heart size={14} className="text-pink-400" />
            오늘 밤 나의 에너지 &amp; 마음 상태
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const active = selectedMood === mood.label;
              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setSelectedMood(mood.label)}
                  className="px-3 py-2.5 rounded-2xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-md"
                  style={{
                    background: active ? mood.color : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${active ? mood.border : 'rgba(255, 255, 255, 0.08)'}`,
                    color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    boxShadow: active ? `0 0 15px ${mood.color}` : 'none',
                    transform: active ? 'scale(1.02)' : 'none',
                  }}
                >
                  <span className="text-base">{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: 3 Gratitudes */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-white/80 tracking-wider font-sans uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              오늘 하루 감사한 일 3가지 (3 Gratitudes)
            </label>
            <span className="text-[10px] text-purple-200/60 font-mono">
              PC · 모바일 공통 최소 3가지 기록
            </span>
          </div>

          <div className="space-y-2.5">
            {gratitudes.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2 group/input">
                <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-purple-300 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={g}
                  onChange={(e) => updateGratitude(idx, e.target.value)}
                  placeholder={`감사한 일 ${idx + 1} (예: ${GRATITUDE_SUGGESTIONS[idx] || '오늘 나를 웃게 해 준 일'})`}
                  className="flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-white/95 placeholder-white/20 outline-none transition-all duration-200 bg-white/[0.03] backdrop-blur-md border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.06]"
                />
                {g.trim() ? (
                  <button
                    type="button"
                    onClick={() => removeGratitudeField(idx)}
                    className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-white/30 hover:text-rose-300 border border-white/5 transition-all cursor-pointer shrink-0"
                    title={gratitudes.length > 3 ? "항목 삭제" : "입력 지우기"}
                  >
                    <Trash2 size={13} />
                  </button>
                ) : gratitudes.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => removeGratitudeField(idx)}
                    className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-white/30 hover:text-rose-300 border border-white/5 transition-all cursor-pointer shrink-0"
                    title="빈 항목 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Action Row: Preset Chips & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1 mr-1">
                <Plus size={10} /> 추천 키워드:
              </span>
              {GRATITUDE_SUGGESTIONS.slice(0, 4).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => addSuggestion(sug)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white/90 border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  + {sug}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={addGratitudeField}
              className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-bold font-sans bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 shadow-xs"
            >
              <Plus size={11} className="text-purple-300" />
              <span>감사 항목 추가</span>
            </button>
          </div>
        </div>

        {/* 🌟 Section 3: 오늘의 마음일기 (Today's Mind Diary) */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-white/80 tracking-wider font-sans uppercase flex items-center gap-2">
                <PenLine size={15} className="text-purple-400" />
                오늘의 마음일기 (Today's Mind Diary)
              </label>
              <p className="text-[11px] text-purple-200/60 font-sans mt-0.5">
                생각이나 오늘 있었던 일을 자유롭게 적고 버튼을 누르면 AI가 아름다운 감성 일기로 완성해 줍니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateMindDiary}
              disabled={isGeneratingDiary}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold font-sans transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-95 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 self-start sm:self-auto shrink-0"
            >
              {isGeneratingDiary ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-purple-200" />
                  <span>AI 마음일기 짓는 중...</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} className="text-amber-300" />
                  <span>✨ AI 마음일기로 완성하기</span>
                </>
              )}
            </button>
          </div>

          {/* User Raw Notes / Draft Input */}
          <div className="space-y-2">
            <textarea
              rows={3}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="오늘 하루 있었던 일, 스쳐간 감정, 짧은 메모나 키워드를 자유롭게 적어보세요... (예: 오늘 프로젝트 끝내서 홀가분함. 저녁 산책 때 시원한 바람이 좋았음)"
              className="w-full p-4 rounded-2xl text-xs sm:text-sm text-white/95 placeholder-white/20 outline-none transition-all duration-200 bg-white/[0.03] backdrop-blur-md border border-white/10 focus:border-purple-400/60 focus:bg-white/[0.06] resize-none leading-relaxed"
            />

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1 mr-1">
                <Plus size={10} /> 메모 예시:
              </span>
              {DIARY_NOTE_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => appendNoteIdea(idea)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white/90 border border-white/5 transition-all cursor-pointer"
                >
                  + {idea}
                </button>
              ))}
            </div>
          </div>

          {/* 🌟 AI Generated / Polished Mind Diary Display & Kore TTS Voice */}
          <AnimatePresence>
            {mindDiary ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black/50 border border-purple-400/30 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent pointer-events-none" />

                {/* Top Control Bar of Mind Diary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/30 flex items-center gap-1 font-mono">
                      <Sparkles size={11} className="text-amber-300" />
                      완성된 소울 마음일기
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {todayKey}
                    </span>
                  </div>

                  {/* Action Group: TTS Kore, Edit, Copy */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* TTS Kore Voice Player Button */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-bold transition-all shadow-sm">
                      <span className="text-[11px] font-sans">Kore 음성</span>
                      <TTSButton
                        text={mindDiary}
                        voice="Kore"
                        className="text-purple-200 hover:text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingDiary(!isEditingDiary)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>{isEditingDiary ? '편집 완료' : '직접 수정'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText('mindDiary', mindDiary)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                      title="일기 본문 복사"
                    >
                      {copiedKey === 'mindDiary' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Diary Body Content */}
                <div className="relative z-10">
                  {isEditingDiary ? (
                    <textarea
                      rows={5}
                      value={mindDiary}
                      onChange={(e) => setMindDiary(e.target.value)}
                      className="w-full p-4 rounded-2xl text-xs sm:text-sm text-white/95 placeholder-white/20 outline-none transition-all duration-200 bg-black/40 backdrop-blur-md border border-purple-400/50 focus:bg-black/60 resize-none leading-relaxed font-serif"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-purple-50/95 leading-relaxed sm:leading-loose font-serif whitespace-pre-line tracking-wide break-keep">
                      {mindDiary}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-white/40 font-sans flex items-center justify-center gap-2">
                <Wand2 size={13} className="text-purple-400/60" />
                <span>간단한 메모를 적고 [✨ AI 마음일기로 완성하기] 버튼을 누르면 품격 있는 일기가 생성되고 Kore 음성으로 들을 수 있습니다.</span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 4: Lucy AI Midnight Whisper */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-white/60 tracking-wider font-sans uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-pink-400" />
              루시 AI 자정의 속삭임 (Lucy's Midnight Whisper)
            </label>
            <button
              type="button"
              onClick={handleRequestAiReflection}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold font-sans bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-purple-300" />
                  <span>축복 메시지 수신 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>루시에게 자정 축복 받기</span>
                </>
              )}
            </button>
          </div>

          {aiFeedback ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-100/90 text-xs sm:text-sm leading-relaxed font-sans relative shadow-inner space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Moon size={14} />
                  <span>루시의 자정 메시지</span>
                </div>
                <div className="flex items-center gap-1">
                  <TTSButton
                    text={aiFeedback}
                    voice="Kore"
                    className="text-purple-300 hover:text-white"
                  />
                </div>
              </div>
              <p className="whitespace-pre-line break-keep">{aiFeedback}</p>
            </motion.div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-white/40 font-sans">
              마음일기를 작성한 후 [루시에게 자정 축복 받기]를 누르면 따뜻한 하루 피날레 메시지가 도착합니다.
            </div>
          )}
        </div>
      </motion.div>

      {/* 🌟 Archive & Past Reflections Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-base font-bold font-sans text-white flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            지난 성찰 다이어리 기록 보관함 ({entries.length})
          </h3>
          <span className="text-xs text-white/40 font-mono">저장된 소울 아카이브</span>
        </div>

        {entries.length === 0 ? (
          <div className="glass p-8 rounded-3xl border border-white/10 text-center text-white/40 text-xs font-sans space-y-2">
            <Moon size={28} className="mx-auto text-purple-400/40 animate-pulse" />
            <p>아직 작성된 성찰 다이어리가 없습니다.</p>
            <p className="text-[11px] text-white/30">오늘 첫 번째 마음일기를 작성하고 저장해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isExpanded = expandedEntryId === entry.id;
              const formattedDate = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              });

              const diaryContent = entry.mindDiary || entry.reflection || (entry.gratitudes || []).join(', ') || '성찰 기록';

              return (
                <motion.div
                  key={entry.id}
                  layout
                  className="glass p-5 rounded-3xl border border-white/10 shadow-lg hover:border-purple-500/30 transition-all backdrop-blur-xl space-y-3"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{entry.moodEmoji || '😌'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {formattedDate}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {entry.mood}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 truncate font-sans mt-0.5 font-serif">
                          {diaryContent}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quick Kore TTS Button on Timeline Card */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <TTSButton
                          text={diaryContent}
                          voice="Kore"
                          className="text-purple-300 hover:text-white scale-90"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteEntry(entry.id, e)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-white/30 hover:text-rose-300 transition-all cursor-pointer"
                        title="기록 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-1 rounded-full text-white/40">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-white/10 space-y-3 text-xs text-white/80 font-sans"
                      >
                        {/* Gratitudes */}
                        {entry.gratitudes && entry.gratitudes.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-amber-300/80 flex items-center gap-1.5 font-mono">
                              <Sparkles size={12} /> 감사한 순간들:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-white/75 pl-1">
                              {entry.gratitudes.map((g, gIdx) => (
                                <li key={gIdx}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mind Diary Full Text */}
                        {(entry.mindDiary || entry.reflection) && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-purple-300/80 flex items-center gap-1.5 font-mono">
                                <PenLine size={12} /> 오늘의 마음일기:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <TTSButton
                                  text={entry.mindDiary || entry.reflection || ''}
                                  voice="Kore"
                                  className="text-purple-300 hover:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(`archive_${entry.id}`, entry.mindDiary || entry.reflection || '')}
                                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                                  title="복사"
                                >
                                  {copiedKey === `archive_${entry.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                            <p className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 whitespace-pre-line leading-relaxed text-purple-100/90 font-serif text-xs sm:text-sm">
                              {entry.mindDiary || entry.reflection}
                            </p>
                          </div>
                        )}

                        {/* Legacy Anchor if exists in old records */}
                        {entry.anchor && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-indigo-300/80 flex items-center gap-1.5 font-mono">
                              <Moon size={12} /> 소울 앵커:
                            </span>
                            <p className="text-indigo-200/90 font-medium italic pl-1">
                              "{entry.anchor}"
                            </p>
                          </div>
                        )}

                        {/* AI Feedback */}
                        {entry.aiFeedback && (
                          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1 text-purple-100/90 leading-relaxed">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest font-mono flex items-center gap-1">
                                <Sparkles size={11} /> 루시의 피날레 조언
                              </span>
                              <TTSButton
                                text={entry.aiFeedback}
                                voice="Kore"
                                className="text-purple-300 hover:text-white"
                              />
                            </div>
                            <p className="whitespace-pre-line">{entry.aiFeedback}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openLucyChat('epilogue')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold font-sans transition-all cursor-pointer"
                          >
                            <MessageCircle size={12} />
                            <span>루시와 대화 나누기</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
