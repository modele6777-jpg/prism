import { TarotCard } from '@/data/tarotData';
import { invokeLLMStructured } from '@/lib/ai';
import { z } from 'zod';
import { getTarotCardDetails } from '@/lib/dailyTarotOracle';

export interface LucyTarotAdvice {
  headline: string;
  advice: string;
  actionTip: string;
  speechText: string;
  keyword: string;
}

export interface LucyTarotAdviceParams {
  cards?: any[] | null;
  tarotConcern?: string;
  readingText?: string;
  nickname?: string;
  mode?: 'standard' | 'daily' | 'oracle';
  oracleMode?: 'healing' | 'growth';
  saju?: any;
}

const LucyTarotAdviceSchema = z.object({
  headline: z.string().describe("루시의 한 줄 핵심 통찰 (반말 친근한 톤, 15자 내외)"),
  advice: z.string().describe("루시가 질문자에게 건네는 따뜻하고 명쾌한 1:1 맞춤 조언 (반말 친근한 톤, 2~3문장)"),
  actionTip: z.string().describe("오늘 즉시 실천할 수 있는 구체적인 행동 팁 1가지 (반말, 1문장)"),
  keyword: z.string().describe("에너지 키워드 태그 (예: #직관과확신 #마음의평온)"),
});

// Cache for quick recall without redundant generation
const adviceCache = new Map<string, LucyTarotAdvice>();

function buildCacheKey(params: LucyTarotAdviceParams): string {
  const cardIds = (params.cards || []).map((c) => `${c.id || c.nameKo}_${c.reversed ? 'rev' : 'up'}`).join('-');
  const concern = (params.tarotConcern || 'daily').trim().slice(0, 30);
  const modeKey = `${params.mode || 'std'}_${params.oracleMode || 'none'}`;
  return `${cardIds}::${concern}::${modeKey}::${params.nickname || 'guest'}`;
}

/**
 * Creates clean spoken text for TTS without markdown, symbols, or emojis.
 */
