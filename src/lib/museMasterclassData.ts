import { getDateSeed } from './dailyCache';
import type { UserProfile } from './sharedState';

export type MasterpieceCategory = 'painting' | 'music' | 'poem' | 'quote';

export interface MasterItem {
  id: string;
  name: string;
  title: string;
  piece: string;
  medium: string;
  category: MasterpieceCategory;
  icon: string;
  imageUrl?: string;
  originalMuseum?: string;
  musicVideoId?: string;
  musicArtist?: string;
  musicListeningGuide?: string;
  poemText?: string;
  poet?: string;
  quoteText?: string;
  quoteSource?: string;
  masterpieceInsight: string;
  masterDirectAdvice: string;
  creativeSparkTechnique: string;
  colorPalette: string[];
  inspirationAffirmation: string;
}

export interface MasterpieceDialogueData {
  title: string;
  masterName: string;
  masterTitle: string;
  masterpieceName: string;
  masterpieceMedium: string;
  category: MasterpieceCategory;
  masterpieceInsight: string;
  masterDirectAdvice: string;
  creativeSparkTechnique: string;
  colorPalette: string[];
  inspirationAffirmation: string;
  // Category specific payloads
  musicVideoId?: string;
  musicArtist?: string;
  musicListeningGuide?: string;
  poemText?: string;
  poet?: string;
  quoteText?: string;
  quoteSource?: string;
  originalMuseum?: string;
}

