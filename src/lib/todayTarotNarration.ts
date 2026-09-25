import { getTodayDateKey } from '@/lib/dailyCache';
import { getTarotCardImageUrl, type TarotCard } from '@/data/tarotData';
import { prepareNaturalSpeechText } from '@/utils/speechText';

export interface TarotNarrationChapter {
  id: 'card_anchor' | 'master_diagnosis' | 'action_remedy' | 'blessing_frequency';
  title: string;
  badge: string;
  iconType: 'sparkles' | 'eye' | 'compass' | 'sun';
  speechText: string;
  displayText: string;
}

export interface TarotNarrationData {
  hasResult: boolean;
  dateKey: string;
  card: {
    id?: string;
    nameKo: string;
    name: string;
    reversed: boolean;
    keywords: string[];
    imageUrl?: string;
  } | null;
  chapters: TarotNarrationChapter[];
  fullSpeech: string;
  rawDiagnosis: string;
  rawRemedy: string;
  rawBlessing: string;
  frequency: string;
  luckyNumber: string;
  luckyColor: string;
}

/**
 * 🚫 타로 텍스트에서 불필요한 후행 요약 블록을 말끔하게 정돈
 */
function cleanDiagnosisText(raw: string): string {
  if (!raw) return '';
  let text = String(raw).trim();
  // Strip trailing 3-line summary blocks if present
  const summaryMatch = text.match(/(?:\r?\n|^)\s*(?:#{1,6}\s*)?(?:✨\s*)?(?:\d+\.\s*)?(?:\[\s*)?(?:핵심\s*(?:3줄\s*|세줄\s*)?요약|3줄\s*요약|Quick\s*Summary)(?:\])?\s*[\s\S]*$/i);
  if (summaryMatch && summaryMatch.index !== undefined && summaryMatch.index > text.length * 0.6) {
    text = text.slice(0, summaryMatch.index).trim();
  }
  return text;
}

/**
 * 오늘 저장된 데일리 타로 결과 조회
 */
export function getTodayTrinityDailyResult(uid?: string): any | null {
  if (typeof window === 'undefined') return null;
  const today = getTodayDateKey();
  const candidateKeys = [
    `trinity_daily_result_${uid || 'guest'}_${today}`,
    `trinity_daily_result_guest_${today}`,
    `prism_daily_oracle_trinity_${today}`,
  ];

  for (const key of candidateKeys) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.diagnosis || parsed?.summary || parsed?.prescription || parsed?.drawnCard) {
          if (parsed.dateKey && parsed.dateKey !== today) continue;
          return parsed;
        }
      }
    } catch (_) {}
  }
  return null;
}

/**
 * 데일리 타로 결과를 바탕으로 낭독 버전 챕터와 음성 텍스트를 구조화
 */
