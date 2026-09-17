import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Check, Compass, TreeDeciduous,
  Activity, Bird, Music, Zap, Moon, Orbit
} from 'lucide-react';
import { safeLocalStorage } from '@/utils/safeStorage';
import { sendPrismToss } from '@/lib/prismToss';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { resolveCanonicalPath } from '@/lib/prismRouteRegistry';
import type { SpecialChannel } from '@/pages/LucyStandalonePage';

export interface LucyResponseRecommendationProps {
  userQuery?: string;
  lucyAnswer: string;
  currentChannels: SpecialChannel[];
  onSwitchChannel: (channels: SpecialChannel[], isMaster: boolean, label: string) => void;
  onNavigate?: (path: string) => void;
}

interface ChannelMeta {
  id: SpecialChannel;
  name: string;
  shortName: string;
  tagline: string;
  badgeLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badgeClass: string;
  hoverClass: string;
  reason: string;
}

const CHANNELS_META: Record<SpecialChannel, ChannelMeta> = {
  orange: {
    id: 'orange',
    name: '오렌지 (성찰)',
    shortName: '오렌지',
    tagline: '1원칙 전략적 분석 & 감정 성찰',
    badgeLabel: '1원칙·전략',
    icon: TreeDeciduous,
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-700 dark:text-orange-300',
    hoverClass: 'hover:bg-orange-500/25 hover:border-orange-500/50',
    reason: '1원칙 사고와 근본 원인 분석, 실행 전략에 특화된 채널',
  },
  trinity: {
    id: 'trinity',
    name: '트리니티 (운명)',
    shortName: '트리니티',
    tagline: '사주원국 & 타로 무의식 통찰',
    badgeLabel: '사주·타로',
    icon: Sparkles,
    color: '#a855f7',
    badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300',
    hoverClass: 'hover:bg-purple-500/25 hover:border-purple-500/50',
    reason: '사주 명리와 타로 상징, 우주적 동시성에 특화된 채널',
  },
  aura: {
    id: 'aura',
    name: '아우라 (치유)',
    shortName: '아우라',
    tagline: '호흡 명상, 신체 이완 & 방하착',
    badgeLabel: '호흡·몸',
    icon: Activity,
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    hoverClass: 'hover:bg-emerald-500/25 hover:border-emerald-500/50',
    reason: '신체 긴장 완화, 1분 호흡, 방하착 이완에 특화된 채널',
  },
  bluebird: {
    id: 'bluebird',
    name: '블루버드 (정화)',
    shortName: '블루버드',
    tagline: '호오포노포노 정화 & 마음 위로',
    badgeLabel: '위로·정화',
    icon: Bird,
    color: '#06b6d4',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
    hoverClass: 'hover:bg-cyan-500/25 hover:border-cyan-500/50',
    reason: '내면아이 보듬기, 호오포노포노 정화와 공감 위로에 특화된 채널',
  },
  muse: {
    id: 'muse',
    name: '뮤즈 (영감)',
    shortName: '뮤즈',
    tagline: '명화·명시·명곡 예술처방 & 창작',
    badgeLabel: '예술·영감',
    icon: Music,
    color: '#ec4899',
    badgeClass: 'bg-pink-500/15 border-pink-500/30 text-pink-700 dark:text-pink-300',
    hoverClass: 'hover:bg-pink-500/25 hover:border-pink-500/50',
    reason: '명화와 명곡 처방, 시적 은유와 창작 영감에 특화된 채널',
  },
};

interface FeatureAppMeta {
  id: string;
  name: string;
  shortName: string;
  featureTitle: string;
  path: string;
  iconText: string;
  runeSymbol: string;
  runeName: string;
  color: string;
  glowColor: string;
  description: string;
  actionLabel: string;
  keywords: string[];
}

