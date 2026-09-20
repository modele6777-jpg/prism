import rawData from './keyExercisesCatalog.json';

export interface KeyExerciseItem {
  globalIndex: number;
  chapter: number;
  chapterTitle: string;
  index: number;
  title: string;
  subtitle: string;
  page: number;
  tag: string;
  icon: string;
  purpose: string;
  clinicalTip: string;
}

export const KEY_EXERCISES_CATALOG: KeyExerciseItem[] = rawData as KeyExerciseItem[];

// 각 연습별 특화 키워드 사전 (40가지 Key 마음약방 임상 실천 연습 정밀 매핑)
const KEYWORD_MAP: Record<number, string[]> = {
  1: ['시각화', '그리기', '스케치', '불안모양', '형태', '색깔', '꺼내놓기', '외재화', '종이위에', '그림으로'],
  2: ['단어', '재구성', '하지만', '그리고', '말투', '생각바꾸기', '언어전환', '인지치료', '문장바꾸기', '부정적인말'],
  3: ['포스트잇', '붙이기', '게시판', '생각흘리기', '잡념', '머릿속복잡', '생각비우기', '메모'],
  4: ['관찰', '제3자', '영화', '관객', '스크린', '자막', '엔딩크레딧', '거리두기', '메타인지', '화면밖'],
  5: ['반추', '반복되는생각', '꼬리', '컨베이어', '수하물', '짐', '흘려보내기', '떠나보내기', '강박사고', '되풀이'],
  6: ['게임판', '게임말', '탈융합', '분리', '통제내려놓기', '생각일뿐', '거리두기', '체스판', '생각과분리'],
  7: ['기차', '스쳐지나', '흘러가', '소음', '지나가게', '멈추려하지', '흐름지켜보기', '스쳐지나가는'],
  8: ['억누름', '억제', '생각안하려고', '보라색꽃', '백곰', '역설', '금지', '참으려고', '애쓸수록'],
  9: ['자기비판', '자책', '스스로비난', '내탓', '자괴감', '한심', '못난', '비판자', '자격미달', '자존감바닥'],
  10: ['토끼굴', '함정', '수렁', '부정적생각', '빨려들', '늪', '알아차림', '현재복귀', '고리끊기'],
  11: ['걱정시간', '걱정예약', '15분', '걱정제한', '하루종일걱정', '마음의책장', '미뤄두기', '걱정할시간'],
  12: ['피자', '과부하', '뇌휴식', '걱정분할', '우선순위', '머리터질', '용량초과', '압도'],
  13: ['호흡', '숨', '복식호흡', '풍선', '숨가쁨', '과호흡', '가슴답답', '들숨', '날숨', '횡격막', '호흡곤란', '숨쉬기'],
  14: ['54321', '오감', '공황', '패닉', '그라운딩', '발작', '주변감각', '눈에보이는', '들리는소리', '촉감'],
  15: ['어깨', '목', '상체', '결림', '뭉침', '등', '뻐근', '담', '근육긴장', '코르티솔', '어깨내리기', '상체긴장'],
  16: ['심장뜀', '두근거림', '맥박', '떨림', '식은땀', '신체반응', '놀람', '안전점검', '심박수', '깜짝선물'],
  17: ['샤워', '물소리', '일상그라운딩', '요리', '감각머물기', '딴생각', '현재로돌아오기', '산만', '그라운딩전문가'],
  18: ['발바닥', '접지', '대지', '닻', '땅', '발가락', '중심잡기', '흔들릴때', '어지러움', '지탱', '대지의중심'],
  19: ['즐겨찾기', '좋아하는것', '취향', '인지분류', '기분전환', '감각리스트', '소소한행복', '오감자극'],
  20: ['보디스캔', '바디스캔', '머리부터발끝', '신체스캔', '몸관찰', '불편감', '신체감각', '전신이완', '몸살'],
  21: ['점진적이완', '근육이완', '주먹쥐기', '툭풀기', '굳음', '경직', '뻣뻣', '온몸긴장', '힘빼기', '근육재정비'],
  22: ['시간관리', '할일쪼개기', '과제분할', '세분화', '압도', '할일이너무많아', '정리안됨', '단계별', '쪼개기'],
  23: ['취약성', '달걀', '통제욕구', '힘빼기', '깨질까봐', '불안전', '견디기', '안절부절', '껍데기'],
  24: ['수영장', '저항멈춤', '감정수용', '피하지않기', '느끼기', '차라리느끼자', '온전히받아들임', '감정수영장'],
  25: ['발표', '시선', '타인시선', '무대', '면접', '남들의식', '카메라', '주목', '얼굴빨개짐', '목소리떨림', '스마일'],
  26: ['가치', '삶의가치', '나답게', '가치중심', '소중한것', '의미있는삶', '가치행동', '방향성', '타인과거리두기'],
  27: ['미루기', '회피', '도망', '안락지대', '게으름', '핑계', '미루는습관', '딴짓', '생존의기로'],
  28: ['투쟁', '싸움', '감정과싸움', '파도타기', '저항', '2차고통', '버티기', '싸우지않기', '내면의투쟁'],
  29: ['바쁨', '일중독', '워커홀릭', '회피형바쁨', '모기떼', '불안해서일함', '쉬지못함', '일중독자'],
  30: ['행동선택', '감정과행동분리', '불안해도한다', '실행', '행동통제', '말과행동', '행동의선택'],
  31: ['거짓말', '마음의속임수', '핑계', '착각', '왜곡', '현실점검', '과장', '거짓말쟁이'],
  32: ['가면증후군', '사기꾼증후군', '들통날까봐', '부족한나', '가짜같아', '자격지심', '열등감', '가짜감정'],
  33: ['반대행동', '충동', '악순환', '누워있기대신', '숨지않기', '정반대로', '행동전환', '반대행동훈련'],
  34: ['사과나무', '스트레스자루', '수레', '짐덜기', '과부하', '버거움', '무거운책임감', '어깨가무거워'],
  35: ['과잉반응', '버럭', '분노폭발', '욱함', '트라우마', '과거상처', '옛날기억', '발작버튼', '트리거'],
  36: ['예기불안', '미리걱정', '일어나지도않은', '벌어질까봐', '내일이두려워', '상상속공포', '시험전', '면접전', '예측의정거장'],
  37: ['달팽이', '점진적노출', '단계별극복', '작은목표', '천천히', '서두르지않기', '한걸음씩', '달팽이레이스'],
  38: ['자유시간', '시간회복', '걱정에낭비', '하루여유', '나를위한시간', '휴식회복', '시간낭비'],
  39: ['가짜난이도', '어려울것같아', '엄두가안나', '시작이두려워', '막막함', '해보고나면', '보람'],
  40: ['미니멀리즘', '행동목표', '측정가능한', '구체적목표', '모호함탈피', '실천지표', '행동의미니멀리즘'],
};