export function buildTarotNarrationContent(dailyResult: any): TarotNarrationData {
  const today = getTodayDateKey();
  if (!dailyResult) {
    return {
      hasResult: false,
      dateKey: today,
      card: null,
      chapters: [],
      fullSpeech: '',
      rawDiagnosis: '',
      rawRemedy: '',
      rawBlessing: '',
      frequency: '528Hz',
      luckyNumber: '7',
      luckyColor: '골드',
    };
  }

  const drawnCard: TarotCard | null = dailyResult.drawnCard || null;
  const nameKo = drawnCard?.nameKo || drawnCard?.name || '운명의 카드';
  const nameEn = drawnCard?.name || '';
  const isReversed = !!drawnCard?.reversed;
  const orientationStr = isReversed ? '역방향 (Reversed)' : '정방향 (Upright)';
  const orientationSpeech = isReversed ? '역방향' : '정방향';
  const keywords = drawnCard?.keywords && drawnCard.keywords.length > 0
    ? drawnCard.keywords
    : ['변화', '직관', '도약', '조율'];
  const imageUrl = getTarotCardImageUrl(drawnCard);

  const rawDiag = cleanDiagnosisText(
    dailyResult.diagnosis ||
    dailyResult.summary ||
    dailyResult.prescription ||
    dailyResult.reading ||
    '오늘 하루는 내면의 직관과 차분한 호흡에 집중할 때 가장 맑고 조화로운 길이 열립니다.'
  );

  const rawRemedy = String(
    dailyResult.remedy ||
    '사소한 불안이나 타인의 시선에 휘둘리지 말고, 지금 마주한 일에 고요히 몰입하며 마음의 중심을 지키세요.'
  ).trim();

  const frequency = String(dailyResult.frequency || '528Hz 솔페지오 사랑과 치유의 주파수').trim();
  const luckyNumber = String(dailyResult.luckyNumber || '7').trim();
  const luckyColor = String(dailyResult.luckyColor || '황금빛 골드').trim();
  const rawBlessing = String(
    dailyResult.blessingMessage ||
    dailyResult.spiritualEnergy ||
    '오늘 하루 당신이 내딛는 모든 발걸음 위에 우주의 깊은 평온과 명쾌한 통찰이 함께하길 축복합니다.'
  ).trim();

  // Chapter 1: 카드 선언과 상징 파동
  const ch1Speech = prepareNaturalSpeechText(
    `오늘 당신의 우주적 나침반이 비춘 타로 카드는 ${nameKo}, ${orientationSpeech}입니다. 이 카드는 ${keywords.slice(0, 3).join(', ')}의 상징 파동을 품고 있습니다.`
  );
  const ch1Display = `✨ 오늘의 지배 카드: [${nameKo}${nameEn ? ` (${nameEn})` : ''}] · ${orientationStr}\n` +
    `카드의 핵심 에너지 키워드는 ${keywords.join(', ')}입니다. 오늘 하루 내면의 나침반을 이 카드의 상징에 조율하세요.`;

  // Chapter 2: 마스터 심층 비전 해독
  const ch2Speech = prepareNaturalSpeechText(
    `오늘의 심층 비전 해독입니다. ${rawDiag}`
  );
  const ch2Display = rawDiag;

  // Chapter 3: 오늘의 개운 실천 처방
  const ch3Speech = prepareNaturalSpeechText(
    `오늘 당신을 위한 개운 실천 처방입니다. ${rawRemedy}`
  );
  const ch3Display = rawRemedy;

  // Chapter 4: 행운의 주파수와 축복 확언
  const ch4Speech = prepareNaturalSpeechText(
    `오늘의 우주적 조화 주파수는 ${frequency}이며, 행운의 숫자는 ${luckyNumber}, 행운의 색은 ${luckyColor}입니다. ${rawBlessing}`
  );
  const ch4Display = `• 조화 주파수: ${frequency}\n• 행운의 숫자: ${luckyNumber}\n• 행운의 색상: ${luckyColor}\n• 오늘의 축복 확언: ${rawBlessing}`;

  const chapters: TarotNarrationChapter[] = [
    {
      id: 'card_anchor',
      title: '오늘의 카드 선언과 상징',
      badge: 'Chapter 1 · 상징 파동',
      iconType: 'sparkles',
      speechText: ch1Speech,
      displayText: ch1Display,
    },
    {
      id: 'master_diagnosis',
      title: '마스터 심층 비전 해독',
      badge: 'Chapter 2 · 비전 진단',
      iconType: 'eye',
      speechText: ch2Speech,
      displayText: ch2Display,
    },
    {
      id: 'action_remedy',
      title: '오늘의 개운 실천 처방',
      badge: 'Chapter 3 · 행동 가이드',
      iconType: 'compass',
      speechText: ch3Speech,
      displayText: ch3Display,
    },
    {
      id: 'blessing_frequency',
      title: '행운의 주파수와 축복 확언',
      badge: 'Chapter 4 · 에너지 축복',
      iconType: 'sun',
      speechText: ch4Speech,
      displayText: ch4Display,
    },
  ];

  // Full unified narration flow
  const fullSpeech = chapters.map((c) => c.speechText).join(' ');

  return {
    hasResult: true,
    dateKey: today,
    card: drawnCard
      ? {
          id: drawnCard.id,
          nameKo,
          name: nameEn,
          reversed: isReversed,
          keywords,
          imageUrl,
        }
      : null,
    chapters,
    fullSpeech,
    rawDiagnosis: rawDiag,
    rawRemedy,
    rawBlessing,
    frequency,
    luckyNumber,
    luckyColor,
  };
}