export const MASTERS_CATALOG: MasterItem[] = [
  // 1. 명화 (Paintings)
  {
    id: 'vangogh',
    name: '빈센트 반 고흐 (Vincent van Gogh)',
    title: '불꽃의 영혼 화가',
    piece: '별이 빛나는 밤 (The Starry Night, 1889)',
    medium: '유화 (Oil on Canvas) · 뉴욕 현대미술관(MoMA) 소장',
    category: 'painting',
    icon: '🌌',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    originalMuseum: '뉴욕 현대미술관 (The Museum of Modern Art, MoMA)',
    masterpieceInsight: '가장 짙고 불안한 어둠 속에서도 11개의 별과 황금빛 초승달은 격렬한 소용돌이로 타오르고 있습니다. 고통과 고독은 결코 장애물이 아니라, 영혼의 가장 찬란한 빛을 토해내게 만드는 거룩한 용광로입니다.',
    masterDirectAdvice: '나의 소중한 벗이여, 마음속의 폭풍과 정체기를 두려워하지 마십시오. 머리로 계산하고 남들의 눈치를 보지 말고, 심장의 심연에서 끓어오르는 순수한 감정의 원형을 세상에 쏟아내십시오. 그대의 상처가 바로 별이 빛나는 밤의 붓질이 됩니다.',
    creativeSparkTechnique: '임파스토(Impasto) 직관 돌파: 생각을 거치지 않고 가장 두텁고 솔직한 질감으로 지금 느껴지는 감정을 캔버스나 노트에 거침없이 쏟아붓기',
    colorPalette: ['#1E3A8A (심연의 딥 울트라마린)', '#F59E0B (소용돌이치는 황금빛 별)', '#065F46 (영원의 사이프러스 딥 그린)'],
    inspirationAffirmation: '나는 내 안의 모든 고뇌와 어둠을 눈부신 창조적 영감의 별빛으로 승화시킨다.',
  },
  {
    id: 'monet',
    name: '클로드 모네 (Claude Monet)',
    title: '빛과 시간의 연금술사',
    piece: '수련 연작 (Water Lilies / Nymphéas, 1914–1926)',
    medium: '인상주의 유화 · 파리 오랑주리 미술관 / 메트로폴리탄 미술관 소장',
    category: 'painting',
    icon: '🪷',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg',
    originalMuseum: '파리 오랑주리 미술관 (Musée de l\'Orangerie) / 뉴욕 메트로폴리탄 미술관 (The Met)',
    masterpieceInsight: '지평선도 경계도 없는 수면 위에 하늘과 구름, 버드나무와 수련이 끝없이 겹쳐집니다. 고정된 실체란 없습니다. 끊임없이 흐르고 변화하는 빛의 찰나를 온몸으로 포착할 때 영원은 지금 이 순간에 깃듭니다.',
    masterDirectAdvice: '그대여, 완벽한 결과를 통제하려는 긴장을 내려놓으십시오. 수면이 바람에 흔들리듯 모든 상태를 그대로 허용하세요. 선명한 윤곽을 그리려 애쓰지 말고, 순간순간 스쳐 지나가는 빛과 감각의 부드러운 인상에 그저 몸을 맡기십시오.',
    creativeSparkTechnique: '연작(Series)의 시선: 하나의 대상을 시간의 흐름(새벽, 정오, 황혼)에 따라 가볍게 연속해서 스케치하며 집착을 해체하기',
    colorPalette: ['#38BDF8 (빛을 머금은 수면 스카이블루)', '#A855F7 (오후의 라벤더 바이올렛)', '#10B981 (생명의 부유 수련 에메랄드)'],
    inspirationAffirmation: '나는 흐르는 시간의 찰나 속에서 무한한 빛과 평화를 자유롭게 직조한다.',
  },
  {
    id: 'klimt',
    name: '구스타프 클림트 (Gustav Klimt)',
    title: '황금빛 관능과 생명의 거장',
    piece: '키스 (The Kiss / Der Kuss, 1907–1908)',
    medium: '금박 유화 (Oil & Gold Leaf) · 오스트리아 벨베데레 궁전 미술관 소장',
    category: 'painting',
    icon: '✨',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/1280px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    originalMuseum: '오스트리아 비엔나 벨베데레 궁전 미술관 (Österreichische Galerie Belvedere)',
    masterpieceInsight: '꽃이 만발한 벼랑 끝에서도 두 연인은 순수한 황금빛 아우라로 감싸여 영원한 일체감을 누립니다. 삶의 유한성과 죽음의 그림자조차 진정한 사랑과 창조의 에로스 앞에서는 찬란한 황금으로 변용됩니다.',
    masterDirectAdvice: '예술가여, 그대 자신을 둘러싼 평범한 한계를 거부하십시오. 가장 귀하고 화려한 영감은 바로 그대의 가장 깊은 본능과 순수한 열정 속에 있습니다. 두려움을 화려한 황금빛 장식과 대담한 색채로 감싸 안아 독보적인 아우라를 만드십시오.',
    creativeSparkTechnique: '골든 리프(Gold Leaf) 콘트라스트: 거친 일상의 소재 위에 가장 눈부신 찬란한 디테일(금빛, 빛나는 단어)을 입혀 비범한 상징으로 탈바꿈하기',
    colorPalette: ['#FBBF24 (초월적 오스트리아 임페리얼 골드)', '#E11D48 (생명의 붉은 꽃 루비)', '#312E81 (심연의 미드나이트 인디고)'],
    inspirationAffirmation: '나는 나 자신의 가장 깊은 열정과 생명력을 눈부신 황금빛 걸작으로 빚어낸다.',
  },
  {
    id: 'vermeer',
    name: '요하네스 페르메이르 (Johannes Vermeer)',
    title: '빛과 정적의 마스터',
    piece: '진주 귀걸이를 한 소녀 (Girl with a Pearl Earring, c. 1665)',
    medium: '유화 (Oil on Canvas) · 네덜란드 마우리츠하위스 왕립미술관 소장',
    category: 'painting',
    icon: '🧕',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/1024px-1665_Girl_with_a_Pearl_Earring.jpg',
    originalMuseum: '네덜란드 헤이그 마우리츠하위스 미술관 (Mauritshuis)',
    masterpieceInsight: '어둠의 심연에서 고개를 돌리는 찰나, 터키석 블루 터번과 한 방울의 영롱한 진주가 온 우주의 빛을 응축합니다. 과장된 설명 없이 단 하나의 시선과 정적만으로도 인간 영혼의 순수한 신비를 증명합니다.',
    masterDirectAdvice: '많은 것을 말하려 애쓰지 마십시오. 진정한 울림은 장황한 웅변이 아니라 정적 속의 한 방울 빛에서 시작됩니다. 군더더기를 과감히 걷어내고, 오직 단 하나의 본질적인 시선과 감정에 온전히 집중하십시오.',
    creativeSparkTechnique: '카메라 옵스큐라(Camera Obscura) 미니멀리즘: 불필요한 배경 요소를 모두 지우고 단 하나의 영롱한 하이라이트 지점에만 시선을 모으기',
    colorPalette: ['#0284C7 (청금석 울트라마린 라피스라줄리)', '#FEF08A (영롱한 진주빛 크림 아이보리)', '#09090B (정적의 옵시디언 블랙)'],
    inspirationAffirmation: '나는 내면의 고요한 침묵 속에서 가장 맑고 순수한 영혼의 빛을 길어 올린다.',
  },

  // 2. 명곡 (Music)
  {
    id: 'debussy',
    name: '클로드 드뷔시 (Claude Debussy)',
    title: '소리의 인상주의자',
    piece: '달빛 (Clair de Lune - 베르가마스크 모음곡 3악장)',
    medium: '인상주의 피아노 명곡 (Piano Solo & Impressionist Nocturne)',
    category: 'music',
    icon: '🎹',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Henri_Le_Sidaner_-_Clair_de_lune.jpg/1280px-Henri_Le_Sidaner_-_Clair_de_lune.jpg',
    musicVideoId: 'WNcsUNKlAKw',
    musicArtist: '클로드 드뷔시 (Claude Debussy)',
    musicListeningGuide: '달빛이 잔잔한 수면에 부서져 내리는 순간의 파동과 침묵의 여백에 귀를 기울여보세요. 규칙적인 박자를 잊고 음표와 음표 사이의 호흡을 온전히 음미합니다.',
    masterpieceInsight: '전통적인 화성학의 규칙을 허물고 온음계와 잔향의 여백으로 빚어낸 밤의 시입니다. 음악은 음표에 있는 것이 아니라 음표와 음표 사이의 고요한 침묵 속에 살아 숨쉽니다.',
    masterDirectAdvice: '기존의 틀이나 공식에 자신을 억지로 맞추지 마십시오. 세상의 규칙 대신 그대 귓가에 맴도는 은은한 감각의 속삭임에 귀를 기울이세요. 힘을 빼고 부드럽게 건반을 터치하듯, 가장 자유로운 호흡으로 그대만의 색채를 펼치십시오.',
    creativeSparkTechnique: '네거티브 스페이스(Negative Space) 침묵의 휴지: 말이나 작업 사이에 의도적인 3초의 쉼표를 두어 여운과 잔향의 깊이 증폭시키기',
    colorPalette: ['#E0F2FE (부서지는 달빛 펄 블루)', '#6366F1 (몽환의 인디고 트와일라잇)', '#F1F5F9 (은빛 안개 실버)'],
    inspirationAffirmation: '나는 세상의 정형화된 틀을 벗어나 자유로운 영혼의 선율로 세상을 물들인다.',
  },
  {
    id: 'bach',
    name: '요한 제바스티안 바흐 (J.S. Bach)',
    title: '신성한 음악의 아버지',
    piece: '골드베르크 변주곡 (Goldberg Variations, BWV 988 - Aria)',
    medium: '대위법 건반 명작 (Sacred Counterpoint & Universal Harmony)',
    category: 'music',
    icon: '🎼',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Johann_Sebastian_Bach.jpg/800px-Johann_Sebastian_Bach.jpg',
    musicVideoId: 'Ah392lnFHxM',
    musicArtist: '요한 제바스티안 바흐 (J.S. Bach)',
    musicListeningGuide: '32마디 베이스 저음 선율 위에 피어나는 30개의 정교한 우주적 변주입니다. 어지러운 생각들이 수학적인 완전한 질서와 거룩한 평온 속으로 단정하게 수렴됩니다.',
    masterpieceInsight: '단 하나의 소박한 아리아 저음 선율이 30개의 전혀 다른 우주로 꽃피어납니다. 반복되는 일상과 단조로운 삶이야말로 무한한 변주와 성장의 토양임을 수학적 신성성으로 증명합니다.',
    masterDirectAdvice: '작은 일상의 루틴을 가볍게 여기지 마십시오. 가장 위대한 걸작은 매일 반복되는 기본 저음의 충실함 위에 세워집니다. 지금 눈앞의 단순한 과정을 거룩한 마음으로 정성껏 다듬으십시오. 그것이 거대한 하모니의 시작입니다.',
    creativeSparkTechnique: '모티프 변주(Motif Variation): 하나의 작은 생각이나 습관을 3가지 다른 각도(느리게, 대담하게, 뒤집어서)로 변주해보기',
    colorPalette: ['#D97706 (장엄한 파이프오르간 앤틱 골드)', '#78350F (대지의 참나무 딥 브라운)', '#FEF3C7 (천상의 하모니 크림)'],
    inspirationAffirmation: '나는 일상의 소박한 박자 속에서 우주의 신성한 질서와 무한한 조화를 빚어낸다.',
  },
  {
    id: 'beethoven',
    name: '루트비히 판 베토벤 (Ludwig van Beethoven)',
    title: '운명을 극복한 거인',
    piece: '피아노 소나타 제14번 \'월광\' 1악장 (Moonlight Sonata, Op.27 No.2)',
    medium: '낭만주의 피아노 소나타 (Adagio Sostenuto)',
    category: 'music',
    icon: '🎹',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/800px-Beethoven.jpg',
    musicVideoId: '4Tr0otuiQuU',
    musicArtist: '루트비히 판 베토벤 (L.v. Beethoven)',
    musicListeningGuide: '깊은 밤 잔잔한 호수 위에 부서지는 달빛의 고요한 슬픔과, 그 심연 속에서 단단하게 솟아오르는 불굴의 영혼 의지를 감상하세요.',
    masterpieceInsight: '청력을 잃어가는 절망의 벼랑 끝에서 베토벤은 귀가 아닌 영혼의 안쪽으로 울리는 천상의 울림을 기록했습니다. 운명의 거친 파도는 영혼을 굴복시키지 못하며, 오히려 심연의 깊이를 더해줄 뿐입니다.',
    masterDirectAdvice: '시련과 고통 앞에서 무릎 꿇지 마십시오. 그대가 겪는 절망은 창작과 영혼을 무너뜨리는 적이 아니라, 당신 안에 잠든 거인을 깨우는 거룩한 천둥소리입니다. 운명의 목덜미를 부여잡고 당신만의 당당한 선율을 연주하십시오.',
    creativeSparkTechnique: '아다지오 소스테누토(Sostenuto): 감정이 격해질 때 템포를 늦추고 깊은 복식호흡으로 심연의 묵직한 힘을 모으기',
    colorPalette: ['#1E1B4B (심야의 루체른 호수 미드나이트)', '#64748B (고독한 달빛 슬레이트)', '#F8FAFC (순백의 영혼 화이트)'],
    inspirationAffirmation: '나는 어떤 운명의 시련 속에서도 굴복하지 않고 내 영혼의 승리를 창조한다.',
  },
  {
    id: 'chopin',
    name: '프레데리크 쇼팽 (Frédéric Chopin)',
    title: '피아노의 영혼 시인',
    piece: '야상곡 제2번 E플랫 장조 (Nocturne Op.9 No.2)',
    medium: '서정적 낭만주의 피아노 명작 (Bel Canto Piano Nocturne)',
    category: 'music',
    icon: '🕊️',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/800px-Frederic_Chopin_photo.jpeg',
    musicVideoId: '9E6b3swbnWg',
    musicArtist: '프레데리크 쇼팽 (Frédéric Chopin)',
    musicListeningGuide: '섬세하게 노래하는 벨칸토 선율과 왼손의 부드러운 아르페지오를 타고 지친 마음의 상처가 벨벳처럼 따뜻하게 감싸 안깁니다.',
    masterpieceInsight: '조국을 잃은 슬픔과 병약한 육신의 한계 속에서도 쇼팽은 건반 위에 가장 우아하고 고결한 눈물을 꽃피웠습니다. 부드러움과 서정성은 나약함이 아니라 세상을 치유하는 가장 강력한 영적 무기입니다.',
    masterDirectAdvice: '억지로 강한 척하거나 거칠어질 필요가 없습니다. 그대의 가장 섬세하고 연약한 감수성이야말로 누구도 흉내 낼 수 없는 고유한 마법입니다. 가슴속에 머무는 아련한 그리움과 다정함을 솔직하게 표현하십시오.',
    creativeSparkTechnique: '템포 루바토(Tempo Rubato): 엄격한 시간에 얽매이지 않고 감정의 물결을 따라 완급을 조절하며 자연스러운 리듬 회복하기',
    colorPalette: ['#F43F5E (가슴 뭉클한 로즈 핑크)', '#8B5CF6 (황혼의 바이올렛 벨벳)', '#FFF1F2 (부드러운 실크 크림)'],
    inspirationAffirmation: '나는 내 안의 가장 여린 감수성을 온 세상을 적시는 따뜻한 예술로 꽃피운다.',
  },

  // 3. 명시 (Poem)
  {
    id: 'rilke',
    name: '라이너 마리아 릴케 (Rainer Maria Rilke)',
    title: '영혼의 고독과 장미의 시인',
    piece: '가을날 (Herbsttag)',
    medium: '상징주의 명시 (Symbolist Masterpiece Poem)',
    category: 'poem',
    icon: '🍂',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rainer_Maria_Rilke_1900.jpg/800px-Rainer_Maria_Rilke_1900.jpg',
    poet: '라이너 마리아 릴케 (Rainer Maria Rilke)',
    poemText: `주여, 때가 왔습니다. 여름은 참으로 위대했습니다.
해시계 위에 당신의 그림자를 얹으시고
들판에 바람을 풀어놓으십시오.

마지막 과일들이 무르익도록 명하시고
이틀만 더 남국의 햇빛을 베푸시어
과일들이 차오르도록 재촉하시고
독한 포도주 속에 마지막 단맛을 채워주십시오.

지금 집이 없는 사람은 이제 집을 짓지 않습니다.
지금 혼자인 사람은 오래도록 혼자로 남아
잠 못 이루고, 책을 읽고, 긴 편지를 쓸 것이며
낙엽이 뒹구는 날이면 불안스레
가로수 길을 이리저리 헤맬 것입니다.`,
    masterpieceInsight: '풍요로웠던 여름의 잎사귀들이 모두 떨어져 내리는 가을의 끝자락, 시인은 고독을 외면하지 않고 온전히 끌어안습니다. 잎사귀가 질 때 비로소 드러나는 나무의 뼈대처럼, 고독 속에서만 영혼의 참된 본질이 서늘하게 빛납니다.',
    masterDirectAdvice: '외로움과 고독을 두려워하지 마십시오. 세상의 소란함에서 벗어나 혼자 남겨진 바로 이 시간이 그대의 내면 서랍을 정리하고 가장 깊은 통찰을 건져 올리는 축복의 계절입니다. 불안을 피하지 말고 고요히 응시하십시오.',
    creativeSparkTechnique: '말테의 일기 관조법: 오늘 하루 마주친 평범한 사물 하나를 5분 동안 아무 판단 없이 가만히 바라보며 존재의 무게 느끼기',
    colorPalette: ['#B45309 (무르익은 가을 앰버)', '#78350F (떨어지는 낙엽 세피아)', '#FEF3C7 (희미한 햇살 베이지)'],
    inspirationAffirmation: '나는 고독의 품 안에서 내 영혼의 가장 깊고 영롱한 진실을 발견한다.',
  },
  {
    id: 'yoondongju',
    name: '윤동주 (Yoon Dong-ju)',
    title: '별을 노래한 청년 시인',
    piece: '별 헤는 밤 (Counting the Stars at Night, 1941)',
    medium: '한국 근대 서정 명시 (Korean Pure Lyric Masterpiece)',
    category: 'poem',
    icon: '⭐',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Yun_Dong-ju.jpg/800px-Yun_Dong-ju.jpg',
    poet: '윤동주 (Yoon Dong-ju)',
    poemText: `계절이 지나가는 하늘에는
가을로 가득 차 있습니다.

나는 아무 걱정도 없이
가을 속의 별들을 다 헤일 듯합니다.

가슴 속에 하나 둘 새겨지는 별을
이제 다 못 헤는 것은
쉬이 아침이 오는 까닭이요,
내일 밤이 남은 까닭이요,
아직 나의 청춘이 다하지 않은 까닭입니다.

별 하나에 추억과
별 하나에 사랑과
별 하나에 쓸쓸함과
별 하나에 동경과
별 하나에 시와
별 하나에 어머니, 어머니,

어머님, 나는 별 하나에 아름다운 말 한 마디씩 불러 봅니다.`,
    masterpieceInsight: '암흑의 시대 속에서도 한 점 부끄럼 없기를 소망하며 밤하늘의 별을 헤던 청년 시인의 고결한 영혼입니다. 어둠이 짙을수록 순결한 양심과 소망의 별빛은 시대를 넘어 영원히 꺼지지 않는 등대가 됩니다.',
    masterDirectAdvice: '세상이 거칠고 메말라 보일지라도, 그대 가슴속에 품은 순수한 이상과 다정함을 결코 잃지 마십시오. 남들이 알아주지 않아도 별 하나에 사랑과 시를 새기는 그대의 순결한 태도가 당신의 삶을 거룩하게 지켜줄 것입니다.',
    creativeSparkTechnique: '별빛 네이밍(Star Naming): 지금 나를 괴롭히는 감정이나 감사한 인연에게 가장 아름다운 이름을 붙여 가만히 불러보기',
    colorPalette: ['#1E3A8A (가을밤 깊은 청색)', '#FDE047 (순결한 소망의 별빛 옐로)', '#F1F5F9 (순백의 청춘 화이트)'],
    inspirationAffirmation: '나는 밤하늘의 별처럼 맑고 순결한 마음으로 나의 길을 묵묵히 걸어간다.',
  },

  // 4. 명언 & 철학 (Quote & Philosophy)
  {
    id: 'hesse',
    name: '헤르만 헤세 (Hermann Hesse)',
    title: '영혼의 탐도자 & 노벨문학상 거장',
    piece: '데미안 (Demian - 아프락사스의 날개, 1919)',
    medium: '철학 소설 & 자아 발견의 여정 (Self-Discovery Masterwork)',
    category: 'quote',
    icon: '🦅',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Hermann_Hesse_1927.jpg/800px-Hermann_Hesse_1927.jpg',
    quoteSource: '헤르만 헤세, 〈데미안 (Demian)〉 제5장 중에서',
    quoteText: `새는 알에서 나오려고 투쟁한다. 알은 세계이다.
태어나려는 자는 하나의 세계를 깨뜨려야 한다.
새는 신을 향해 날아간다.
그 신의 이름은 아프락사스다.`,
    masterpieceInsight: '안전하고 익숙한 껍질을 깨뜨리지 않고는 새로운 존재로 비상할 수 없습니다. 밝음과 어두움, 선과 악, 이성과 본능을 모두 품어 안는 신 아프락사스처럼, 진정한 성장은 자신의 모든 그림자까지 온전히 통합하는 데서 완성됩니다.',
    masterDirectAdvice: '친애하는 벗이여, 지금 느끼는 답답함과 고통은 당신이 갇힌 알의 벽을 깨뜨리고 있다는 증거입니다. 과거의 안락한 껍질에 머물려 하지 마십시오. 껍질이 부서지는 파열음을 기쁘게 맞이하고, 당신 안의 날개를 활짝 펼치십시오.',
    creativeSparkTechnique: '알 깨기 브레이크스루: 내가 안전하다고 믿어온 고정관념 1가지를 적고, 그것의 정반대 관점을 3문장으로 수용해보기',
    colorPalette: ['#D97706 (알을 깨고 나오는 황금 독수리)', '#475569 (부서지는 세계의 회색 껍질)', '#0284C7 (신성한 아프락사스의 창공)'],
    inspirationAffirmation: '나는 낡은 껍질을 깨뜨리고 내 안의 진정한 자아를 향해 거침없이 비상한다.',
  },
  {
    id: 'nietzsche',
    name: '프리드리히 니체 (Friedrich Nietzsche)',
    title: '망치를 든 철학자 & 춤추는 영혼',
    piece: '차라투스트라는 이렇게 말했다 (Also sprach Zarathustra, 1883)',
    medium: '실존 철학 명작 & 운명애(Amor Fati)',
    category: 'quote',
    icon: '⚡',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nietzsche187a.jpg/800px-Nietzsche187a.jpg',
    quoteSource: '프리드리히 니체, 〈차라투스트라는 이렇게 말했다〉 머리말 중에서',
    quoteText: `사람은 자기 안에 혼돈(Chaos)을 지니고 있어야만,
춤추는 별 하나를 탄생시킬 수 있다.
나는 너희에게 말하노니,
너희 안에는 여전히 카오스가 살아 숨 쉬고 있다!`,
    masterpieceInsight: '모든 창조의 어머니는 질서가 아니라 통제되지 않은 생생한 혼돈입니다. 혼돈을 결핍이나 결함으로 보지 않고, 춤추는 별을 잉태한 거대한 에너지로 긍정할 때 인간은 자신의 운명을 열렬히 사랑하는 초인(Übermensch)이 됩니다.',
    masterDirectAdvice: '머릿속이 복잡하고 뒤죽박죽이라 해서 자책하지 마십시오! 그 혼돈이야말로 새로운 별이 폭발하듯 태어나기 직전의 성스러운 자궁입니다. 정돈된 모범생이 되려 하지 말고, 당신 안의 거친 혼돈을 긍정하며 춤추게 하십시오.',
    creativeSparkTechnique: '아모르 파티(Amor Fati) 역발상: 오늘 나를 가장 귀찮게 한 사건을 "나를 더 강하게 만들 우주의 선물"로 다시 명명하기',
    colorPalette: ['#EF4444 (타오르는 불꽃의 열정 레드)', '#F59E0B (춤추는 초신성의 골드)', '#0F172A (혼돈의 심연 딥 네이비)'],
    inspirationAffirmation: '나는 내 안의 모든 혼돈을 사랑하며 눈부시게 춤추는 별을 탄생시킨다.',
  },
];

