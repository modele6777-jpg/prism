/**
 * =========================================================================
 * LUCY KEY DIGEST: 루시 대화 에센스 응축 & 키포인트 추출 엔진
 * =========================================================================
 * 대화형 멘토 '루시'와 나눈 긴 대화 속에서 핵심 키포인트(Key 1, 2, 3),
 * 오늘의 1가지 실천 액션, 핵심 주제를 응축하여 'Key (크리스탈 키)'에 비춰줍니다.
 */

import { safeLocalStorage } from '../utils/safeStorage';
import { loadSavedUnifiedMessages, type UnifiedMessage } from './chatHistorySync';

export interface LucyKeyDigest {
  coreTheme: string;        // 예: "취업 준비에 대한 불안과 완벽주의 내려놓기"
  keyPoints: string[];      // 3대 핵심 키포인트 [Key 1, Key 2, Key 3]
  microAction: string;      // 오늘 당장 실천할 1가지 Key 액션
  mindKeywords: string[];   // 영혼의 키워드 태그 [불안해소, 자기확신, 작은한걸음]
  analyzedAt: number;
  dialogueCount: number;
  isAiGenerated: boolean;
}

const STORAGE_KEY_DIGEST = 'prism_lucy_key_digest_cache';

/**
 * 최근 루시와 나눈 대화 기록 중 요약 가능한 실제 대화 메시지들을 추출
 */
export function getRecentLucyDialogue(): {
  userMessages: string[];
  assistantMessages: string[];
  allValidMessages: UnifiedMessage[];
} {
  const all = loadSavedUnifiedMessages();
  const valid = all.filter(
    (m) =>
      m.role === 'user' ||
      ((m.role === 'model' || m.role === 'assistant') && m.id !== 'greet-main' && !!m.content)
  );

  const userMessages = valid
    .filter((m) => m.role === 'user')
    .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).trim())
    .filter(Boolean);

  const assistantMessages = valid
    .filter((m) => m.role === 'model' || m.role === 'assistant')
    .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).trim())
    .filter(Boolean);

  return {
    userMessages,
    assistantMessages,
    allValidMessages: valid,
  };
}

/**
 * 저장된 캐시된 키포인트 다이제스트 가져오기
 */
export function getCachedLucyKeyDigest(): LucyKeyDigest | null {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY_DIGEST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0) {
      return parsed as LucyKeyDigest;
    }
  } catch (_) {}
  return null;
}

/**
 * 로컬 지능 기반 빠른 스마트 폴백 요약기
 */
export function generateLocalFallbackDigest(
  userMsgs: string[],
  assistantMsgs: string[]
): LucyKeyDigest {
  const lastUser = userMsgs[userMsgs.length - 1] || '최근 고민과 성찰';
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1] || '';

  // 문장 분리
  const sentences = lastAssistant
    .replace(/\n+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && !s.startsWith('안녕') && !s.includes('루시야'));

  const key1 = sentences[0] || '내면의 불안을 객관적으로 응시하고 있는 그대로 수용하기';
  const key2 = sentences[1] || '완벽한 결과보다 지금 당장 취할 수 있는 작은 과정에 집중하기';
  const key3 = sentences[2] || '스스로에게 건네는 따뜻한 자기 연민과 신뢰 회복';

  return {
    coreTheme: lastUser.length > 40 ? `${lastUser.slice(0, 38)}...` : lastUser,
    keyPoints: [
      `Key 1: ${key1.replace(/^[•\-\d.\s]+/, '')}`,
      `Key 2: ${key2.replace(/^[•\-\d.\s]+/, '')}`,
      `Key 3: ${key3.replace(/^[•\-\d.\s]+/, '')}`,
    ],
    microAction: '오늘 하루 10분간 스마트폰을 내려놓고 심호흡하며 나 자신에게 수고했다고 말해주기',
    mindKeywords: ['#자기확신', '#내면평온', '#실천한걸음', '#루시의지혜'],
    analyzedAt: Date.now(),
    dialogueCount: userMsgs.length,
    isAiGenerated: false,
  };
}

/**
 * 루시 대화로부터 실시간 AI Key 요약 생성
 */