const FEATURE_APPS: FeatureAppMeta[] = [
  {
    id: 'trinity',
    name: 'TRINITY',
    shortName: '트리니티 타로',
    featureTitle: '3장의 타로 & 사주 운명 신탁',
    path: '/trinity',
    iconText: '🔮',
    runeSymbol: 'ᛈ',
    runeName: 'Pertho',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.9)',
    description: '3장의 상징 카드로 무의식의 심층 심리를 해독하고 운명의 흐름을 짚어봅니다',
    actionLabel: '타로 오라클 도약',
    keywords: ['타로', '사주', '운명', '미래', '점괘', '선택', '운세', '원국', '대운', '무의식', '카드', '동시성'],
  },
  {
    id: 'orange',
    name: 'ORANGE',
    shortName: '오렌지 성찰',
    featureTitle: '1원칙 성찰 & 소원의 우물',
    path: '/orange',
    iconText: '🍊',
    runeSymbol: 'ᛋ',
    runeName: 'Sowilo',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.9)',
    description: '불안과 감정을 성찰하고 소원의 우물에 소망을 띄우는 비밀의 성찰 숲',
    actionLabel: '소원의 우물 도약',
    keywords: ['소원', '우물', '성찰', '1원칙', '전략', '의사결정', '감정', '계획', '목표', '분석', '불안'],
  },
  {
    id: 'aura',
    name: 'AURA',
    shortName: '아우라 방하착',
    featureTitle: '소울 바이오 & 방하착(放下着) 치유',
    path: '/heal',
    iconText: '🧘',
    runeSymbol: 'ᛉ',
    runeName: 'Algiz',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.9)',
    description: '세도나 방하착 명상과 1분 호흡 조율로 긴장과 번뇌를 내려놓습니다',
    actionLabel: '방하착 치유 도약',
    keywords: ['호흡', '방하착', '내려놓기', '신체', '피로', '수면', '잠', '이완', '명상', '스트레스', '체력'],
  },
  {
    id: 'bluebird',
    name: 'BLUEBIRD',
    shortName: '파랑새 성소',
    featureTitle: '호오포노포노 정화 & 비밀쪽지 성소',
    path: '/bluebird',
    iconText: '🐦',
    runeSymbol: 'ᛒ',
    runeName: 'Berkana',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    description: '미안합니다·용서하세요·감사합니다·사랑합니다 정화와 따뜻한 비밀쪽지 안식처',
    actionLabel: '정화의 성소 도약',
    keywords: ['위로', '정화', '호오포노포노', '상처', '슬픔', '눈물', '우울', '외로', '힘들어', '마음', '비밀쪽지', '내면아이'],
  },
  {
    id: 'muse',
    name: 'MUSE',
    shortName: '뮤즈 예술처방',
    featureTitle: '명화·명시·명곡 예술처방실',
    path: '/muse',
    iconText: '🎨',
    runeSymbol: 'ᚹ',
    runeName: 'Wunjo',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.9)',
    description: '메마른 마음에 울림을 주는 클래식 명곡, 명화, 시구 맞춤 예술 처방',
    actionLabel: '예술 처방 도약',
    keywords: ['예술', '명화', '음악', '클래식', '시', '영감', '창작', '글쓰기', '아이디어', '아름다움', '처방'],
  },
  {
    id: 'epilogue',
    name: 'EPILOGUE',
    shortName: '에필로그 서재',
    featureTitle: '밤 서재 하루 마감 영감 일기',
    path: '/epilogue',
    iconText: '🌙',
    runeSymbol: 'ᚨ',
    runeName: 'Ansuz',
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.9)',
    description: '오늘 하루의 깨달음과 감정을 고요히 마무리하고 지혜로 기록하는 밤의 서재',
    actionLabel: '밤의 서재 도약',
    keywords: ['일기', '회고', '마감', '하루', '밤', '서재', '기록', '정리', '마무리', '취침', '오늘'],
  },
  {
    id: 'orb',
    name: 'CRYSTAL ORB',
    shortName: '크리스탈 오브',
    featureTitle: '직관의 즉문즉답(卽問卽答) 신탁',
    path: '/orb',
    iconText: '🔮',
    runeSymbol: 'ᛟ',
    runeName: 'Othala',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    description: '마음속 풀리지 않는 의문에 크리스탈 구슬이 영롱한 직관의 답을 비춥니다',
    actionLabel: '크리스탈 오브 도약',
    keywords: ['즉문즉답', '오브', '신탁', '결정', '궁금', '답', '예스', '노', '직관', '오라클'],
  },
];

