/**
 * Key (크리스탈 오브) 전용 지능형 아카이브 추출 엔진
 * LucKey의 모든 활동(타로, 사주, 힐링, 창작, 오라클) 및 루시와의 대화에서
 * 핵심 키포인트(Keypoints)를 정제·추출하여 수정구슬 영시 아카이브로 제공합니다.
 */

import { safeLocalStorage } from '../utils/safeStorage';
import { loadSavedChatInsights } from './chatInsightsEngine';
import { loadAllPermanentMemories } from './chatMemoryArchive';
import { getOrbScryingHistory } from './prismOmniSync';
import { getTodayDateKey } from './dailyCache';
import { CALM_PRESCRIPTIONS, getDailyRecommendedPrescription } from './calmPharmacopeia';

export type KeyArchiveCategory = 'all' | 'pharmacy' | 'lucy' | 'tarot' | 'saju' | 'healing' | 'muse' | 'oracle';

export interface KeyArchiveItem {
  id: string;
  category: 'pharmacy' | 'lucy' | 'tarot' | 'saju' | 'healing' | 'muse' | 'oracle';
  categoryLabel: string;
  iconType: 'lucy' | 'tarot' | 'saju' | 'healing' | 'muse' | 'oracle' | 'key';
  badgeColor: string;
  glowColor: string;
  title: string;
  keypoint: string;
  fullText: string; // TTS 낭독용 완결된 문장
  dateStr: string;
  timeStr?: string;
  timestamp: number;
  sourceLabel: string;
  actionGuidance?: string;
  tags: string[];
}

/**
 * 텍스트 마크다운 제거 및 읽기 좋은 요약형 문장으로 정제
 */