// 40가지 Key 실천 연습별 정밀 별칭 및 임상 검색어 사전
export const EXERCISE_ALIASES: Record<number, string[]> = {
  1: ['걱정 그리기', '걱정그리기', '불안 스케치'],
  2: ['단어의 재구성', '단어 재구성', '하지만 대신 그리고', '단어바꾸기', '생각바꾸기'],
  3: ['포스트잇 프로젝트', '포스트잇', '생각 붙여두기', '메모 붙이기'],
  4: ['걱정 관찰', '걱정관찰', '영화관 거리두기', '엔딩 크레딧', '화면 밖 관객'],
  5: ['잃어버린 짐', '잃어버린짐', '컨베이어 벨트', '생각 흘려보내기', '수하물'],
  6: ['생각과 분리되기', '생각과 분리', '마인드 체스판', '게임판과 게임말', '체스판'],
  7: ['스쳐 지나가는 것들', '스쳐지나가는', '지나가는 기차', '기차 소음'],
  8: ['보라색 꽃', '보라색꽃', '보라색 꽃 생각 금지', '백곰 효과'],
  9: ['자기비판', '내면의 비판자', '자기비판의 목소리', '자책 멈추기', '자책'],
  10: ['토끼굴 속으로', '토끼굴', '생각의 토끼굴', '부정적 생각의 함정'],
  11: ['지금은 걱정할 시간', '걱정할 시간', '15분 걱정', '걱정 예약석', '걱정 제한'],
  12: ['피자 파티', '피자파티', '피자 한 조각', '걱정 피자', '한 조각씩 먹기'],
  13: ['풍선 호흡법', '풍선 호흡', '풍선호흡', '복식호흡', '5초 풍선 호흡', '유기적 5초 풍선 호흡', '복식 호흡', '횡격막 호흡'],
  14: ['5-4-3-2-1', '54321', '오감 그라운딩', '오감 집중', '5단계 감각', '오감 감각'],
  15: ['어깨와 귀는 멀리', '어깨와 귀', '어깨 내리기', '승모근 이완', '상체 긴장 완화'],
  16: ['깜짝 선물', '깜짝선물', '심장 박동 깜짝선물', '두근거림 수용', '심장 두근거림'],
  17: ['그라운딩 전문가', '감각 샤워', '일상 그라운딩', '물소리 그라운딩'],
  18: ['대지의 중심', '대지의중심', '발바닥 그라운딩', '발바닥 접지', '대지 접지', '호흡에 닻 내리기', '발바닥 그라운딩 기법'],
  19: ['나의 즐겨찾기', '감각 즐겨찾기', '즐겨찾기', '기분전환 리스트'],
  20: ['보디 스캔', '보디스캔', '바디 스캔', '바디스캔', '신체 스캔', '전신 스캔'],
  21: ['근육 재정비', '점진적 이완', '점진적 근육 이완', '주먹 쥐고 툭', '주먹쥐고 툭'],
  22: ['시간 관리 기술', '할 일 쪼개기', '1인치씩 자르기', '과제 분할', '작게 쪼개기'],
  23: ['달걀 껍데기 속 마음', '달걀 껍데기', '달걀껍데기', '취약성 수용', '껍데기 깨기'],
  24: ['감정 수영장', '감정수영장', '감정 파도타기', '차라리 느끼기'],
  25: ['카메라를 향해 스마일', '스마일 스포트라이트', '타인의 시선', '스포트라이트 효과'],
  26: ['타인과 거리 두기', '내 삶의 나침반', '나침반 세우기', '가치 중심 행동'],
  27: ['생존의 기로', '5분의 기적', '미루기 극복', '회피 탈출'],
  28: ['내면의 투쟁', '파도와 서핑', '감정과 싸우지 않기', '투쟁 멈추기'],
  29: ['일 중독자', '일중독자', '멈춤 신호등', '회피형 바쁨', '모기떼'],
  30: ['행동의 선택', '손과 발의 선택', '불안해도 행동하기'],
  31: ['거짓말쟁이 마음', '마음의 속삭임 검증', '인지 왜곡 바로잡기'],
  32: ['가짜 감정', '완벽주의 가면 벗기', '가면증후군', '사기꾼 증후군'],
  33: ['반대 행동 훈련', '반대 행동', '반대로 달리기', '정반대로 행동하기'],
  34: ['스트레스 사과나무', '걱정 보따리 내려놓기', '사과나무 흔들기', '짐 덜기'],
  35: ['과잉 반응', '감정의 온도계', '발작 버튼', '트리거 감지'],
  36: ['예측의 정거장', '예기불안', '상상 속 공포', '미리 걱정하기'],
  37: ['달팽이 레이스', '달팽이의 보폭', '점진적 노출', '작은 보폭'],
  38: ['자유 시간', '나만의 자유 정원', '시간 낭비 죄책감 없애기'],
  39: ['가짜 난이도', '첫걸음의 무게', '시작의 두려움'],
  40: ['행동의 미니멀리즘', '오늘의 미니멀 액션', '측정 가능한 목표'],
};