export function buildLucyAdviceSpeechText(headline: string, advice: string, actionTip: string): string {
  const cleanHead = headline.replace(/[#*`_~[\](){}<>💡✨🌿🔮🕯️🎴]/g, '').trim();
  const cleanAdv = advice.replace(/[#*`_~[\](){}<>💡✨🌿🔮🕯️🎴]/g, '').trim();
  const cleanTip = actionTip.replace(/[#*`_~[\](){}<>💡✨🌿🔮🕯️🎴]/g, '').trim();
  return `${cleanHead}. ${cleanAdv} 오늘의 실천: ${cleanTip}`;
}

/**
 * Generates an instantaneous, rich, deterministic advice from Lucy based on the drawn cards and concern.
 * 100% reliable offline, sub-millisecond latency.
 */
export function buildDeterministicLucyAdvice(params: LucyTarotAdviceParams): LucyTarotAdvice {
  const nick = params.nickname?.trim() || '여행자';
  const concern = (params.tarotConcern || '').trim();
  const primaryCard = params.cards && params.cards.length > 0
    ? params.cards[params.cards.length - 1] // Last card in spread or single drawn card
    : null;
  const isReversed = !!primaryCard?.reversed;
  const cardName = primaryCard?.nameKo || primaryCard?.name || '운명의 인도자';
  const details = primaryCard ? getTarotCardDetails(primaryCard) : null;
  const cardMeaning = details ? (isReversed ? details.reversedCore : details.uprightCore) : '';
  const cardSymbol = details?.symbolWord || '';

  // 1. Oracle Tarot Mode
  if (params.mode === 'oracle') {
    if (params.oracleMode === 'healing') {
      const headline = isReversed
        ? `${nick}야, [${cardName}]의 뜻처럼 조급해 말고 쉬어가도 돼`
        : `${nick}야, [${cardName}] 카드가 전하는 치유의 뜻을 믿어봐`;
      const advice = `지금 펼쳐진 [${cardName}] 카드는 ${cardSymbol ? `[${cardSymbol}]의 도상과 함께 ` : ''}“${cardMeaning || '지친 마음에 깊은 온기가 필요함'}”을 말해주고 있어. 남들의 속도나 기대에 맞추려 애쓰지 마. 잠시 모든 짐을 내려놓고 가만히 숨을 고르는 것만으로도 충분히 아름답고 온전해.`;
      const actionTip = `따뜻한 차 한 잔을 천천히 마시며 어깨에 들어간 긴장을 부드럽게 풀어줘.`;
      return {
        headline,
        advice,
        actionTip,
        speechText: buildLucyAdviceSpeechText(headline, advice, actionTip),
        keyword: `#마음의안식 #치유와회복`,
      };
    } else {
      // Growth Mode
      const headline = isReversed
        ? `${nick}야, [${cardName}]의 교훈처럼 내실을 먼저 단단히 다져봐`
        : `${nick}야, [${cardName}]의 뜻처럼 네 직관이 가리키는 곳으로 나아가`;
      const advice = `오늘 모습을 드러낸 [${cardName}] 카드는 ${cardSymbol ? `[${cardSymbol}]의 상징처럼 ` : ''}“${cardMeaning || '네 안의 잠재력이 꽃피울 준비를 마쳤음'}”을 선명하게 비춰주고 있어. 두려움에 머뭇거리기보다, 오늘 네 손으로 이룰 수 있는 작은 성공 하나에 온 힘을 집중해 봐. 넌 이미 해낼 힘이 있어.`;
      const actionTip = `오늘 할 일 중 가장 중요한 1가지를 정하고 망설임 없이 15분간 몰입해 보기.`;
      return {
        headline,
        advice,
        actionTip,
        speechText: buildLucyAdviceSpeechText(headline, advice, actionTip),
        keyword: `#도약과실행 #성장모멘텀`,
      };
    }
  }

  // 2. Standard / Daily Tarot Mode with Card-Specific Resonance
  let suit = 'general';
  if (primaryCard?.id?.startsWith('wands_')) suit = 'wands';
  else if (primaryCard?.id?.startsWith('cups_')) suit = 'cups';
  else if (primaryCard?.id?.startsWith('swords_')) suit = 'swords';
  else if (primaryCard?.id?.startsWith('pent_')) suit = 'pentacles';
  else if (primaryCard?.type === 'major') suit = 'major';

  let headline = `${nick}야, [${cardName}]의 파동이 오늘 네 길을 밝히고 있어`;
  let advice = `오늘 카드가 비추는 핵심은 내면의 신뢰야. 외부의 소음에 흔들리지 말고 네 마음의 중심을 굳건히 세워봐.`;
  let actionTip = `창밖 하늘을 바라보며 깊은 심호흡 3번으로 머릿속을 맑게 비우기.`;
  let keyword = `#직관과확신 #운명의빛`;

  if (suit === 'wands') {
    if (isReversed) {
      headline = `${nick}야, 조급한 열정보다 완급 조절이 필요한 타이밍이야`;
      advice = `[${cardName}] 카드가 역방향으로 나온 건 에너지가 과열되었거나 방향이 분산되었음을 뜻해. 서두르지 말고 한 발 물러서서 호흡을 가다듬어 봐. 쉬어가는 것도 열정의 일부야.`;
      actionTip = `오늘 무리한 일정 하나는 내일로 넘기고 가벼운 산책으로 에너지를 재충전해 봐.`;
      keyword = `#완급조절 #에너지조율`;
    } else {
      headline = `${nick}야, 네 안의 열정에 확신을 갖고 앞으로 전진해 봐`;
      advice = `[${cardName}] 카드의 강렬한 불꽃이 네 행동을 이끌고 있어. 그동안 품어온 생각이나 계획이 있다면 주저하지 말고 힘차게 첫걸음을 떼어봐. 네 열정이 길을 열어줄 거야.`;
      actionTip = `마음속으로 미뤄왔던 행동 1가지를 지금 바로 5분 안에 시작하기.`;
      keyword = `#용기있는실행 #열정의불꽃`;
    }
  } else if (suit === 'cups') {
    if (isReversed) {
      headline = `${nick}야, 타인의 감정에 휘둘리지 말고 네 감정을 먼저 돌봐`;
      advice = `[${cardName}] 카드는 지금 네 마음의 컵이 넘쳐흐르지 않도록 경계를 지키라고 당부하고 있어. 타인을 배려하느라 정작 네 속마음을 억누르지 않았는지 다정하게 물어봐줘.`;
      actionTip = `거울 속 나를 보며 '내 마음이 제일 소중해'라고 다정하게 속삭여주기.`;
      keyword = `#감정의보호 #자기자비`;
    } else {
      headline = `${nick}야, 따뜻한 마음의 온기와 공감을 아끼지 마`;
      advice = `[${cardName}] 카드의 맑은 샘물이 네 주변을 부드럽게 감싸고 있어. 오늘 건네는 다정한 말 한마디와 따뜻한 경청이 뜻밖의 귀인과 화합을 불러올 거야.`;
      actionTip = `소중한 사람에게 '고맙다'는 안부 문자 한 줄 따뜻하게 전해보기.`;
      keyword = `#사랑과공명 #다정한연결`;
    }
  } else if (suit === 'swords') {
    if (isReversed) {
      headline = `${nick}야, 꼬리를 무는 걱정과 불안의 고리를 끊어내자`;
      advice = `[${cardName}] 카드가 역방향일 때는 생각에 생각이 꼬리를 물어 마음이 피로해지기 쉬워. 생각한다고 해결되지 않는 고민은 지금 당장 머릿속에서 흘려보내자.`;
      actionTip = `머릿속을 어지럽히는 생각들을 종이에 적은 뒤 찢어서 휴지통에 버리기.`;
      keyword = `#마음비우기 #방하착`;
    } else {
      headline = `${nick}야, 명료한 이성과 직관으로 결단을 내릴 때야`;
      advice = `[${cardName}] 카드의 날카로운 통찰이 안개를 걷어내고 있어. 감정에 치우치기보다 현실적인 사실과 우선순위를 기준으로 정리하면 가장 현명한 해답이 보일 거야.`;
      actionTip = `선택의 기준 3가지를 노트에 단문으로 정리해 우선순위 확정하기.`;
      keyword = `#명료한판단 #단단한결단`;
    }
  } else if (suit === 'pentacles') {
    if (isReversed) {
      headline = `${nick}야, 조급한 결실보다 눈앞의 현실적 기반을 점검해 봐`;
      advice = `[${cardName}] 카드는 기초가 탄탄해야 큰 열매를 맺을 수 있음을 일깨워주고 있어. 단기적인 이익이나 결과에 집착하지 말고, 작은 루틴과 건강부터 차근차근 챙겨봐.`;
      actionTip = `지출 내역을 점검하거나 오늘 먹은 음식을 건강하게 되돌아보기.`;
      keyword = `#현실점검 #기반다지기`;
    } else {
      headline = `${nick}야, 네가 흘린 땀과 노력은 결코 배신하지 않아`;
      advice = `[${cardName}] 카드의 풍요로운 대지가 네 곁에 있어. 매일 꾸준히 쌓아온 너만의 정성이 이제 든든한 결실로 나타나기 시작할 거야. 스스로의 가치를 굳게 믿어.`;
      actionTip = `오늘 나를 위해 작지만 확실한 보상(맛있는 간식이나 편안한 휴식) 선물하기.`;
      keyword = `#풍요와안정 #성실의결실`;
    }
  } else if (suit === 'major') {
    if (isReversed) {
      headline = `${nick}야, 거대한 전환점 앞에서는 내면의 중심이 제일 중요해`;
      advice = `[${cardName}] 메이저 카드의 역방향 파동은 무리하게 상황을 통제하려 하지 말고 흐름을 유연하게 수용하라는 우주의 신호야. 때로는 힘을 뺄 때 가장 큰 지혜가 생겨나.`;
      actionTip = `눈을 감고 1분간 어깨와 턱의 힘을 툭 빼며 호흡에 머물기.`;
      keyword = `#수용과이완 #내면의지혜`;
    } else {
      headline = `${nick}야, 우주가 네 삶에 거대한 축복의 문을 열어주고 있어`;
      advice = `[${cardName}] 메이저 카드가 전하는 영혼의 메시지는 명확해. 지금 네가 겪는 모든 순간이 더 큰 너로 나아가기 위한 소중한 여정이야. 가슴 뛰는 방향을 향해 당당히 걸어가.`;
      actionTip = `오늘 가장 설레는 목표를 다이어리 맨 윗줄에 굵게 적어두기.`;
      keyword = `#운명의축복 #새로운도약`;
    }
  }

  // Concern context tuning
  if (concern && concern.includes('연애') || concern.includes('사랑') || concern.includes('재회')) {
    keyword += ' #마음의나침반';
  } else if (concern && concern.includes('취업') || concern.includes('이직') || concern.includes('사업') || concern.includes('돈')) {
    keyword += ' #풍요의기운';
  }

  return {
    headline,
    advice,
    actionTip,
    speechText: buildLucyAdviceSpeechText(headline, advice, actionTip),
    keyword,
  };
}

/**
 * Returns instant advice and launches non-blocking background enhancement if LLM is accessible.
 */
export async function getEnhancedLucyTarotAdvice(
  params: LucyTarotAdviceParams,
  onEnhanced?: (advice: LucyTarotAdvice) => void
): Promise<LucyTarotAdvice> {
  const cacheKey = buildCacheKey(params);
  if (adviceCache.has(cacheKey)) {
    return adviceCache.get(cacheKey)!;
  }

  const baseAdvice = buildDeterministicLucyAdvice(params);
  adviceCache.set(cacheKey, baseAdvice);

  // Background enhancement via LLM
  if (typeof window !== 'undefined') {
    setTimeout(async () => {
      try {
        const cardsSummary = (params.cards || [])
          .map((c) => {
            const d = getTarotCardDetails(c);
            const orient = c.reversed ? '역방향' : '정방향';
            const detailStr = d
              ? ` (원형: ${d.archetype}, 상징: ${d.symbolWord}, 본래 뜻: ${c.reversed ? d.reversedCore : d.uprightCore})`
              : '';
            return `${c.nameKo} (${orient}${c.keywords ? ` - ${c.keywords.slice(0, 3).join(', ')}` : ''})${detailStr}`;
          })
          .join(', ');

        const systemPrompt = `당신은 PRISM의 모든 차원을 인도하는 따뜻하고 통찰력 넘치는 AI 마스터 가이드 '루시(Lucy)'입니다.
질문자가 방금 뽑은 타로/오라클 카드의 파동과 질문 고민에 맞추어, 질문자의 마음을 보듬고 명쾌한 방향성을 전해주는 '루시의 1:1 특별 조언'을 생성하세요.

[필수 원칙]:
1. [루시 페르소나 어조]: 질문자(${params.nickname || '여행자'})에게 반말(~해봐, ~야, ~할 거야, ~을 잊지 마)로 100% 다정하고 명쾌하게 이야기하세요.
2. [★ 카드 상징과 본래 뜻 중심 리딩]: 질문자가 뽑은 카드([${cardsSummary || '타로 카드'}])의 고유한 도상 상징과 본질적인 의미(정/역방향의 깊은 뜻)를 조언의 가장 중요한 근거로 삼아, 카드의 본래 뜻을 중심으로 질문 고민("${params.tarotConcern || '오늘의 운세'}")을 명쾌하게 풀어내세요.
3. [간결성]: 길게 늘어놓지 말고 headline(15자 내외 - 카드의 뜻 반영), advice(2~3문장 - 카드의 상징과 본래 의미를 자연스럽게 담을 것), actionTip(1문장 실천), keyword(#키워드 2개)로 산뜻하게 정돈하세요.`;

        const userMsg = `질문자: ${params.nickname || '여행자'}
고민/질문: "${params.tarotConcern || '오늘의 타로 운세'}"
타로 카드: [${cardsSummary || '주요 카드'}]
리딩 요약: ${params.readingText ? params.readingText.slice(0, 300) : '완전한 에너지 조율'}`;

        const aiResult = await invokeLLMStructured({
          schema: LucyTarotAdviceSchema,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
        });

        if (aiResult?.headline && aiResult?.advice) {
          const enhanced: LucyTarotAdvice = {
            headline: aiResult.headline,
            advice: aiResult.advice,
            actionTip: aiResult.actionTip || baseAdvice.actionTip,
            keyword: aiResult.keyword || baseAdvice.keyword,
            speechText: buildLucyAdviceSpeechText(aiResult.headline, aiResult.advice, aiResult.actionTip || baseAdvice.actionTip),
          };
          adviceCache.set(cacheKey, enhanced);
          onEnhanced?.(enhanced);
        }
      } catch (_) {
        // Fallback remains baseAdvice
      }
    }, 100);
  }

  return baseAdvice;
}
