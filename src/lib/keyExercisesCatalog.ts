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
 * 40가지 Key 마음약방 실천 연습 중 사용자의 현재 고민(질문) 및 대화 답변 맥락에
 * 가장 정확하게 부합하는 1개의 실천 연습을 도출합니다.
 * 
 * 루시 답변(lucyText)에 특정 실천 연습이 명시되어 있다면 100% 일치를 위해
 * 해당 기법을 최우선으로 즉각 추출하여 반환합니다.
 */
export function findBestKeyExercise(userText: string = '', lucyText: string = ''): KeyExerciseItem {
  const cleanLucy = (lucyText || '').toLowerCase();
  const cleanUser = (userText || '').toLowerCase();

  // 1. [최우선 순위]: 루시 답변(lucyText)에 특정 실천 연습이 명시적으로 언급되었는지 정밀 검사
  // 루시 답변과 바로 아래의 LucKey 연계 추천 카드는 항상 100% 일치해야 합니다.
  if (cleanLucy) {
    let earliestMatch: { ex: KeyExerciseItem; pos: number; length: number } | null = null;

    // 1-A. 모든 40가지 연습의 제목 및 별칭이 루시 답변에 출현하는 위치 조사
    for (const ex of KEY_EXERCISES_CATALOG) {
      const candidates = [
        ex.title.toLowerCase(),
        `연습 ${ex.globalIndex}`,
        `연습${ex.globalIndex}`,
        `연습 ${ex.index}`,
        ...(EXERCISE_ALIASES[ex.globalIndex] || []).map((a) => a.toLowerCase()),
      ];

      for (const cand of candidates) {
        if (!cand || cand.length < 2) continue;
        const pos = cleanLucy.indexOf(cand);
        if (pos !== -1) {
          // 답변 앞부분에 먼저 언급되었거나, 더 구체적이고 긴 키워드 매칭일 경우 우선
          if (!earliestMatch || pos < earliestMatch.pos || (pos === earliestMatch.pos && cand.length > earliestMatch.length)) {
            earliestMatch = { ex, pos, length: cand.length };
          }
        }
      }
    }

    if (earliestMatch) {
      return earliestMatch.ex;
    }

    // 1-B. "연습 [0-9]+" 또는 "[0-9]+번 연습" 패턴 추출
    const lucyNumberMatches = [...cleanLucy.matchAll(/연습\s*([0-9]{1,2})|([0-9]{1,2})\s*번\s*연습/g)];
    for (const match of lucyNumberMatches) {
      const rawNum = parseInt(match[1] || match[2], 10);
      if (rawNum >= 1 && rawNum <= 40) {
        const byGlobal = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === rawNum);
        if (byGlobal) return byGlobal;
      }
    }
  }

  // 2. [차순위]: 사용자 질문(userText)에 특정 실천 연습이 명시적으로 요청되었는지 검사
  if (cleanUser) {
    let earliestUserMatch: { ex: KeyExerciseItem; pos: number; length: number } | null = null;

    for (const ex of KEY_EXERCISES_CATALOG) {
      const candidates = [
        ex.title.toLowerCase(),
        `연습 ${ex.globalIndex}`,
        `연습${ex.globalIndex}`,
        ...(EXERCISE_ALIASES[ex.globalIndex] || []).map((a) => a.toLowerCase()),
      ];

      for (const cand of candidates) {
        if (!cand || cand.length < 2) continue;
        const pos = cleanUser.indexOf(cand);
        if (pos !== -1) {
          if (!earliestUserMatch || pos < earliestUserMatch.pos || (pos === earliestUserMatch.pos && cand.length > earliestUserMatch.length)) {
            earliestUserMatch = { ex, pos, length: cand.length };
          }
        }
      }
    }

    if (earliestUserMatch) {
      return earliestUserMatch.ex;
    }

    const userNumberMatches = [...cleanUser.matchAll(/연습\s*([0-9]{1,2})|([0-9]{1,2})\s*번\s*연습/g)];
    for (const match of userNumberMatches) {
      const rawNum = parseInt(match[1] || match[2], 10);
      if (rawNum >= 1 && rawNum <= 40) {
        const byGlobal = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === rawNum);
        if (byGlobal) return byGlobal;
      }
    }
  }

  // 3. [키워드 점수 기반 종합 매칭]: 질문과 답변의 문맥 의미 분석
  let bestMatch: KeyExerciseItem = KEY_EXERCISES_CATALOG[0];
  let maxScore = -1;

  for (const ex of KEY_EXERCISES_CATALOG) {
    let score = 0;

    const titleLower = ex.title.toLowerCase();
    const tagLower = ex.tag.toLowerCase();
    const subLower = (ex.subtitle || '').toLowerCase();

    // 1. 사용자 질문 직접 키워드
    if (cleanUser.includes(titleLower)) score += 30;
    if (cleanUser.includes(tagLower)) score += 20;
    if (subLower && cleanUser.includes(subLower)) score += 15;

    // 루시 답변 언급
    if (cleanLucy.includes(titleLower)) score += 25;
    if (cleanLucy.includes(tagLower)) score += 15;
    if (subLower && cleanLucy.includes(subLower)) score += 10;

    // 2. 특화 키워드 매칭
    const keywords = KEYWORD_MAP[ex.globalIndex] || [];
    for (const kw of keywords) {
      if (cleanUser.includes(kw)) score += 8;
      if (cleanLucy.includes(kw)) score += 6;
    }

    // 3. 목적 및 임상 팁 단어 매칭
    const tokens = (ex.purpose + ' ' + ex.clinicalTip).split(/[\s,·.]+/);
    for (const tok of tokens) {
      if (tok.length >= 2) {
        if (cleanUser.includes(tok)) score += 2;
        if (cleanLucy.includes(tok)) score += 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = ex;
    }
  }

  // 매칭 점수가 극히 낮은 경우(0점 등) 기본으로 가장 보편적인 수용 연습(Ex 13 풍선 호흡법) 제공
  if (maxScore <= 0) {
    const defaultEx = KEY_EXERCISES_CATALOG.find((e) => e.globalIndex === 13) || KEY_EXERCISES_CATALOG[0];
    return defaultEx;
  }

  return bestMatch;
}