/**
 * 🔑 기법 추천을 위한 통일된 프롬프트 가이드라인 생성기
 * 루시가 답변 본문에서 기법을 추천할 때 일관된 표준 태그 규격을 출력하도록 유도합니다.
 */
export function buildKeyExercisePromptGuideline(targetExercise?: KeyExerciseItem): string {
  const targetDirective = targetExercise
    ? `\n- 이번 답변에서 사용자의 고민(불안, 걱정, 스트레스, 신체 긴장, 감정 압박 등)을 완화할 실천 기법으로 반드시 공식 40가지 연습 중 다음 기법을 추천해:
  👉 공식 명칭: '연습 ${targetExercise.globalIndex}. ${targetExercise.title}' (${targetExercise.tag} - ${targetExercise.subtitle})`
    : `\n- 이번 답변에서 심리 치유, 호흡, 이완, 불안 극복 실천 기법을 추천할 경우, 공식 40가지 Key 연습 중 사용자의 고민에 가장 부합하는 단 1개의 연습을 추천해.`;

  return `[🔑 LucKey 마음약방 40가지 실천 연습 추천 및 기법 연동 표준 가이드라인]:${targetDirective}
- 🎯 [필수 표준 출력 태그 규격]:
  답변 본문에서 추천 기법을 소개하거나 행동 조언을 맺을 때, 반드시 다음 정규 태그 형식을 명시해줘:
  👉 [추천 기법: 연습 {번호}. {기법명}]
  (예: [추천 기법: 연습 13. 풍선 호흡법], [추천 기법: 연습 18. 대지의 중심], [추천 기법: 연습 14. 5-4-3-2-1 기법])
- 🚫 [엄격한 환각 금지]:
  절대로 목록에 없는 가상의 연습 번호나 임의의 기법명을 지어내지 말고, 지정된 공식 번호와 제목을 100% 동일하게 표기해야 해.
- 💡 [하단 카드 연동 안내 문구]:
  답변 말미에 "답변 바로 아래 추천 카드의 [실천] 버튼을 누르면 이 연습실로 바로 연결돼!"라고 다정하게 덧붙여줘.`;
}