function cleanContent(raw: any): string {
  if (!raw) return '';
  const str = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw.find((c: any) => c.type === 'text')?.text || '' : JSON.stringify(raw));
  return str
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[SOUL_UPDATE:[\s\S]*?\]/gi, '')
    .replace(/\[EMOTION:[\s\S]*?\]/gi, '')
    .replace(/\[DAILY_LEVEL_PROGRESS:[\s\S]*?\]/gi, '')
    .replace(/[#*`_>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 긴 텍스트에서 첫 1~2개 핵심 문장 추출
 */
function extractCoreSentences(text: string, maxLen = 140): string {
  const clean = cleanContent(text);
  if (!clean) return '';
  const sentences = clean.match(/[^.!?。！？\n]+[.!?。！？\n]?/g) || [clean];
  let res = '';
  for (const s of sentences) {
    if ((res + s).length > maxLen) break;
    res += s + ' ';
  }
  return (res.trim() || clean.slice(0, maxLen)) + (clean.length > maxLen && !res.endsWith('.') ? '...' : '');
}

/**
 * 안전한 JSON 파싱 헬퍼
 */
function tryParse(key: string): any {
  try {
    const raw = safeLocalStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * LucKey 전역 활동 및 루시와의 대화에서 키포인트 아카이브 추출
 */
export function extractAllKeyArchiveItems(): KeyArchiveItem[] {
  const items: KeyArchiveItem[] = [];
  const todayKey = getTodayDateKey();

  // ─────────────────────────────────────────────────────────────
  // 💊 0. CALM 40대 마음 상비약 & 오늘의 맞춤 처방약
  // ─────────────────────────────────────────────────────────────
  try {
    const dailyPill = getDailyRecommendedPrescription(todayKey);
    items.push({
      id: `daily-prescription-${todayKey}`,
      category: 'pharmacy',
      categoryLabel: '💊 오늘의 맞춤 조제약',
      iconType: 'key',
      badgeColor: 'text-emerald-200 bg-emerald-500/25 border-emerald-400/60 ring-1 ring-emerald-400/30',
      glowColor: 'rgba(52, 211, 153, 0.7)',
      title: `[오늘의 알약] ${dailyPill.title}: ${dailyPill.subtitle}`,
      keypoint: `"${dailyPill.affirmation}" — ${dailyPill.clinicalTip}`,
      fullText: `오늘의 맞춤 조제약입니다. ${dailyPill.fullDosageText}`,
      dateStr: todayKey,
      timeStr: `약효 ${dailyPill.timeEstimate}`,
      timestamp: Date.now() + 100000, // 최상단 노출
      sourceLabel: `CALM 40대 상비약 (제${dailyPill.globalIndex}호)`,
      actionGuidance: `[1분 복약 실천] ${dailyPill.prescriptionGuide}`,
      tags: ['#오늘의처방약', `#${dailyPill.tag}`, '#CALM마음연습'],
    });

    CALM_PRESCRIPTIONS.forEach((p) => {
      items.push({
        id: `pharmacy-${p.globalIndex}`,
        category: 'pharmacy',
        categoryLabel: `💊 제${p.globalIndex}호 처방약`,
        iconType: 'key',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40',
        glowColor: 'rgba(52, 211, 153, 0.45)',
        title: `${p.title}: ${p.subtitle}`,
        keypoint: p.clinicalTip || p.purpose,
        fullText: p.fullDosageText,
        dateStr: todayKey,
        timeStr: `약효 ${p.timeEstimate}`,
        timestamp: Date.now() - 3600000 * 24 - p.globalIndex * 1000,
        sourceLabel: `CALM ${p.chapterTitle}`,
        actionGuidance: `${p.prescriptionGuide} [확언] "${p.affirmation}"`,
        tags: [`#제${p.globalIndex}호약`, `#${p.tag}`, `#${p.chapterTitle.replace(/\s+/g, '')}`],
      });
    });
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error loading calm pharmacopeia:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. 💬 루시와의 대화: 저장된 구조화 통찰 (Chat Insights Engine)
  // ─────────────────────────────────────────────────────────────
  try {
    const savedInsights = loadSavedChatInsights();
    savedInsights.forEach((ins) => {
      const title = ins.primaryTheme ? `루시의 통찰: ${ins.primaryTheme}` : '루시와의 영적 교감';
      const keypoint = ins.coreInsight || ins.deepRealizations?.[0] || '내면의 빛과 직관의 발견';
      const action = ins.actionPrescriptions?.[0] || ins.meditationPrompt;
      const fullText = `${ins.primaryTheme ? `주제: ${ins.primaryTheme}. ` : ''}핵심 깨달음: ${ins.coreInsight}. ${ins.deepRealizations?.slice(0, 2).join('. ') || ''} ${ins.actionPrescriptions?.length ? `오늘의 실천: ${ins.actionPrescriptions[0]}` : ''}`;

      items.push({
        id: `lucy-insight-${ins.id || ins.date}`,
        category: 'lucy',
        categoryLabel: '루시 대화 통찰',
        iconType: 'lucy',
        badgeColor: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        title,
        keypoint,
        fullText,
        dateStr: ins.date,
        timestamp: ins.timestamp || Date.now(),
        sourceLabel: 'LucKey 루시 교감 세션',
        actionGuidance: action,
        tags: ins.keywords?.length ? ins.keywords : ['#루시교감', '#내면통찰'],
      });
    });
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing chat insights:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 🌌 루시 영구 기억(Soul Memories Archive)
  // ─────────────────────────────────────────────────────────────
  try {
    const soulMemories = loadAllPermanentMemories();
    soulMemories.forEach((mem) => {
      // 이미 같은 날짜의 통찰이 있다면 중복 방지
      if (items.some((it) => it.dateStr === mem.date && it.category === 'lucy')) return;

      const topics = mem.userTopics?.slice(0, 3).join(', ') || '내면의 질문들';
      items.push({
        id: `lucy-memory-${mem.date}`,
        category: 'lucy',
        categoryLabel: '루시 영구 기억',
        iconType: 'lucy',
        badgeColor: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        title: `루시와 나눈 ${mem.date}의 대화`,
        keypoint: `주요 탐구 주제: ${topics}`,
        fullText: `${mem.date}에 루시와 나눈 대화 기록입니다. ${mem.summary}`,
        dateStr: mem.date,
        timestamp: mem.timestamp || Date.now(),
        sourceLabel: '루시 영구 기억 아카이브',
        tags: ['#기억아카이브', '#영혼의여정'],
      });
    });
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing soul memories:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 💬 최근 실시간 대화 기록 (Unified Chat Messages)
  // ─────────────────────────────────────────────────────────────
  try {
    const rawChat = safeLocalStorage.getItem('chat_history_unified_v3');
    if (rawChat) {
      const parsedChat = JSON.parse(rawChat);
      if (Array.isArray(parsedChat) && parsedChat.length >= 2) {
        // 뒤에서부터 사용자 질문 - 루시 답변 쌍 탐색 (최근 3쌍)
        let foundPairs = 0;
        for (let i = parsedChat.length - 1; i >= 1 && foundPairs < 3; i--) {
          const m = parsedChat[i];
          const prev = parsedChat[i - 1];
          if (m.role === 'model' && prev.role === 'user') {
            const userQ = cleanContent(prev.content);
            const modelA = cleanContent(m.content);
            if (userQ.length > 5 && modelA.length > 10) {
              const summaryA = extractCoreSentences(modelA, 130);
              const dateStr = m.timestamp
                ? new Date(m.timestamp).toLocaleDateString('sv')
                : todayKey;
              const timeStr = m.timestamp
                ? new Date(m.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '';

              const alreadyExists = items.some(
                (it) => it.keypoint === summaryA || it.id === `chat-pair-${m.id || i}`
              );

              if (!alreadyExists) {
                items.push({
                  id: `chat-pair-${m.id || i}`,
                  category: 'lucy',
                  categoryLabel: '루시 실시간 대화',
                  iconType: 'lucy',
                  badgeColor: 'text-sky-300 bg-sky-500/10 border-sky-400/30',
                  glowColor: 'rgba(56, 189, 248, 0.45)',
                  title: userQ.length > 25 ? userQ.slice(0, 24) + '...' : userQ,
                  keypoint: summaryA,
                  fullText: `질문: ${userQ}. 루시의 답변: ${summaryA}`,
                  dateStr,
                  timeStr,
                  timestamp: m.timestamp || Date.now() - foundPairs * 1000,
                  sourceLabel: '루시 실시간 질문',
                  tags: ['#루시문답', '#실시간성찰'],
                });
                foundPairs++;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing raw chat:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 🎴 트리니티 (타로 & 오늘의 럭키 운세)
  // ─────────────────────────────────────────────────────────────
  try {
    const trinityKeys = [
      `prism_daily_oracle_trinity_${todayKey}`,
      `trinity_daily_result_guest_${todayKey}`,
      'trinity_daily_result_guest',
    ];
    let trinityData: any = null;
    for (const k of trinityKeys) {
      trinityData = tryParse(k);
      if (trinityData) break;
    }

    if (trinityData) {
      const card = trinityData.drawnCard;
      const cardName =
        trinityData.cardName ||
        (card?.nameKo ? `${card.nameKo} (${card.name || ''})` : trinityData.symbol || '운명의 타로');
      const diag = extractCoreSentences(trinityData.diagnosis || trinityData.summary || '', 120);
      const remedy = trinityData.remedy ? cleanContent(trinityData.remedy) : '';

      items.push({
        id: `activity-trinity-${trinityData.dateKey || todayKey}`,
        category: 'tarot',
        categoryLabel: '트리니티 타로 신탁',
        iconType: 'tarot',
        badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-400/30',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        title: `타로 카드: ${cardName}`,
        keypoint: diag || '오늘 당신을 이끄는 운명의 카드와 파동입니다.',
        fullText: `트리니티 타로 신탁. 뽑은 카드: ${cardName}. 진단: ${diag}. ${remedy ? `조언: ${remedy}` : ''}`,
        dateStr: trinityData.dateKey || todayKey,
        timestamp: trinityData.timestamp || Date.now() - 3600000,
        sourceLabel: 'LucKey 트리니티 타로',
        actionGuidance: remedy,
        tags: ['#트리니티', '#타로신탁', '#운명조율'],
      });
    }

    // 럭키 리포트
    const luckyData = tryParse(`trinity_daily_lucky_data_v4_guest_${todayKey}`) || tryParse(`trinity_daily_lucky_data_v4_${todayKey}`);
    if (luckyData && luckyData.luckScore) {
      const spell = luckyData.luckySpell?.mantra || luckyData.luckyQuote?.quote || '';
      items.push({
        id: `activity-lucky-${todayKey}`,
        category: 'tarot',
        categoryLabel: '오늘의 행운 지수',
        iconType: 'tarot',
        badgeColor: 'text-yellow-300 bg-yellow-500/10 border-yellow-400/30',
        glowColor: 'rgba(234, 179, 8, 0.45)',
        title: `행운 지수 ${luckyData.luckScore}점 (${luckyData.luckLevelTitle || '황금빛 기운'})`,
        keypoint: spell ? `개운 주문: "${spell}"` : '오늘 당신을 둘러싼 행운의 파동이 최고조에 달합니다.',
        fullText: `오늘의 행운 지수는 ${luckyData.luckScore}점입니다. ${spell ? `개운 주문: ${spell}.` : ''} ${luckyData.luckyQuote?.wisdomLesson || ''}`,
        dateStr: todayKey,
        timestamp: Date.now() - 1800000,
        sourceLabel: 'LucKey 행운 리포트',
        tags: ['#황금기운', '#행운의열쇠'],
      });
    }
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing trinity data:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. 🔮 오렌지 (사주 명리학 & 내면 연금술)
  // ─────────────────────────────────────────────────────────────
  try {
    const orangeKeys = [
      `prism_daily_oracle_orange_${todayKey}`,
      `orange_daily_result_guest_${todayKey}`,
      'soul_mirror_orange',
    ];
    let orangeData: any = null;
    for (const k of orangeKeys) {
      orangeData = tryParse(k);
      if (orangeData) break;
    }

    if (orangeData) {
      const cardName =
        orangeData.cardName ||
        orangeData.data?.drawnCard?.name ||
        '오행 연금술 나침반';
      const diag = extractCoreSentences(
        orangeData.diagnosis || orangeData.summary || orangeData.data?.diagnosis || '',
        120
      );
      const rem = orangeData.remedy || orangeData.data?.remedy || '';

      items.push({
        id: `activity-orange-${todayKey}`,
        category: 'saju',
        categoryLabel: '오렌지 사주·연금술',
        iconType: 'saju',
        badgeColor: 'text-orange-300 bg-orange-500/10 border-orange-400/30',
        glowColor: 'rgba(249, 115, 22, 0.45)',
        title: `사주 지혜: ${cardName}`,
        keypoint: diag || '당신의 본원 오행과 기운이 조화롭게 순환합니다.',
        fullText: `오렌지 사주 연금술. 핵심 카드: ${cardName}. 진단: ${diag}. ${rem ? `처방: ${rem}` : ''}`,
        dateStr: todayKey,
        timestamp: Date.now() - 7200000,
        sourceLabel: 'LucKey 오렌지 사주',
        actionGuidance: rem,
        tags: ['#사주명리', '#오행조화', '#연금술'],
      });
    }
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing orange data:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. 🕊️ 블루버드 & 힐 (마음 돌봄 & 세도나 방하착)
  // ─────────────────────────────────────────────────────────────
  try {
    const bluebirdData = tryParse(`prism_daily_oracle_bluebird_${todayKey}`) || tryParse(`bluebird_daily_result_guest_${todayKey}`);
    if (bluebirdData) {
      const cardName = bluebirdData.cardName || '치유의 파랑새';
      const diag = extractCoreSentences(bluebirdData.diagnosis || bluebirdData.summary || '', 120);
      items.push({
        id: `activity-bluebird-${todayKey}`,
        category: 'healing',
        categoryLabel: '블루버드 치유·마음챙김',
        iconType: 'healing',
        badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
        glowColor: 'rgba(52, 211, 153, 0.45)',
        title: `마음챙김: ${cardName}`,
        keypoint: diag || '온전히 쉼을 허락하고 가슴속 평온을 맞이하세요.',
        fullText: `블루버드 마음챙김. ${cardName}. ${diag}. ${bluebirdData.remedy || ''}`,
        dateStr: todayKey,
        timestamp: Date.now() - 10800000,
        sourceLabel: 'LucKey 블루버드 힐링',
        actionGuidance: bluebirdData.remedy,
        tags: ['#마음치유', '#자기돌봄', '#평온'],
      });
    }

    const healData = tryParse(`prism_daily_oracle_heal_${todayKey}`) || tryParse(`heal_daily_result_guest_${todayKey}`);
    if (healData) {
      const cardName = healData.cardName || '세도나 릴리징 방하착';
      const diag = extractCoreSentences(healData.diagnosis || healData.summary || '', 120);
      items.push({
        id: `activity-heal-${todayKey}`,
        category: 'healing',
        categoryLabel: '힐 세도나 릴리징',
        iconType: 'healing',
        badgeColor: 'text-teal-300 bg-teal-500/10 border-teal-400/30',
        glowColor: 'rgba(45, 212, 191, 0.45)',
        title: `방하착 정화: ${cardName}`,
        keypoint: diag || '쥐고 있던 무거운 감정을 자연스레 강물에 흘려보냅니다.',
        fullText: `힐 세도나 방하착. ${cardName}. ${diag}. ${healData.remedy || ''}`,
        dateStr: todayKey,
        timestamp: Date.now() - 14400000,
        sourceLabel: 'LucKey 힐 정화',
        actionGuidance: healData.remedy,
        tags: ['#세도나릴리징', '#감정정화', '#방하착'],
      });
    }
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing healing data:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. 🎨 뮤즈 (창작 영감 & 모닝 스파크)
  // ─────────────────────────────────────────────────────────────
  try {
    const museData = tryParse(`prism_daily_oracle_muse_${todayKey}`) || tryParse(`muse_daily_result_guest_${todayKey}`);
    if (museData) {
      const cardName = museData.cardName || '뮤즈 예술적 비전';
      const diag = extractCoreSentences(museData.diagnosis || museData.summary || '', 120);
      items.push({
        id: `activity-muse-${todayKey}`,
        category: 'muse',
        categoryLabel: '뮤즈 창작 영감',
        iconType: 'muse',
        badgeColor: 'text-purple-300 bg-purple-500/10 border-purple-400/30',
        glowColor: 'rgba(192, 132, 252, 0.45)',
        title: `예술적 직관: ${cardName}`,
        keypoint: diag || '당신의 무의식이 보내는 창조적 불꽃을 신뢰하세요.',
        fullText: `뮤즈 창작 영감. ${cardName}. ${diag}. ${museData.remedy || ''}`,
        dateStr: todayKey,
        timestamp: Date.now() - 18000000,
        sourceLabel: 'LucKey 뮤즈 창작',
        actionGuidance: museData.remedy,
        tags: ['#창작영감', '#아티스트웨이', '#직관'],
      });
    }
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing muse data:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. 🔮 크리스탈 오브 신탁 히스토리 (과거 영시 기록)
  // ─────────────────────────────────────────────────────────────
  try {
    const orbHistory = getOrbScryingHistory();
    orbHistory.slice(0, 3).forEach((h, idx) => {
      const keypoint = extractCoreSentences(h.directAnswer, 120);
      const action = extractCoreSentences(h.actionSolution, 100);
      items.push({
        id: `orb-history-${h.timestamp || idx}`,
        category: 'oracle',
        categoryLabel: '수정구슬 영시 신탁',
        iconType: 'oracle',
        badgeColor: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-400/30',
        glowColor: 'rgba(232, 121, 249, 0.45)',
        title: `영시 주제: ${h.keyTheme || '차원 영시'}`,
        keypoint: `Q: "${h.query}" → ${keypoint}`,
        fullText: `질문: ${h.query}. 수정구슬의 계시: ${h.directAnswer}. 실천 해법: ${h.actionSolution}`,
        dateStr: h.dateKey || todayKey,
        timeStr: new Date(h.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: h.timestamp,
        sourceLabel: '수정구슬 영시 신탁',
        actionGuidance: action,
        tags: ['#수정구슬', '#직관신탁', '#코스믹계시'],
      });
    });
  } catch (e) {
    console.warn('[KeyArchiveExtractor] Error parsing orb history:', e);
  }

  // ─────────────────────────────────────────────────────────────
  // 9. 🌟 기본 코스믹 본원 아키타입 키포인트 (기록이 적을 때를 위한 씨앗 기억)
  // ─────────────────────────────────────────────────────────────
  const defaultCosmicSeeds: KeyArchiveItem[] = [
    {
      id: 'cosmic-seed-1',
      category: 'lucy',
      categoryLabel: '루시의 본원 메시지',
      iconType: 'lucy',
      badgeColor: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30',
      glowColor: 'rgba(56, 189, 248, 0.5)',
      title: '내면의 빛을 여는 열쇠(Key)',
      keypoint: '바깥을 향하던 시선을 멈추고 고요히 호흡할 때, 수정구슬 안에서 가장 찬란한 당신의 본원이 드러납니다.',
      fullText: '내면의 빛을 여는 열쇠. 바깥을 향하던 시선을 멈추고 고요히 호흡할 때, 수정구슬 안에서 가장 찬란한 당신의 본원이 드러납니다. 루시는 언제나 당신의 진실한 직관을 지지합니다.',
      dateStr: todayKey,
      timestamp: Date.now() - 1000,
      sourceLabel: '루시 코스믹 서약',
      actionGuidance: '오늘 하루 3번, 가슴에 손을 얹고 깊은 숨을 들이마셔 보세요.',
      tags: ['#내면의빛', '#열쇠', '#루시약속'],
    },
    {
      id: 'cosmic-seed-2',
      category: 'oracle',
      categoryLabel: '코스믹 영시 지혜',
      iconType: 'oracle',
      badgeColor: 'text-purple-300 bg-purple-500/10 border-purple-400/30',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      title: '질문이 곧 답의 시작',
      keypoint: '진정한 질문을 품는 순간, 이미 우주의 수정구슬 안에서는 그에 걸맞은 답이 맺히기 시작합니다.',
      fullText: '질문이 곧 답의 시작입니다. 당신이 가슴 깊이 진정한 질문을 품는 순간, 이미 우주의 수정구슬 안에서는 그에 걸맞은 아름다운 답이 맺히기 시작합니다.',
      dateStr: todayKey,
      timestamp: Date.now() - 2000,
      sourceLabel: '아스트랄 신탁 지혜',
      actionGuidance: '마음에 품은 고민을 두려움 없이 한 문장으로 정의해 보세요.',
      tags: ['#우주지혜', '#영시아카이브', '#직관'],
    },
    {
      id: 'cosmic-seed-3',
      category: 'healing',
      categoryLabel: '평온의 파동',
      iconType: 'healing',
      badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
      glowColor: 'rgba(52, 211, 153, 0.5)',
      title: '528Hz 기적과 조화의 공명',
      keypoint: '수정구슬의 맑은 울림처럼, 당신의 몸과 마음 역시 가장 본래적인 순수한 조화의 주파수로 돌아갑니다.',
      fullText: '528Hz 기적과 조화의 공명. 수정구슬의 맑은 울림처럼, 당신의 몸과 마음 역시 가장 본래적인 순수한 조화의 주파수로 돌아갑니다. 긴장을 풀고 평온을 허락하세요.',
      dateStr: todayKey,
      timestamp: Date.now() - 3000,
      sourceLabel: '신성 솔페지오 지혜',
      actionGuidance: '수정구슬을 터치하며 울려 퍼지는 배음에 가만히 귀를 기울여 보세요.',
      tags: ['#528Hz', '#평온', '#치유의열쇠'],
    },
  ];

  // 실제 데이터 뒤에 씨앗 기억 추가 (항상 풍부한 아카이브 제공)
  defaultCosmicSeeds.forEach((seed) => {
    if (!items.some((it) => it.id === seed.id)) {
      items.push(seed);
    }
  });

  // 최신순 정렬
  return items.sort((a, b) => b.timestamp - a.timestamp);
}
