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

/**
 * 40가지 Key 마음약방 실천 연습 중 사용자의 현재 고민 및 대화 내용에
 * 가장 정확하게 부합하는 1개의 실천 연습을 찾아냅니다.
 */
export function findBestKeyExercise(userText: string = '', lucyText: string = ''): KeyExerciseItem {
  const combined = `${userText} ${lucyText}`.toLowerCase();

  let bestMatch: KeyExerciseItem = KEY_EXERCISES_CATALOG[0];
  let maxScore = -1;

  // 각 연습별 특화 키워드 매핑
  const KEYWORD_MAP: Record<number, string[]> = {
    1: ['시각화', '그리기', '불안모양', '오감', '외재화', '형태', '스케치', '색깔'],
    2: ['단어', '재구성', '하지만', '그리고', '언어', '말투', '생각바꾸기', '인지치료'],
    3: ['포스트잇', '생각흘리기', '붙이기', '잡념', '머릿속복잡', '게시판', '생각비우기'],
    4: ['관찰', '제3자', '영화', '관객', '거리두기', '메타인지', '자막', '엔딩크레딧'],
    5: ['짐', '원치않는', '흘려보내기', '강박', '떠나보내기', '반복되는생각', '수하물'],
    6: ['스위치', '조절', '불안강도', '볼륨', '레벨', '다이얼', '불안수치'],
    7: ['스토리', '이야기', '소설', '각색', '드라마', '과장', '시나리오'],
    8: ['분리', '라벨링', '이름붙이기', '탈융합', '생각일뿐', '명명하기'],
    9: ['닻', '접지', '호흡닻', '흔들릴때', '안정', '닻내리기', '표류'],
    10: ['그라운딩', '발바닥', '대지', '중력', '땅', '바닥', '발', '접지감각'],
    11: ['신체스캔', '바디스캔', '몸감각', '근육', '긴장부위', '머리부터발끝', '결림'],
    12: ['오감', '54321', '눈에보이는', '들리는', '촉감', '주변감각', '사물세기'],
    13: ['손바닥', '온기', '심장', '가슴손', '토닥', '체온', '온도'],
    14: ['미주신경', '목풀기', '스트레칭', '신경안정', '목', '어깨', '이완'],
    15: ['호흡', '풍선', '복식호흡', '들숨날숨', '과호흡', '숨가쁨', '숨'],
    16: ['근이완', '점진적', '주먹쥐기', '힘빼기', '경직', '굳음', '뻣뻣'],
    17: ['수용', '파도', '서핑', '받아들이기', '저항', '싸우지않기'],
    18: ['허용', '공간', '마음방', '넓히기', '자리내주기', '품어주기'],
    19: ['날씨', '구름', '비', '바람', '지나감', '일기예보', '계절'],
    20: ['친절', '자기자비', '따뜻함', '스스로위로', '자책', '스스로에게친절'],
    21: ['방아쇠', '트리거', '패턴', '취약점', '자극', '불안원인'],
    22: ['파국화', '최악', '현실점검', '과대평가', '망할것같', '극단적'],
    23: ['통제', '원', '통제할수있는', '포기할것', '내손밖', '내손안'],
    24: ['용기', '두려움', '한걸음', '실행', '작은시도', '망설임'],
    25: ['가치', '나침반', '의미', '소중한것', '방향', '삶의목적'],
    26: ['감사', '세가지', '고마움', '긍정', '작은행복'],
    27: ['경계', '거절', '바운더리', '선긋기', '눈치', '타인시선'],
    28: ['비교', '남들과', '열등감', '자존감', '질투', '비교멈추기'],
    29: ['완벽', '완벽주의', '충분함', '실수', '불완전', '강박'],
    30: ['불확실', '모호함', '통제욕구', '미래걱정', '알수없는'],
    31: ['자책', '후회', '과거', '죄책감', '용서', '스스로용서'],
    32: ['내면아이', '어린시절', '보듬기', '안아주기', '상처받은아이'],
    33: ['슬픔', '눈물', '애도', '상실', '울어도돼', '가슴아픔'],
    34: ['분노', '화', '억울함', '답답함', '가슴터짐', '속상함'],
    35: ['무기력', '번아웃', '방전', '의욕없음', '침대', '지침'],
    36: ['외로움', '고립', '혼자', '소외감', '연결', '고독'],
    37: ['밤', '불면', '잠안옴', '수면', '새벽', '잠들기전'],
    38: ['안전기지', '안식처', '나만의공간', '보호막', '평화'],
    39: ['미래', '막막함', '진로', '취업', '시험', '앞날'],
    40: ['통합', '온전함', '마음약방', '치유완성', '자유', '평온']
  };

  for (const ex of KEY_EXERCISES_CATALOG) {
    let score = 0;

    // 1. 제목 직접 언급
    if (combined.includes(ex.title.toLowerCase())) score += 20;
    if (combined.includes(ex.tag.toLowerCase())) score += 10;
    if (ex.subtitle && combined.includes(ex.subtitle.toLowerCase())) score += 8;

    // 2. 특화 키워드 매칭
    const keywords = KEYWORD_MAP[ex.globalIndex] || [];
    for (const kw of keywords) {
      if (combined.includes(kw)) score += 6;
    }

    // 3. 목적 및 팁 키워드 매칭
    const tokens = (ex.purpose + ' ' + ex.clinicalTip).split(/[\s,·.]+/);
    for (const tok of tokens) {
      if (tok.length >= 2 && combined.includes(tok)) {
        score += 1;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = ex;
    }
  }

  return bestMatch;
}