export function LucyResponseRecommendation({
  userQuery = '',
  lucyAnswer,
  currentChannels,
  onSwitchChannel,
  onNavigate,
}: LucyResponseRecommendationProps) {
  const [isLeaping, setIsLeaping] = useState(false);

  // 1. 맥락 분석을 통해 최적의 추천 채널 및 추천 기능 도출
  const { recommendedChannel, secondaryChannel, recommendedFeature, themeReason } = useMemo(() => {
    const combined = `${userQuery} ${lucyAnswer}`.toLowerCase();

    // 채널 점수 계산
    const channelScores: Record<SpecialChannel, number> = {
      orange: 0,
      trinity: 0,
      aura: 0,
      bluebird: 0,
      muse: 0,
    };

    // 오렌지 (전략, 1원칙, 선택, 분석, 소원)
    if (/1원칙|전략|계획|로드맵|분석|선택|판단|의사결정|원인|소원|소망/.test(combined)) channelScores.orange += 3;
    // 트리니티 (사주, 타로, 운명, 미래, 운세, 동시성)
    if (/사주|타로|운명|미래|운세|카드|점괘|대운|천간|지지|동시성/.test(combined)) channelScores.trinity += 3;
    // 아우라 (호흡, 신체, 피로, 명상, 방하착, 수면, 몸, 이완)
    if (/호흡|신체|몸|피로|수면|잠|이완|명상|방하착|세도나|스트레스/.test(combined)) channelScores.aura += 3;
    // 블루버드 (위로, 정화, 호오포노포노, 슬픔, 눈물, 상처, 내면아이, 포옹)
    if (/위로|정화|호오포노포노|슬픔|눈물|상처|외로|힘들|따뜻|내면아이/.test(combined)) channelScores.bluebird += 3;
    // 뮤즈 (예술, 영감, 창작, 글쓰기, 시, 음악, 그림, 명화, 카피)
    if (/예술|영감|창작|글쓰기|시|음악|그림|명화|카피|명곡|클래식/.test(combined)) channelScores.muse += 3;

    // 점수 정렬
    const sortedChannels = (Object.keys(channelScores) as SpecialChannel[]).sort(
      (a, b) => channelScores[b] - channelScores[a]
    );

    const topChannelKey = channelScores[sortedChannels[0]] > 0 ? sortedChannels[0] : 'trinity';
    const secondChannelKey = channelScores[sortedChannels[1]] > 0 ? sortedChannels[1] : (topChannelKey === 'orange' ? 'bluebird' : 'orange');

    // 기능(Feature App) 점수 계산
    let bestFeature = FEATURE_APPS[0];
    let maxFeatureScore = -1;

    for (const app of FEATURE_APPS) {
      let score = 0;
      for (const kw of app.keywords) {
        if (combined.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      if (score > maxFeatureScore) {
        maxFeatureScore = score;
        bestFeature = app;
      }
    }

    if (maxFeatureScore <= 0) {
      // 매칭되는 키워드가 적을 때 상위 추천 채널과 동일한 앱 매핑
      const fallbackApp = FEATURE_APPS.find((a) => a.id === topChannelKey) || FEATURE_APPS[0];
      bestFeature = fallbackApp;
    }

    let reason = '질문과 답변의 맥락에 맞춘 최적화 추천';
    if (topChannelKey === 'trinity') reason = '운명과 무의식 상징을 깊이 해독하는 추천';
    else if (topChannelKey === 'orange') reason = '1원칙 논리와 실행 전략에 집중하는 추천';
    else if (topChannelKey === 'aura') reason = '몸의 감각과 호흡, 긴장 완화를 돕는 추천';
    else if (topChannelKey === 'bluebird') reason = '상처받은 마음에 온기와 정화를 불어넣는 추천';
    else if (topChannelKey === 'muse') reason = '예술적 영감과 감성을 일깨우는 추천';

    return {
      recommendedChannel: CHANNELS_META[topChannelKey],
      secondaryChannel: CHANNELS_META[secondChannelKey],
      recommendedFeature: bestFeature,
      themeReason: reason,
    };
  }, [userQuery, lucyAnswer]);

  // 추천 기능으로 도약 실행 (오브의 handleTossToDimension과 동일한 유기적 토스 연동)
  const handleLeapToFeature = (feature: FeatureAppMeta) => {
    if (isLeaping) return;
    setIsLeaping(true);

    const safePath = resolveCanonicalPath(feature.path || '/');
    const targetAppId = feature.id === 'aura' ? 'heal' : feature.id === 'trinity' ? 'oracle' : feature.id;
    const queryStr = userQuery || '루시와의 대화';
    const keyThemeStr = feature.shortName;
    const directAnswerStr = lucyAnswer ? lucyAnswer.slice(0, 180) : '';

    try {
      const tossPayload = {
        source: 'lucy',
        sourceName: '루시 심층 대화',
        targetAppId: feature.id,
        timestamp: Date.now(),
        query: queryStr,
        keyTheme: keyThemeStr,
        directAnswer: directAnswerStr,
        actionSolution: '루시 추천 기능으로 이어서 심화 진행',
      };
      safeLocalStorage.setItem('prism_toss_context', JSON.stringify(tossPayload));
      safeLocalStorage.setItem('pending_prism_toss', JSON.stringify(tossPayload));

      sendPrismToss({
        sourceApp: 'lucy',
        targetApp: targetAppId,
        actionType: 'smart_toss',
        contextMessage: `[루시 대화 연동 도약] ${keyThemeStr}`,
        autoTrigger: true,
        autoPrompt: `[루시 대화 연계] 질문: "${queryStr.slice(0, 100)}" / 루시 조언: "${directAnswerStr.slice(0, 150)}"`,
        orbInsight: {
          query: queryStr,
          keyTheme: keyThemeStr,
          directAnswer: directAnswerStr,
          actionSolution: '루시 추천 기능으로 이어서 심화 진행',
        },
        tossedAt: Date.now(),
      });
    } catch (e) {
      console.warn('[LucyRecommendation] Toss dispatch error:', e);
    }

    try {
      triggerHaptic('bigbang');
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('prism-navigate', { detail: { path: safePath } }));
      window.dispatchEvent(new CustomEvent('nav-click-active', { detail: { path: safePath } }));
    } catch (_) {}

    setTimeout(() => {
      try {
        if (onNavigate) {
          onNavigate(safePath);
        } else if (typeof window !== 'undefined') {
          window.location.href = safePath;
        }
      } catch (err) {
        console.error('[LucyRecommendation] Navigation error:', err);
        setIsLeaping(false);
      }
    }, 280);
  };

  const isCurrentChannelActive = currentChannels.includes(recommendedChannel.id);
  const RecChannelIcon = recommendedChannel.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 space-y-2.5 text-slate-800 dark:text-slate-200"
    >
      {/* 1. 상단 라벨 & 주제 안내 */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
          <Orbit size={13} className="animate-spin text-amber-500" style={{ animationDuration: '10s' }} />
          <span>오브 연계 추천 경로</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
          {themeReason}
        </span>
      </div>

      {/* 2. 추천 채널 전환 섹션 (Recommended Channel Switch) */}
      <div className="flex items-center gap-2 flex-wrap bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold">
            추천 채널
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSwitchChannel([recommendedChannel.id], false, recommendedChannel.name)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
            isCurrentChannelActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400/30'
              : `${recommendedChannel.badgeClass} ${recommendedChannel.hoverClass} active:scale-95`
          }`}
          title={isCurrentChannelActive ? '현재 이 채널로 대화 중입니다.' : `클릭 시 [${recommendedChannel.name}] 채널로 즉시 전환됩니다.`}
        >
          <RecChannelIcon size={13} className="shrink-0" />
          <span>{recommendedChannel.shortName} 채널</span>
          {isCurrentChannelActive ? (
            <span className="flex items-center gap-0.5 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
              <Check size={11} />
              <span>활성 중</span>
            </span>
          ) : (
            <span className="text-[10px] opacity-75 font-normal">전환 ➔</span>
          )}
        </button>

        {/* 보조 추천 채널이 있고 현재 채널과 다를 경우 추가 제공 */}
        {secondaryChannel && secondaryChannel.id !== recommendedChannel.id && (
          <button
            type="button"
            onClick={() => onSwitchChannel([secondaryChannel.id], false, secondaryChannel.name)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer opacity-90 hover:opacity-100 ${secondaryChannel.badgeClass} ${secondaryChannel.hoverClass} active:scale-95`}
            title={`[${secondaryChannel.name}] 채널로 전환`}
          >
            <span>{secondaryChannel.shortName} 채널</span>
            <span className="text-[10px] opacity-60">전환</span>
          </button>
        )}

        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline ml-auto truncate">
          {recommendedChannel.tagline}
        </span>
      </div>

      {/* 3. 추천 기능/차원 도약 배너 (Recommended Feature App Leap - 오브처럼 구현) */}
      <div
        onClick={() => handleLeapToFeature(recommendedFeature)}
        className={`p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-cyan-500/30 flex items-center justify-between gap-3 shadow-md cursor-pointer transition-all hover:border-cyan-400/60 hover:shadow-[0_0_18px_rgba(6,182,212,0.25)] active:scale-[0.99] group ${
          isLeaping ? 'pointer-events-none ring-2 ring-cyan-400/60 animate-pulse' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* 룬 표식 & 행성 아이콘 박스 (오브와 완벽 일치 디자인) */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-serif font-black text-lg text-white shadow-sm"
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, rgba(20,20,35,0.95) 80%)',
              borderColor: recommendedFeature.color,
              boxShadow: `0 0 12px ${recommendedFeature.glowColor}`,
            }}
          >
            {recommendedFeature.runeSymbol}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">
                추천 기능 도약
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {recommendedFeature.name}
              </span>
              <span className="text-amber-300/90 text-[10px] sm:text-[11px] font-serif">
                ({recommendedFeature.runeName} 룬)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5 font-normal">
              {recommendedFeature.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLeaping}
          onClick={(e) => {
            e.stopPropagation();
            handleLeapToFeature(recommendedFeature);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer ${
            isLeaping ? 'opacity-80 cursor-wait animate-pulse' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, ${recommendedFeature.color}, #f59e0b)`,
            boxShadow: `0 0 14px ${recommendedFeature.glowColor}`,
          }}
          title={`${recommendedFeature.shortName} 기능으로 즉시 도약`}
        >
          {isLeaping ? (
            <>
              <Sparkles size={12} className="animate-spin text-black" />
              <span>도약 중...</span>
            </>
          ) : (
            <>
              <span>{recommendedFeature.actionLabel}</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