export async function generateLucyKeyDigest(): Promise<LucyKeyDigest> {
  const { userMessages, assistantMessages } = getRecentLucyDialogue();

  if (userMessages.length === 0 && assistantMessages.length === 0) {
    const emptyDigest: LucyKeyDigest = {
      coreTheme: '아직 루시와 나눈 대화가 없습니다.',
      keyPoints: [
        'Key 1: 루시와의 대화를 통해 마음속 고민과 질문을 털어놓아 보세요.',
        'Key 2: 대화가 끝나면 Key가 실시간으로 핵심 지혜를 응축해 드립니다.',
        'Key 3: 나만의 성장 인사이트와 실천 가이드를 보석처럼 모을 수 있습니다.',
      ],
      microAction: '상단의 [루시와 대화하러 가기]를 눌러 첫 이야기를 시작해 보세요.',
      mindKeywords: ['#새로운시작', '#루시와의교감', '#직관의열쇠'],
      analyzedAt: Date.now(),
      dialogueCount: 0,
      isAiGenerated: false,
    };
    return emptyDigest;
  }

  // 최근 최대 4개 턴의 대화 구성
  const recentTurns: string[] = [];
  const startIdx = Math.max(0, userMessages.length - 4);
  for (let i = startIdx; i < userMessages.length; i++) {
    recentTurns.push(`[사용자 질문]: ${userMessages[i]}`);
    if (assistantMessages[i]) {
      recentTurns.push(`[루시의 조언]: ${assistantMessages[i].slice(0, 500)}`);
    }
  }

  const prompt = `당신은 대화의 본질을 꿰뚫어 가장 명료한 핵심만 응축하는 'Key(크리스탈 키) 에센스 요약기'입니다.
아래는 사용자와 AI 멘토 루시가 나눈 최근 대화입니다:

${recentTurns.join('\n\n')}

위 대화의 핵심을 철저히 분석하여 다음 JSON 형식으로만 정확히 응답하세요. 다른 설명이나 마크다운 백틱은 넣지 마세요:
{
  "coreTheme": "대화의 본질적 핵심 주제/고민을 한 문장으로 압축 (예: 이직에 대한 두려움과 자기 확신 회복)",
  "keyPoints": [
    "Key 1: 루시 조언의 첫 번째 핵심 통찰 (한 문장)",
    "Key 2: 루시 조언의 두 번째 핵심 관점 (한 문장)",
    "Key 3: 루시 조언의 세 번째 마인드셋 (한 문장)"
  ],
  "microAction": "사용자가 오늘 당장 5분 안에 실천할 수 있는 가장 명쾌하고 구체적인 단 1가지 행동 지침",
  "mindKeywords": ["#키워드1", "#키워드2", "#키워드3", "#키워드4"]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const response = await fetch('/api/gemini/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        systemInstruction: '오직 유효한 JSON 형식의 문자열만 출력하세요. 불필요한 서론이나 백틱(```json)을 붙이지 마세요.',
      }),
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      // Clean potential JSON markdown wraps
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.coreTheme && Array.isArray(parsed.keyPoints)) {
          const digest: LucyKeyDigest = {
            coreTheme: String(parsed.coreTheme).trim(),
            keyPoints: parsed.keyPoints.slice(0, 3).map((k: string, i: number) => {
              const str = String(k).trim();
              return str.startsWith(`Key ${i + 1}`) ? str : `Key ${i + 1}: ${str}`;
            }),
            microAction: String(parsed.microAction || '').trim() || '오늘 하루 나를 위한 깊은 호흡 3번 하기',
            mindKeywords: Array.isArray(parsed.mindKeywords)
              ? parsed.mindKeywords.map((w: string) => (w.startsWith('#') ? w : `#${w}`))
              : ['#내면통찰', '#실천', '#성장'],
            analyzedAt: Date.now(),
            dialogueCount: userMessages.length,
            isAiGenerated: true,
          };
          safeLocalStorage.setItem(STORAGE_KEY_DIGEST, JSON.stringify(digest));
          return digest;
        }
      }
    }
  } catch (err) {
    console.warn('[LucyKeyDigest] AI digest fetch error, using local fallback:', err);
  }

  // 폴백
  const fallback = generateLocalFallbackDigest(userMessages, assistantMessages);
  safeLocalStorage.setItem(STORAGE_KEY_DIGEST, JSON.stringify(fallback));
  return fallback;
}