export interface KeyExerciseValidationResult {
  isValid: boolean;
  exercise: KeyExerciseItem;
  matchedBy: 'standard_tag' | 'expected_confirmed' | 'explicit_number' | 'canonical_title' | 'alias' | 'user_explicit' | 'contextual';
  rawMatchedSnippet?: string;
  confidence: number;
  isExactMatch: boolean;
  validationNote?: string;
}

/**
 * 🔍 루시의 답변 본문 및 사용자 질문에서 추천 기법을 정밀 검증 및 추출합니다.
 * 
 * 1. [최우선] 표준 태그 패턴 ([추천 기법: 연습 N. 제목]) 추출 및 40대 카탈로그 정합성 검증
 * 2. [사전 지정 기법 확인] 프롬프트에 주입된 expectedIndex 기법이 답변에 실재하는지 우선 확증
 * 3. [명시적 번호 패턴] "연습 N. 제목" 또는 "연습 N" 패턴 추출 (결론/추천 문맥 가중치 부여)
 * 4. [정규 기법명] 40가지 연습의 정규 제목 매칭 (단순 2글자 일상 단어 오매칭 철저 배제)
 * 5. [사용자 질문 명시] 사용자 질문에 연습 번호/기법이 직접 언급된 경우
 * 6. [문맥 점수 매칭] 키워드 및 임상 팁 기반 종합 매칭
 */