/**
 * 날짜 시드와 사용자 고민, 프로필을 결합하여 매일매일 새로운 거장별 맞춤 조언 및 통찰 산출
 */
export function getMasterpieceDynamicDialogue(
  master: MasterItem,
  userDilemma?: string,
  userProfile?: UserProfile | null,
  dateSeedKey?: string
): MasterpieceDialogueData {
  const seed = getDateSeed(dateSeedKey || `muse_master_${master.id}_${new Date().toISOString().slice(0, 10)}`);
  const nickname = userProfile?.basic?.nickname || userProfile?.basic?.name || '소중한 벗';
  const dilemmaText = (userDilemma || '').trim();

  // 날짜별 변화하는 다이내믹 변주 문구
  const dateMod = seed % 3;

  let customizedAdvice = master.masterDirectAdvice;
  let customizedInsight = master.masterpieceInsight;
  let customizedAffirmation = master.inspirationAffirmation;

  if (dilemmaText) {
    customizedAdvice = `${nickname}님, 나누어 주신 이야기("${dilemmaText}")를 깊이 경청했습니다. ${master.masterDirectAdvice}`;
  } else {
    customizedAdvice = `${nickname}님, ${master.masterDirectAdvice}`;
  }

  if (dateMod === 1) {
    customizedAffirmation = `오늘 나는 ${master.name}의 거룩한 정신과 호흡을 맞추며, ${master.inspirationAffirmation}`;
  } else if (dateMod === 2) {
    customizedAffirmation = `지금 이 순간, ${master.inspirationAffirmation}`;
  }

  return {
    title: `〈${master.name}〉 ${master.piece} 예술 영감 마스터클래스`,
    masterName: master.name,
    masterTitle: master.title,
    masterpieceName: master.piece,
    masterpieceMedium: master.medium,
    category: master.category,
    masterpieceInsight: customizedInsight,
    masterDirectAdvice: customizedAdvice,
    creativeSparkTechnique: master.creativeSparkTechnique,
    colorPalette: master.colorPalette,
    inspirationAffirmation: customizedAffirmation,
    musicVideoId: master.musicVideoId,
    musicArtist: master.musicArtist,
    musicListeningGuide: master.musicListeningGuide,
    poemText: master.poemText,
    poet: master.poet,
    quoteText: master.quoteText,
    quoteSource: master.quoteSource,
    originalMuseum: master.originalMuseum,
  };
}