export function validateAndExtractKeyExercise(
  lucyText: string = '',
  userText: string = '',
  expectedIndex?: number
): KeyExerciseValidationResult {
  const rawLucy = lucyText || '';
  const cleanLucy = rawLucy.toLowerCase();
  const cleanUser = (userText || '').toLowerCase();

  const expectedEx = typeof expectedIndex === 'number' && expectedIndex >= 1 && expectedIndex <= 40
    ? KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === expectedIndex)
    : undefined;

  // 1. [표준 태그 정밀 파싱]
  // 형태: [추천 기법: 연습 13. 풍선 호흡법], [실천 기법: 연습 18. 대지의 중심], 추천 기법: 연습 13
  const standardTagRegexes = [
    /\[\s*(?:추천\s*기법|실천\s*기법|추천\s*연습|Key\s*추천|추천)\s*:\s*연습\s*([0-9]{1,2})[\.:\s\-]*([^\]]+)\]/i,
    /(?:추천\s*기법|실천\s*기법|추천\s*연습|맞춤\s*연습)\s*[:：]\s*['"‘“]?연습\s*([0-9]{1,2})[\.:\s\-]*([^'"\n\r,)]+)['"’”]?/i,
  ];

  for (const regex of standardTagRegexes) {
    const match = rawLucy.match(regex);
    if (match) {
      const parsedNum = parseInt(match[1], 10);
      if (parsedNum >= 1 && parsedNum <= 40) {
        const found = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === parsedNum);
        if (found) {
          return {
            isValid: true,
            exercise: found,
            matchedBy: 'standard_tag',
            rawMatchedSnippet: match[0],
            confidence: 1.0,
            isExactMatch: true,
            validationNote: `표준 태그 [연습 ${found.globalIndex}. ${found.title}] 100% 일치 검증 성공`,
          };
        }
      }
    }
  }

  // 2. [사전 지정된 expectedIndex 확인]
  // 프롬프트에 주입된 기법을 루시가 본문에서 실제로 언급했는지 우선 확인
  if (expectedEx) {
    const exTitleLower = expectedEx.title.toLowerCase();
    const explicitExPattern = new RegExp(`연습\\s*${expectedEx.globalIndex}\\b`, 'i');
    const hasExplicitNum = explicitExPattern.test(cleanLucy);
    const hasTitle = cleanLucy.includes(exTitleLower);

    if (hasExplicitNum || hasTitle) {
      return {
        isValid: true,
        exercise: expectedEx,
        matchedBy: 'expected_confirmed',
        rawMatchedSnippet: hasExplicitNum ? `연습 ${expectedEx.globalIndex}` : expectedEx.title,
        confidence: hasExplicitNum ? 0.98 : 0.92,
        isExactMatch: true,
        validationNote: `사전 추천 기법(연습 ${expectedEx.globalIndex}. ${expectedEx.title}) 본문 발화 확인 및 일치`,
      };
    }
  }

  // 3. [명시적 "연습 N" 패턴 추출 및 검증]
  // 주의: 답변 서두의 일반적 언급보다 결론/실천 권유부(뒷부분)의 명시적 추천을 우선시
  const explicitNumberMatches = [...cleanLucy.matchAll(/연습\s*([0-9]{1,2})/g)];
  if (explicitNumberMatches.length > 0) {
    // 뒤에서부터 탐색 (추천 조언은 대개 답변 하단부 결론에 위치)
    for (let i = explicitNumberMatches.length - 1; i >= 0; i--) {
      const match = explicitNumberMatches[i];
      const parsedNum = parseInt(match[1], 10);
      if (parsedNum >= 1 && parsedNum <= 40) {
        const found = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === parsedNum);
        if (found) {
          return {
            isValid: true,
            exercise: found,
            matchedBy: 'explicit_number',
            rawMatchedSnippet: match[0],
            confidence: 0.90,
            isExactMatch: true,
            validationNote: `본문 명시 번호(연습 ${found.globalIndex}. ${found.title}) 검증 추출`,
          };
        }
      }
    }
  }

  // 4. [정규 제목 매칭]
  // 4글자 이상의 정규 제목이 루시 답변에 출현하는지 검사 (2글자 일상 단어 '자책', '관찰' 등의 조기 오매칭 방지)
  let bestTitleMatch: { ex: KeyExerciseItem; pos: number; length: number } | null = null;
  for (const ex of KEY_EXERCISES_CATALOG) {
    const tLower = ex.title.toLowerCase();
    if (tLower.length >= 3) {
      const pos = cleanLucy.lastIndexOf(tLower);
      if (pos !== -1) {
        if (!bestTitleMatch || pos > bestTitleMatch.pos) {
          bestTitleMatch = { ex, pos, length: tLower.length };
        }
      }
    }
  }

  if (bestTitleMatch) {
    return {
      isValid: true,
      exercise: bestTitleMatch.ex,
      matchedBy: 'canonical_title',
      rawMatchedSnippet: bestTitleMatch.ex.title,
      confidence: 0.85,
      isExactMatch: false,
      validationNote: `정규 제목('${bestTitleMatch.ex.title}') 매칭`,
    };
  }

  // 5. [사전 지정된 expectedIndex 잔존 시 우선 보존]
  if (expectedEx) {
    return {
      isValid: true,
      exercise: expectedEx,
      matchedBy: 'expected_confirmed',
      rawMatchedSnippet: `연습 ${expectedEx.globalIndex}`,
      confidence: 0.80,
      isExactMatch: false,
      validationNote: `사전 추천 기법(연습 ${expectedEx.globalIndex}) 컨텍스트 보존`,
    };
  }

  // 6. [사용자 질문 명시 연습 추출]
  const userNumMatches = [...cleanUser.matchAll(/연습\s*([0-9]{1,2})/g)];
  if (userNumMatches.length > 0) {
    const rawNum = parseInt(userNumMatches[0][1], 10);
    if (rawNum >= 1 && rawNum <= 40) {
      const byUser = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === rawNum);
      if (byUser) {
        return {
          isValid: true,
          exercise: byUser,
          matchedBy: 'user_explicit',
          rawMatchedSnippet: userNumMatches[0][0],
          confidence: 0.88,
          isExactMatch: true,
          validationNote: `사용자 질문 명시 번호(연습 ${byUser.globalIndex}) 일치`,
        };
      }
    }
  }

  // 7. [키워드 점수 기반 종합 매칭 fallback]
  let bestScoreEx: KeyExerciseItem = KEY_EXERCISES_CATALOG[0];
  let maxScore = -1;

  for (const ex of KEY_EXERCISES_CATALOG) {
    let score = 0;

    const titleLower = ex.title.toLowerCase();
    const tagLower = ex.tag.toLowerCase();
    const subLower = (ex.subtitle || '').toLowerCase();

    if (cleanUser.includes(titleLower)) score += 30;
    if (cleanUser.includes(tagLower)) score += 20;
    if (subLower && cleanUser.includes(subLower)) score += 15;

    if (cleanLucy.includes(titleLower)) score += 25;
    if (cleanLucy.includes(tagLower)) score += 15;
    if (subLower && cleanLucy.includes(subLower)) score += 10;

    const keywords = KEYWORD_MAP[ex.globalIndex] || [];
    for (const kw of keywords) {
      if (cleanUser.includes(kw)) score += 8;
      if (cleanLucy.includes(kw)) score += 6;
    }

    const tokens = (ex.purpose + ' ' + ex.clinicalTip).split(/[\s,·.]+/);
    for (const tok of tokens) {
      if (tok.length >= 2) {
        if (cleanUser.includes(tok)) score += 2;
        if (cleanLucy.includes(tok)) score += 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestScoreEx = ex;
    }
  }

  const finalEx = maxScore > 0 ? bestScoreEx : (KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === 13) || KEY_EXERCISES_CATALOG[0]);
  return {
    isValid: true,
    exercise: finalEx,
    matchedBy: 'contextual',
    confidence: 0.65,
    isExactMatch: false,
    validationNote: `문맥 키워드 점수 기반 매칭 (점수: ${maxScore})`,
  };
}

/**
 * 40가지 Key 마음약방 실천 연습 중 맥락에 가장 정확하게 부합하는 1개의 실천 연습을 도출합니다.
 */
export function findBestKeyExercise(
  userText: string = '',
  lucyText: string = '',
  expectedIndex?: number
): KeyExerciseItem {
  return validateAndExtractKeyExercise(lucyText, userText, expectedIndex).exercise;
}

