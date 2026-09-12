import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Palette, 
  Music, 
  BookOpen, 
  Heart, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  Feather, 
  ChevronRight, 
  Check, 
  Copy, 
  FileText,
  Maximize2,
  Download,
} from "lucide-react";
import { ImageOutputActions, downloadImage } from "@/components/ImageOutputActions";
import { auth, db, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "@/lib/firebase";
import { getTodayDateKey, getDateSeed, isSameDayString, pickDailySeededItem } from "@/lib/dailyCache";
import { MuseDocentAudio } from "@/components/muse/MuseDocentAudio";
import { buildPoemGoogleArtsAndCultureSearchUrl, buildArtworkGoogleArtsAndCultureSearchUrl, buildPoemFullTextSearchQuery, buildPoemGoogleAiSearchUrl } from "@/utils/artSearchQuery";
import { lookupCatalogDailyArtUrl, resolveArtworkDailyArtUrl } from "@/lib/museDailyArt";
import { MuseSongYouTubePlayer } from "@/components/muse/MuseSongYouTubePlayer";
import { recordPrismFeature } from "@/lib/prismOmniSync";
import {
  resolveArtworkImage,
  buildPollinationsArtUrl,
  type ArtworkImageSource,
} from "@/utils/artworkImage";
import { useApp } from "@/contexts/AppContext";
import { sendArtRecommendationToLucy } from "@/lib/oracleDeepInsight";
import { getPendingPrismToss, clearPrismToss, type PrismTossPayload } from "@/lib/prismToss";

interface FamousPoem {
  title: string;
  titleOriginal?: string;
  poet: string;
  poetOriginal?: string;
  excerpt: string;
  whyRecommended: string;
  siyoilUrl?: string;
  poemSourceName?: string;
}

interface FamousSong {
  title: string;
  titleOriginal?: string;
  artist: string;
  artistOriginal?: string;
  listeningGuide: string;
  youtubeVideoId?: string;
  appleMusicClassicalUrl?: string;
  songSourceName?: string;
}

interface ArtRecommendation {
  title: string;
  titleOriginal?: string;
  creator: string;
  creatorOriginal?: string;
  artworkType: string;
  era: string;
  description: string;
  whyRecommended: string;
  challenges: string[];
  aestheticTone: string;
  quote: string;
  catalogId?: string;
  dailyArtUrl?: string;
  imageUrl?: string;
  sourceName?: string;
  year?: string;
  style?: string;
  medium?: string;
  location?: string;
  docentInsight?: string;
  famousPoem?: FamousPoem;
  famousSong?: FamousSong;
}

const DAILY_POEM_SONG_FALLBACKS: Array<{ famousPoem: FamousPoem; famousSong: FamousSong }> = [
  {
    famousPoem: {
      title: "호수 1",
      titleOriginal: "호수 1",
      poet: "정지용 (대한민국)",
      poetOriginal: "정지용",
      excerpt: "얼굴 하나야 / 손바닥 둘로 폭 가리지만",
      whyRecommended: "고요한 수면처럼 마음속 그리움을 가만히 들여다보게 하는 시입니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=396&subcontentid=24605",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "달빛 (Clair de Lune)",
      titleOriginal: "Clair de Lune",
      artist: "클로드 드뷔시",
      artistOriginal: "Claude Debussy",
      listeningGuide: "물결처럼 번지는 피아노의 여백과 잔향에 집중해 보세요.",
      youtubeVideoId: "WNcsUNKlAKw",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1358340973",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "조용하게, 강으로, 그러다 흐르라",
      titleOriginal: "조용하게, 강으로, 그러다 흐르라",
      poet: "김용택 (대한민국)",
      poetOriginal: "김용택",
      excerpt: "사람들 속에서 조용하게, 강으로, 그러다 흐르라.",
      whyRecommended: "흔들림 속에서도 자신의 중심과 순수한 의지를 다시 세우게 합니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=2515&subcontentid=69084",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "교향곡 5번 다단조, Op.67",
      titleOriginal: "Symphony No. 5 in C minor, Op. 67",
      artist: "루트비히 판 베토벤",
      artistOriginal: "Ludwig van Beethoven",
      listeningGuide: "운명 동기가 절망을 뚫고 승리의 리듬으로 변화하는 과정을 따라가 보세요.",
      youtubeVideoId: "_4IRnGS1l48",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1499288492",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "몰라서 좋아요",
      titleOriginal: "몰라서 좋아요",
      poet: "오은 (대한민국)",
      poetOriginal: "오은",
      excerpt: "모르는 감정이 싹텄다 / 몰라서 설레고",
      whyRecommended: "자신만의 창작 방향을 선택할 용기와 긴 호흡을 일깨워 줍니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=2355&subcontentid=63217",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "무반주 첼로 모음곡 1번 프렐류드",
      titleOriginal: "Cello Suite No. 1 in G major, BWV 1007: Prelude",
      artist: "요한 제바스티안 바흐",
      artistOriginal: "Johann Sebastian Bach",
      listeningGuide: "한 줄의 선율이 질서와 자유를 동시에 만들어내는 흐름에 집중해 보세요.",
      youtubeVideoId: "1prwe0WcGY8",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1398580507",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "서시",
      titleOriginal: "서시",
      poet: "윤동주 (대한민국)",
      poetOriginal: "윤동주",
      excerpt: "죽는 날까지 하늘을 우러러 / 한 점 부끄럼이 없기를",
      whyRecommended: "맑고 투명한 영혼의 거울을 들여다보며 내면의 양심과 의지를 곧게 세워 줍니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=405&subcontentid=25164",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "엘리제를 위하여 (Für Elise)",
      titleOriginal: "Für Elise",
      artist: "루트비히 판 베토벤",
      artistOriginal: "Ludwig van Beethoven",
      listeningGuide: "섬세하게 이어지는 멜로디의 선율 속에 흐르는 마음의 정서를 느껴보세요.",
      youtubeVideoId: "yAsDLGjMhFI",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "진달래꽃",
      titleOriginal: "진달래꽃",
      poet: "김소월 (대한민국)",
      poetOriginal: "김소월",
      excerpt: "나 보기가 역겨워 / 가실 때에는",
      whyRecommended: "떠나보냄 속에서도 피어나는 지극한 사랑과 애절함의 미학을 전합니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=10&subcontentid=612",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "G선상의 아리아 (Air on the G String)",
      titleOriginal: "Air on the G String",
      artist: "요한 제바스티안 바흐",
      artistOriginal: "Johann Sebastian Bach",
      listeningGuide: "장엄하고도 깊은 울림의 첼로 선율에 맞춰 조용히 호흡해 보세요.",
      youtubeVideoId: "FZ_E_vL-Pj4",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1545642456",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "꽃",
      titleOriginal: "꽃",
      poet: "김춘수 (대한민국)",
      poetOriginal: "김춘수",
      excerpt: "내가 그의 이름을 불러주기 전에는 / 그는 다만 / 하나의 몸짓에 지나지 않았다.",
      whyRecommended: "서로에게 의미 있는 존재가 된다는 것의 깊은 영감과 실존적 만남을 깨워 줍니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=502&subcontentid=30510",
      poemSourceName: "시��일 라이브러리",
    },
    famousSong: {
      title: "사랑의 인사 (Salut d'Amour)",
      titleOriginal: "Salut d'Amour",
      artist: "에드워드 엘가",
      artistOriginal: "Edward Elgar",
      listeningGuide: "감미롭고 따뜻한 바이올린의 서정적인 선율에 귀 기울여 보세요.",
      youtubeVideoId: "MreT_U00zI8",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "흔들리며 피는 꽃",
      titleOriginal: "흔들리며 피는 꽃",
      poet: "도종환 (대한민국)",
      poetOriginal: "도종환",
      excerpt: "흔들리지 않고 피는 꽃이 어디 있으랴 / 이 세상 그 어떤 아름다운 꽃들도 / 다 흔들리면서 피었나니",
      whyRecommended: "삶의 폭풍과 흔들림을 자연스러운 과정으로 품어 안는 따뜻한 격려를 건넵니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=2050&subcontentid=55102",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "캐논 변주곡 (Canon in D)",
      titleOriginal: "Canon in D",
      artist: "요한 파헬벨",
      artistOriginal: "Johann Pachelbel",
      listeningGuide: "반복되고 점층적으로 확장되는 캐논의 평화로운 선율을 따라가 보세요.",
      youtubeVideoId: "H10vY9PZpx8",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "사평역에서",
      titleOriginal: "사평역에서",
      poet: "곽재구 (대한민국)",
      poetOriginal: "곽재구",
      excerpt: "막차는 좀처럼 오지 않았다 / 대합실 밖에는 밤새 송이눈이 쌓이고",
      whyRecommended: "추운 겨울 대합실처럼 아득하고 아늑한 기다림 속에서 인생의 낭만을 반추합니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=2001&subcontentid=54001",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "녹턴 Op.9 No.2 (Nocturne)",
      titleOriginal: "Nocturne in E-flat major, Op. 9, No. 2",
      artist: "프레데리크 쇼팽",
      artistOriginal: "Frédéric Chopin",
      listeningGuide: "밤의 감성을 깨우는 서정적이고 감미로운 피아노 선율에 몰입해 보세요.",
      youtubeVideoId: "9E6b3swgX-g",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "풀꽃",
      titleOriginal: "풀꽃",
      poet: "나태주 (대한민국)",
      poetOriginal: "나태주",
      excerpt: "자세히 보아야 / 예쁘다 // 오래 보아야 / 사랑스럽다 // 너도 그렇다",
      whyRecommended: "곁에 있는 평범하고 작은 존재들의 아름다움을 귀히 여기는 평온을 선물합니다.",
      siyoilUrl: "https://www.siyoillib.com/PoemViewer?contentid=2880&subcontentid=75012",
      poemSourceName: "시요일 라이브러리",
    },
    famousSong: {
      title: "트로이메라이 (Träumerei)",
      titleOriginal: "Träumerei",
      artist: "로베르트 슈만",
      artistOriginal: "Robert Schumann",
      listeningGuide: "꿈결 같고 부드러운 슈만의 멜로디에 맞춰 마음을 차분히 내려놓으세요.",
      youtubeVideoId: "6z82w0p6_M8",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "젊은 시인에게 주는 충고",
      titleOriginal: "Briefe an einen jungen Dichter",
      poet: "라이너 마리아 릴케 (오스트리아-독일)",
      poetOriginal: "Rainer Maria Rilke",
      excerpt: "당신 내면으로 걸어 들어가십시오. 그리고 당신에게 글을 쓰도록 명하는 그 깊은 동기를 탐색해 보십시오.",
      whyRecommended: "흔들리는 세상의 평가에 기대지 않고, 오직 내면의 가장 진실한 샘물을 길어 올리는 고독한 용기를 줍니다.",
      siyoilUrl: "https://www.google.com/search?q=Rainer+Maria+Rilke+Letters+to+a+Young+Poet",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "파반느 Op.50 (Pavane)",
      titleOriginal: "Pavane, Op. 50",
      artist: "가브리엘 포레",
      artistOriginal: "Gabriel Fauré",
      listeningGuide: "우아하면서도 아련하게 번지는 플루트 선율과 피치카토 리듬에 마음을 맡겨보세요.",
      youtubeVideoId: "mpgyEl4G9iU",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "안개 속에서",
      titleOriginal: "Im Nebel",
      poet: "헤르만 헤세 (독일-스위스)",
      poetOriginal: "Hermann Hesse",
      excerpt: "안개 속을 거니는 것은 얼마나 이상한 일인가! 모든 덤불과 돌은 외롭고, 나무들도 서로를 보지 못한다.",
      whyRecommended: "고독을 회피하지 않고 온전히 받아들일 때 비로소 진정한 자아를 발견하게 된다는 깊은 성찰을 선사합니다.",
      siyoilUrl: "https://www.google.com/search?q=Hermann+Hesse+Im+Nebel",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "피아노 협주곡 2번 2악장 아다지오",
      titleOriginal: "Piano Concerto No. 2 in C minor, Op. 18: II. Adagio sostenuto",
      artist: "세르게이 라흐마니노프",
      artistOriginal: "Sergei Rachmaninoff",
      listeningGuide: "안개를 뚫고 아침 햇살이 비치듯 서서히 고조되는 낭만적인 피아노의 온기를 느껴보세요.",
      youtubeVideoId: "bAK2J05Ts68",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "시 (Poetry)",
      titleOriginal: "La Poesía",
      poet: "파블로 네루다 (칠레)",
      poetOriginal: "Pablo Neruda",
      excerpt: "그리고 바로 그 나이에 시가 나를 찾아왔다. 나는 모른다. 어디서 그것이 왔는지.",
      whyRecommended: "예상치 못한 순간 영혼을 꿰뚫고 들어오는 예술적 영감의 찰나를 생생하게 증언합니다.",
      siyoilUrl: "https://www.google.com/search?q=Pablo+Neruda+Poetry",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "짐노페디 1번 (Gymnopédie No. 1)",
      titleOriginal: "Gymnopédie No. 1",
      artist: "에릭 사티",
      artistOriginal: "Erik Satie",
      listeningGuide: "절제된 세 음의 화음이 만드는 공간감 속에서 시적 영감의 순간을 기다려보세요.",
      youtubeVideoId: "S-Xm7s9eGxU",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "희망은 날개 달린 것",
      titleOriginal: "'Hope' is the thing with feathers",
      poet: "에밀리 디킨슨 (미국)",
      poetOriginal: "Emily Dickinson",
      excerpt: "희망은 날개 달린 것 / 영혼 속에 깃들어 / 말 없는 노래를 부르고 / 결코 멈추지 않는다.",
      whyRecommended: "어떤 모진 비바람 속에서도 꺼지지 않는 인간 영혼의 불멸하는 회복탄력성을 노래합니다.",
      siyoilUrl: "https://www.google.com/search?q=Emily+Dickinson+Hope+is+the+thing+with+feathers",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "달빛 소나타 1악장 아다지오",
      titleOriginal: "Piano Sonata No. 14 in C-sharp minor, Op. 27 No. 2: I. Adagio sostenuto",
      artist: "루트비히 판 베토벤",
      artistOriginal: "Ludwig van Beethoven",
      listeningGuide: "영혼의 가장 깊은 곳을 어루만지는 베토벤의 서정적 잔향에 귀 기울여 보세요.",
      youtubeVideoId: "4Tr0otuiQuU",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "기쁨과 슬픔에 대하여",
      titleOriginal: "On Joy and Sorrow",
      poet: "칼릴 지브란 (레바논)",
      poetOriginal: "Kahlil Gibran",
      excerpt: "슬픔이 그대의 존재를 깊이 파낼수록, 그대가 더 많은 기쁨을 담을 수 있나니.",
      whyRecommended: "삶의 아픔과 기쁨이 동전의 양면처럼 서로를 빚어낸다는 지혜로운 치유를 전합니다.",
      siyoilUrl: "https://www.google.com/search?q=Kahlil+Gibran+On+Joy+and+Sorrow",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "보칼리제 Op.34 No.14",
      titleOriginal: "Vocalise, Op. 34, No. 14",
      artist: "세르게이 라흐마니노프",
      artistOriginal: "Sergei Rachmaninoff",
      listeningGuide: "가사 없이 오직 음성/선율만으로 슬픔을 기쁨으로 승화하는 애절한 멜로디입니다.",
      youtubeVideoId: "SVnJvH7T7Q8",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "방랑자의 밤 노래",
      titleOriginal: "Wandrers Nachtlied",
      poet: "요한 볼프강 폰 괴테 (독일)",
      poetOriginal: "Johann Wolfgang von Goethe",
      excerpt: "모든 산봉우리 위에 / 고요가 깃들고 / 나뭇가지마다 / 숨소리 하나 일지 않네.",
      whyRecommended: "세상의 소란과 격정이 잦아들고 대자연의 품에서 가장 깊은 안식을 얻는 순간을 선사합니다.",
      siyoilUrl: "https://www.google.com/search?q=Goethe+Wandrers+Nachtlied",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "아베 마리아 (Ave Maria, D. 839)",
      titleOriginal: "Ellens dritter Gesang, D. 839",
      artist: "프란츠 슈베르트",
      artistOriginal: "Franz Schubert",
      listeningGuide: "영혼의 번뇌를 씻어내리는 맑고 숭고한 기도의 멜로디에 귀를 기울여 보세요.",
      youtubeVideoId: "2bosouX_d8Y",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "상승 (Élévation)",
      titleOriginal: "Élévation",
      poet: "샤를 보들레르 (프랑스)",
      poetOriginal: "Charles Baudelaire",
      excerpt: "내 영혼이여, 너는 민첩하게 움직이며, / 파도 속에서 황홀해하는 뛰어난 헤엄꾼처럼 / 말할 수 없이 깊고 남성적인 기쁨으로 끝없는 심연을 누빈다.",
      whyRecommended: "지상의 무거운 번민을 털어버리고 푸른 창공과 무한의 빛 속으로 영혼을 날아오르게 합니다.",
      siyoilUrl: "https://www.google.com/search?q=Baudelaire+Elevation+Les+Fleurs+du+mal",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "동물의 사니발 중 '백조'",
      titleOriginal: "The Carnival of the Animals: XIII. The Swan",
      artist: "카미유 생상스",
      artistOriginal: "Camille Saint-Saëns",
      listeningGuide: "물결 위를 우아하고 고결하게 미끄러져 나아가는 첼로의 유려한 선율을 음미해 보세요.",
      youtubeVideoId: "3qrKj5L67eI",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "나 자신의 노래 (Song of Myself)",
      titleOriginal: "Song of Myself",
      poet: "월트 휘트먼 (미국)",
      poetOriginal: "Walt Whitman",
      excerpt: "나는 나 자신을 찬양하고 노래한다 / 내가 취하는 것은 당신도 취할 것이니 / 내게 속한 모든 원자가 그대에게도 속한 것이므로.",
      whyRecommended: "스스로의 존엄과 우주 전체와 끈끈하게 연결된 거대한 생명력을 기탄없이 축복합니다.",
      siyoilUrl: "https://www.google.com/search?q=Walt+Whitman+Song+of+Myself",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "교향곡 9번 '신세계로부터' 2악장 라르고",
      titleOriginal: "Symphony No. 9 in E minor, Op. 95 'From the New World': II. Largo",
      artist: "안토닌 드보르자크",
      artistOriginal: "Antonín Dvořák",
      listeningGuide: "잉글리시 호른이 전하는 그리움과 광활한 대지의 호흡을 가슴 깊이 느껴보세요.",
      youtubeVideoId: "ASlch7R1wvo",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "수선화 (I Wandered Lonely as a Cloud)",
      titleOriginal: "I Wandered Lonely as a Cloud",
      poet: "윌리엄 워즈워스 (영국)",
      poetOriginal: "William Wordsworth",
      excerpt: "골짜기와 언덕 위를 높이 떠도는 구름처럼 / 외로이 헤매다가 / 나는 문득 한 무리의 황금빛 수선화를 보았네.",
      whyRecommended: "마음이 외롭고 황량할 때 기억의 창고에서 꺼내어 마음을 춤추게 만드는 기쁨의 샘물입니다.",
      siyoilUrl: "https://www.google.com/search?q=William+Wordsworth+I+Wandered+Lonely+as+a+Cloud",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "사계 협주곡 중 '봄' 1악장 알레그로",
      titleOriginal: "The Four Seasons, Concerto No. 1 in E major, Op. 8 No. 1 'La primavera': I. Allegro",
      artist: "안토니오 비발디",
      artistOriginal: "Antonio Vivaldi",
      listeningGuide: "새들의 지저귐과 시냇물의 속삭임처럼 다시 피어나는 생명의 약동을 느껴보세요.",
      youtubeVideoId: "l-dYNttdgl0",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "기탄잘리 (Gitanjali)",
      titleOriginal: "Gitanjali",
      poet: "라빈드라나트 타고르 (인도)",
      poetOriginal: "Rabindranath Tagore",
      excerpt: "당신은 나를 끝없이 만드셨으니, 그것이 당신의 기쁨입니다. 이 연약한 그릇을 비우고 또 비우시며, 언제나 새로운 생명으로 가득 채우십니다.",
      whyRecommended: "겸허하게 비워진 내면에 우주의 신비와 끝없는 사랑이 다시 채워지는 황홀한 축복을 전합니다.",
      siyoilUrl: "https://www.google.com/search?q=Rabindranath+Tagore+Gitanjali",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "교향곡 5번 4악장 아다지에토",
      titleOriginal: "Symphony No. 5 in C-sharp minor: IV. Adagietto",
      artist: "구스타프 말러",
      artistOriginal: "Gustav Mahler",
      listeningGuide: "현악기와 하프가 빚어내는 무한하고 애틋한 사랑의 고백에 깊이 빠져들어 보세요.",
      youtubeVideoId: "Les39aIKbzE",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
  {
    famousPoem: {
      title: "담배 가게 (Tabacaria)",
      titleOriginal: "Tabacaria",
      poet: "페르난두 페소아 (포르투갈)",
      poetOriginal: "Fernando Pessoa",
      excerpt: "나는 아무것도 아니다. 나는 결코 아무것도 될 수 없을 것이다. 아무것도 되길 원치도 않는다. 그럼에도 나는 내 안에 세상의 모든 꿈을 품고 있다.",
      whyRecommended: "존재의 허무조차 장엄한 무한의 꿈으로 품어 안는 현대인을 위한 진실한 시적 해방감입니다.",
      siyoilUrl: "https://www.google.com/search?q=Fernando+Pessoa+Tabacaria",
      poemSourceName: "세계 명시 라이브러리",
    },
    famousSong: {
      title: "그노시엔느 1번 (Gnossienne No. 1)",
      titleOriginal: "Gnossienne No. 1",
      artist: "에릭 사티",
      artistOriginal: "Erik Satie",
      listeningGuide: "정형화된 박자를 벗어나 공중에 흩어지는 몽환적인 음표들의 자유를 함께 유영해 보세요.",
      youtubeVideoId: "PLFVGwGQyo0",
      appleMusicClassicalUrl: "https://classical.music.apple.com/kr/album/1440843236",
      songSourceName: "Apple Music Classical",
    },
  },
];

interface ArtFallbackEntry {
  title: string;
  titleOriginal?: string;
  creator: string;
  creatorOriginal?: string;
  artworkType: string;
  era: string;
  description: string;
  whyRecommended: string;
  challenges: string[];
  aestheticTone: string;
  quote: string;
  dailyArtUrl?: string;
}

const DAILY_ART_FALLBACKS: ArtFallbackEntry[] = [
  {
    title: "수련 (Water Lilies, 1916)",
    titleOriginal: "Water Lilies",
    creator: "클로드 모네 (Claude Monet, 프랑스)",
    creatorOriginal: "Claude Monet",
    artworkType: "미술 (유화)",
    era: "인상주의 · 1916년",
    description: "빛의 변화에 따른 물그림자의 색조를 끊임없이 기록한 명작입니다. 연못의 깊이에 침잠하여 경계 없는 평온함을 선물하며 번뇌를 녹여내어 깊은 명상적 합일에 이르게 합니다.",
    whyRecommended: "지금 당신의 마음에 고요하고 부드러운 치유가 필요합니다. 세세한 격리된 감정을 흐르는 빛줄기에 스며들게 함으로써 창작의 근원 주파수를 정화해 줍니다.",
    challenges: [
      "눈을 감고 정갈한 호수 수면을 바라보는 명상을 3분간 진행해 보세요.",
      "노트 중심에 파란색이나 보라색 크레용으로 가볍게 퍼져나가는 원형 물결을 어루만지듯 그려보세요."
    ],
    aestheticTone: "수면에 반사된 보랏빛 라벤더와 에메랄드 그린 컬러톤",
    quote: "내가 수련을 그리는 것은 마음을 편안하게 만들기 위한 유일한 의식이다.",
    dailyArtUrl: "https://www.dailyartmagazine.com/water-lilies-by-claude-monet/",
  },
  {
    title: "별이 빛나는 밤 (The Starry Night, 1889)",
    titleOriginal: "The Starry Night",
    creator: "빈센트 반 고흐 (Vincent van Gogh, 네덜란드)",
    creatorOriginal: "Vincent van Gogh",
    artworkType: "미술 (유화)",
    era: "후기 인상주의 · 1889년",
    description: "요동치는 푸른 밤하늘과 소용돌이치는 황금빛 별들이 영혼의 격정을 예술로 승화한 걸작입니다. 내면의 혼란을 창조적 에너지로 치유하는 강렬한 울림을 줍니다.",
    whyRecommended: "당신의 깊은 무의식에 잠재된 열정과 빛을 일깨울 시간입니다. 어두운 밤하늘 속에서도 영롱하게 빛나는 별의 주파수에 주파수를 맞추어 보세요.",
    challenges: [
      "밤하늘을 올려다보며 가장 밝게 빛나는 별 하나를 찾아 10초간 응시해 보세요.",
      "노란색 펜으로 나만의 빛나는 별 모양을 스케치북에 힘있게 휘갈겨 보세요."
    ],
    aestheticTone: "깊은 코발트 블루, 울트라마린, 그리고 소용돌이치는 황금빛 노랑",
    quote: "나는 별들을 볼 때마다 언제나 꿈을 꾼다.",
    dailyArtUrl: "https://www.dailyartmagazine.com/vincent-van-gogh-starry-night-masterpiece/",
  },
  {
    title: "키스 (The Kiss, 1907-1908)",
    titleOriginal: "The Kiss",
    creator: "구스타프 클림트 (Gustav Klimt, 오스트리아)",
    creatorOriginal: "Gustav Klimt",
    artworkType: "미술 (혼합재료 및 금박)",
    era: "상징주의 / 아르누보 · 1908년",
    description: "금빛 광채 속에서 두 연인이 하나로 녹아내리는 영원한 결합의 순간을 그린 작품입니다. 세상의 모든 소음으로부터 격리되어 오직 깊은 연결과 충만함을 선사합니다.",
    whyRecommended: "사랑과 소통, 그리고 완벽한 일치감이 필요한 하루입니다. 흩어진 에너지를 모아 황금빛 광채 속에서 가장 소중한 가치와 합치되는 고요를 만끽하세요.",
    challenges: [
      "오늘 나 자신이나 사랑하는 사람에게 전할 감사의 한마디를 마음속으로 소리 ���어 보세요.",
      "스케치 가장자리를 따뜻한 금빛 또는 주황색 테두리로 부드럽게 감싸듯 채색해 보세요."
    ],
    aestheticTone: "눈부신 황금빛 골드, 산화된 오렌지, 기하학적 흑백 패턴",
    quote: "나에 대해 알고 싶다면 내 그림을 주의 깊게 들여다보라.",
    dailyArtUrl: "https://www.dailyartmagazine.com/gustav-klimt-the-kiss/",
  },
  {
    title: "절규 (The Scream, 1893)",
    titleOriginal: "The Scream",
    creator: "에드바르 뭉크 (Edvard Munch, 노르웨이)",
    creatorOriginal: "Edvard Munch",
    artworkType: "미술 (템페라 및 크레용)",
    era: "표현주의 · 1893년",
    description: "불타는 듯 핏빛으로 물든 하늘과 요동치는 자연의 비명에 압도되어 귀를 막고 절규하는 인간의 원초적 불안을 역동적으로 시각화한 표현주의의 기념비적 작품입니다.",
    whyRecommended: "가슴 속에 맺힌 응어리와 불안을 거침없이 배출하고 정화하는 카타르시스가 필요합니다. 감정을 억누르기보다 온전히 마주하여 흘려보내세요.",
    challenges: [
      "숨을 크게 들이마신 뒤, 입을 벌려 소리 없이 크게 소리를 내지르는 '무음 비명'을 3회 반복해 보세요.",
      "붉은색과 주황색 선을 물결 모양으로 세차게 그어 마음에 쌓인 응어리를 종이에 풀어내세요."
    ],
    aestheticTone: "타오르는 핏빛 주황, 짙은 남색 바다, 격동하는 곡선",
    quote: "나의 예술은 내 삶에 대한 고백이다.",
    dailyArtUrl: "https://www.dailyartmagazine.com/the-scream-edvard-munch/",
  },
  {
    title: "그랑드 자트 섬의 일요일 오후 (A Sunday on La Grande Jatte, 1884-1886)",
    titleOriginal: "A Sunday on La Grande Jatte",
    creator: "조르주 쇠라 (Georges Seurat, 프랑스)",
    creatorOriginal: "Georges Seurat",
    artworkType: "미술 (점묘화)",
    era: "신인상주의 · 1886년",
    description: "수많은 작은 원색 점들을 캔버스에 꼼꼼히 찍어 빛과 형태를 직조해 낸 신인상주의 점묘화의 정수입니다. 정돈된 평화로움 속에서 찬란하고 우아한 일상의 휴식을 그립니다.",
    whyRecommended: "복잡하고 어지러운 생각들을 작은 조각으로 세심하게 나누어 정리해야 할 때입니다. 질서 있고 고요한 초록빛 정원에서의 휴식을 당신의 마음에 선물하세요.",
    challenges: [
      "주변의 소리나 사물들을 아주 미세한 점들의 집합체로 상상하며 30초간 집중해 보세요.",
      "초록색이나 노란색 색연필로 가벼운 점을 콕콕 찍어가며 작은 나뭇잎 하나를 완성해 보세요."
    ],
    aestheticTone: "생기 넘치는 올리브 그린, 밝은 레몬 옐로우, 은은한 옥색 물빛",
    quote: "어떤 이들은 내 그림에서 시를 본다고 하지만, 나는 오직 과학만을 본다.",
    dailyArtUrl: "https://www.dailyartmagazine.com/sunday-on-la-grande-jatte-georges-seurat/",
  }
];

function getValid30DayHistory<T extends { shownAt: string }>(storageKey: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    if (!Array.isArray(parsed)) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const valid = parsed.filter((entry) => {
      const shownDate = new Date(entry.shownAt);
      return !isNaN(shownDate.getTime()) && shownDate >= thirtyDaysAgo;
    });

    localStorage.setItem(storageKey, JSON.stringify(valid));
    return valid;
  } catch (e) {
    console.error(`Failed to read 30-day history for ${storageKey}:`, e);
    return [];
  }
}

interface ShownArtHistoryEntry {
  catalogId: string;
  title?: string;
  shownAt: string;
}

interface ShownItemHistoryEntry {
  title: string;
  shownAt: string;
}

function getExcludeCatalogIds(): string[] {
  const list = getValid30DayHistory<ShownArtHistoryEntry>("muse_shown_artworks_history");
  return list.map((entry) => entry.catalogId || entry.title || "").filter(Boolean);
}

function getExcludePoemTitles(): string[] {
  const list = getValid30DayHistory<ShownItemHistoryEntry>("muse_shown_poems_history");
  return list.map((entry) => entry.title).filter(Boolean);
}

function getExcludeSongTitles(): string[] {
  const list = getValid30DayHistory<ShownItemHistoryEntry>("muse_shown_songs_history");
  return list.map((entry) => entry.title).filter(Boolean);
}

function recordArtworkHistory(art: ArtRecommendation): void {
  try {
    const todayStr = getTodayDateKey();
    
    // 1. Artwork history (30 days)
    const artKey = "muse_shown_artworks_history";
    const artHistory = getValid30DayHistory<ShownArtHistoryEntry>(artKey);
    const artId = art.catalogId || art.title;
    if (artId && !artHistory.some((entry) => (entry.catalogId === artId || entry.title === art.title) && entry.shownAt === todayStr)) {
      artHistory.push({ catalogId: artId, title: art.title, shownAt: todayStr });
      localStorage.setItem(artKey, JSON.stringify(artHistory));
    }

    // 2. Poem history (30 days)
    if (art.famousPoem?.title) {
      const poemKey = "muse_shown_poems_history";
      const poemHistory = getValid30DayHistory<ShownItemHistoryEntry>(poemKey);
      if (!poemHistory.some((entry) => entry.title === art.famousPoem?.title && entry.shownAt === todayStr)) {
        poemHistory.push({ title: art.famousPoem.title, shownAt: todayStr });
        localStorage.setItem(poemKey, JSON.stringify(poemHistory));
      }
    }

    // 3. Song history (30 days)
    if (art.famousSong?.title) {
      const songKey = "muse_shown_songs_history";
      const songHistory = getValid30DayHistory<ShownItemHistoryEntry>(songKey);
      if (!songHistory.some((entry) => entry.title === art.famousSong?.title && entry.shownAt === todayStr)) {
        songHistory.push({ title: art.famousSong.title, shownAt: todayStr });
        localStorage.setItem(songKey, JSON.stringify(songHistory));
      }
    }
  } catch (e) {
    console.error("Failed to record artwork history:", e);
  }
}

function getDailyPoemSongFallback(randomOffset?: number): { famousPoem: FamousPoem; famousSong: FamousSong } {
  const excludePoems = getExcludePoemTitles();
  const excludeSongs = getExcludeSongTitles();

  const filtered = DAILY_POEM_SONG_FALLBACKS.filter(
    (item) =>
      !excludePoems.some((p) => item.famousPoem.title.toLowerCase().includes(p.toLowerCase())) &&
      !excludeSongs.some((s) => item.famousSong.title.toLowerCase().includes(s.toLowerCase()))
  );

  const pool = filtered.length > 0 ? filtered : DAILY_POEM_SONG_FALLBACKS;
  const seed = getDateSeed('muse_poem_song');
  const index = typeof randomOffset === "number" ? (seed + randomOffset) : seed;
  return pool[index % pool.length];
}

function getDailyArtFallback(randomOffset?: number): ArtRecommendation {
  const excludeArts = getExcludeCatalogIds();
  const filtered = DAILY_ART_FALLBACKS.filter(
    (art) => !excludeArts.some((ex) => art.title.toLowerCase().includes(ex.toLowerCase()))
  );
  const pool = filtered.length > 0 ? filtered : DAILY_ART_FALLBACKS;

  const seed = getDateSeed('muse_artwork');
  const index = typeof randomOffset === "number" ? (seed + randomOffset) : seed;
  const art = pool[index % pool.length];
  const { famousPoem, famousSong } = getDailyPoemSongFallback(randomOffset);
  return {
    ...art,
    sourceName: "DailyArt Magazine",
    famousPoem,
    famousSong,
  };
}

function isLikelyMusicText(title = "", artistOrPoet = "") {
  const t = (title + " " + artistOrPoet).toLowerCase();
  const musicKeywords = [
    "교향곡", "소나타", "협주곡", "행진곡", "서곡", "현악", "사중주", "피아노", "바이올린", "첼로",
    "오케스트라", "녹턴", "칸타타", "오페라", "아리아", "미사곡", "레퀴엠", "볼레로", "달빛", "파반느", "짐노페디",
    "symphony", "sonata", "concerto", "suite", "prelude", "nocturne", "waltz", "opera", "aria",
    "requiem", "bolero", "orchestra", "allegro", "adagio", "op.", "bwv", "kv", "d.",
    "베토벤", "모차르트", "바흐", "쇼팽", "차이콥스키", "브람스", "드뷔시", "라흐마니노프", "슈베르트", "슈만", "엘가", "파헬벨", "생상스", "포레", "사티", "말러",
    "beethoven", "mozart", "bach", "chopin", "tchaikovsky", "brahms", "debussy", "rachmaninoff", "schubert", "schumann", "ravel"
  ];
  return musicKeywords.some((kw) => t.includes(kw));
}

function isLikelyPoemText(title = "", poetOrArtist = "") {
  if (isLikelyMusicText(title, poetOrArtist)) {
    return false;
  }
  const t = (title + " " + poetOrArtist).toLowerCase();
  const poemKeywords = [
    "시인", "시집", "명시", "대표시", "자작시", "서시", "시구절", "시선집", "시편", "운문", "구절",
    "진달래꽃", "풀꽃", "호수", "사평역", "방랑자", "두이노의 비가", "기탄잘리", "젊은 시인",
    "poem", "poetry", "verse", "stanza", "rhyme", "elegy", "sonnet",
    "윤동주", "김소월", "정지용", "김춘수", "도종환", "곽재구", "나태주", "김용택", "오은",
    "릴케", "헤세", "네루다", "디킨슨", "지브란", "괴테", "보들레르", "휘트먼", "타고르", "페소아", "rilke", "hesse", "neruda", "dickinson", "goethe", "baudelaire", "whitman", "tagore", "pessoa"
  ];
  return poemKeywords.some((kw) => t.includes(kw));
}

function sanitizeArtRecommendation(raw: ArtRecommendation, offset?: number): ArtRecommendation {
  const rec = { ...raw };
  const fallbackPair = getDailyPoemSongFallback(offset);

  let currentPoem: FamousPoem = rec.famousPoem?.title ? { ...rec.famousPoem } : fallbackPair.famousPoem;
  let currentSong: FamousSong = rec.famousSong?.title ? { ...rec.famousSong } : fallbackPair.famousSong;

  // 1. Check if famousSong and famousPoem are inverted (Song contains poem info, Poem contains music info)
  const songLooksLikePoem = currentSong && isLikelyPoemText(currentSong.title, currentSong.artist);
  const poemLooksLikeMusic = currentPoem && isLikelyMusicText(currentPoem.title, currentPoem.poet);

  if (songLooksLikePoem && poemLooksLikeMusic) {
    const fixedPoem: FamousPoem = {
      title: currentSong.title,
      titleOriginal: currentSong.titleOriginal,
      poet: currentSong.artist,
      poetOriginal: currentSong.artistOriginal,
      excerpt: currentSong.listeningGuide || "마음에 울리는 아름다운 시구절입니다.",
      whyRecommended: rec.whyRecommended || "시적 울림을 전합니다.",
      siyoilUrl: currentSong.appleMusicClassicalUrl || fallbackPair.famousPoem.siyoilUrl,
      poemSourceName: "세계 명시 컬렉션",
    };
    const fixedSong: FamousSong = {
      title: currentPoem.title,
      titleOriginal: currentPoem.titleOriginal,
      artist: currentPoem.poet,
      artistOriginal: currentPoem.poetOriginal,
      listeningGuide: currentPoem.excerpt || "영혼을 정화하는 멜로디입니다.",
      youtubeVideoId: fallbackPair.famousSong.youtubeVideoId,
      appleMusicClassicalUrl: fallbackPair.famousSong.appleMusicClassicalUrl,
      songSourceName: "Apple Music Classical",
    };
    currentPoem = fixedPoem;
    currentSong = fixedSong;
  } else if (songLooksLikePoem && !isLikelyPoemText(currentPoem.title, currentPoem.poet)) {
    currentPoem = {
      title: currentSong.title,
      titleOriginal: currentSong.titleOriginal,
      poet: currentSong.artist,
      poetOriginal: currentSong.artistOriginal,
      excerpt: currentSong.listeningGuide || "마음에 울리는 시구절입니다.",
      whyRecommended: rec.whyRecommended || "시적 통찰을 전합니다.",
      siyoilUrl: fallbackPair.famousPoem.siyoilUrl,
      poemSourceName: "세계 명시 컬렉션",
    };
    currentSong = fallbackPair.famousSong;
  } else if (poemLooksLikeMusic) {
    // Under NO circumstance should music remain in currentPoem!
    if (!isLikelyMusicText(currentSong.title, currentSong.artist)) {
      currentSong = {
        title: currentPoem.title,
        titleOriginal: currentPoem.titleOriginal,
        artist: currentPoem.poet,
        artistOriginal: currentPoem.poetOriginal,
        listeningGuide: currentPoem.excerpt || "영혼을 어루만지는 선율입니다.",
        youtubeVideoId: fallbackPair.famousSong.youtubeVideoId,
        appleMusicClassicalUrl: fallbackPair.famousSong.appleMusicClassicalUrl,
        songSourceName: "Apple Music Classical",
      };
    }
    currentPoem = fallbackPair.famousPoem;
  }

  // Safety guarantee: currentPoem must NEVER be music
  if (isLikelyMusicText(currentPoem.title, currentPoem.poet)) {
    currentPoem = fallbackPair.famousPoem;
  }

  // 2. Guarantee that Artwork Title is pure visual masterpiece (Not music or poetry)
  const mainIsMusic = isLikelyMusicText(rec.title, rec.creator);
  const mainIsPoem = isLikelyPoemText(rec.title, rec.creator);

  if (mainIsMusic || mainIsPoem) {
    const visualFallback = getDailyArtFallback(offset);
    rec.title = visualFallback.title;
    rec.titleOriginal = visualFallback.titleOriginal;
    rec.creator = visualFallback.creator;
    rec.creatorOriginal = visualFallback.creatorOriginal;
    rec.artworkType = visualFallback.artworkType || "미술 (유화)";
    rec.era = visualFallback.era || "인상주의";
    rec.description = visualFallback.description;
    rec.aestheticTone = visualFallback.aestheticTone;
    rec.quote = visualFallback.quote;
    rec.dailyArtUrl = visualFallback.dailyArtUrl;
  }

  rec.famousPoem = currentPoem;
  rec.famousSong = currentSong;
  return rec;
}

function isAiRecreatedArtworkSource(source: ArtworkImageSource | null): boolean {
  return source === "ai_replica" || source === "pollinations";
}

function getArtworkImageBadgeLabel(source: ArtworkImageSource | null): string | null {
  if (!source) return null;
  if (source === "dailyart") return "🏛️ DailyArt 원작";
  if (source === "google") return "🏛️ 고화질 원작";
  if (source === "wikimedia" || source === "wikipedia" || source === "artic" || source === "met") return "🏛️ 미술관 원작 소장본";
  return "✨ AI 미학 재현본";
}

const ART_CACHE_KEYS = {
  themeId: "muse_today_art_theme_id",
  themeLabel: "muse_today_art_theme_label",
  userConcern: "muse_today_art_user_concern",
  date: "muse_today_art_date",
  recommendation: "muse_today_art_recommendation_v18",
  image: "muse_today_art_image_v18",
  imageSource: "muse_today_art_image_source_v18",
  mood: "muse_today_art_mood_label",
  offset: "muse_today_art_offset",
} as const;


export interface MuseInspirationTheme {
  id: string;
  moodId: "quiet" | "passion" | "refresh" | "planning" | "resurrection";
  label: string;
  subtitle: string;
  icon: string;
  badge: string;
  promptMood: string;
}

export const MUSE_INSPIRATION_THEMES: MuseInspirationTheme[] = [
  {
    id: "creative_spark",
    moodId: "planning",
    label: "창작의 막힘 & 슬럼프 극복",
    subtitle: "아이디어 고갈과 표현의 벽을 깨는 대담한 영감",
    icon: "🎨",
    badge: "Creative Flow",
    promptMood: "창작의 벽과 아이디어 고갈을 뚫고 솟구치는 독창적 영감과 발상 전환이 필요한 상태",
  },
  {
    id: "mindful_rest",
    moodId: "quiet",
    label: "지친 일상 & 번아웃 치유",
    subtitle: "복잡한 머리와 지친 마음에 깊은 쉼과 고요",
    icon: "🌿",
    badge: "Mindful Rest",
    promptMood: "복잡한 생각과 일상의 번아웃을 씻어내고 깊은 휴식과 마인드풀니스 안식이 필요한 상태",
  },
  {
    id: "passion_courage",
    moodId: "passion",
    label: "새로운 도전 & 자신감 각성",
    subtitle: "두려움을 넘어서는 용기와 강력한 자기 확신",
    icon: "🔥",
    badge: "Inner Flame",
    promptMood: "망설임과 두려움을 깨고 새로운 시작과 도전을 향해 뜨거운 열정과 확신을 일깨우는 상태",
  },
  {
    id: "refresh_clarity",
    moodId: "refresh",
    label: "머리 정돈 & 맑은 기분 환기",
    subtitle: "답답함을 털어내고 경쾌하게 마음을 정비",
    icon: "🍃",
    badge: "Sensory Reset",
    promptMood: "답답하고 묵직한 기분을 털어내고 산뜻하고 맑은 감각으로 기분을 환기하고 싶은 상태",
  },
  {
    id: "resurrection_comfort",
    moodId: "resurrection",
    label: "시련 극복 & 상처·외로움 위로",
    subtitle: "슬픔을 딛고 영혼의 힘을 회복하는 부활의 빛",
    icon: "🎻",
    badge: "Soul Comfort",
    promptMood: "상처나 상실감, 서러운 외로움을 딛고 영혼의 깊은 힘과 위로를 얻어 다시 일어서는 상태",
  },
];

export const CONCERN_SUGGESTIONS = [
  "🎨 창작 마감이 다가오는데 아이디어가 안 떠올라요",
  "🌿 사람들과 일에 지쳐 혼자만의 고요한 쉼이 필요해요",
  "🔥 새로운 도전을 앞두고 두려움과 망설임이 커요",
  "🍃 머리가 너무 복잡해서 산뜻하게 환기하고 싶어요",
  "🎻 상처받은 마음과 아픈 기억을 위로받고 싶어요",
  "✨ 나만의 독창적인 감각과 영감을 깨우고 싶어요",
];

const ART_MOODS = [
  { id: "quiet", label: "고요·명상", description: "평온함 and 마인드풀니스 치유", icon: "🌊", promptMood: "고요하고 명상적인 안식이 필요한 상태" },
  { id: "passion", label: "열정·자극", description: "강렬하고 대담한 카타르시스", icon: "🔥", promptMood: "막힌 것을 뚫을 수 있는 강렬하고 역동적인 자극이 필요한 상태" },
  { id: "refresh", label: "정돈·환기", description: "리프레시와 감각적 정비", icon: "🍃", promptMood: "복잡한 머리를 식히고 가볍고 경쾌하게 기분을 환기하고 싶은 상태" },
  { id: "planning", label: "영감·구상", description: "지적인 탐색과 신선한 아이디어", icon: "💭", promptMood: "새로운 지평과 독특한 아이디어를 지적/개념적으로 자극받고 싶은 상태" },
  { id: "resurrection", label: "비장·부활", description: "슬픔과 시련을 뛰어넘는 극복", icon: "🎻", promptMood: "고난이나 시련을 딛고 영혼의 힘을 뜨겁게 일깨울 예술" },
];

function enrichRecommendation(rec: ArtRecommendation, randomOffset?: number): ArtRecommendation {
  const fallback = getDailyPoemSongFallback(randomOffset);
  const dailyArtUrl =
    rec.dailyArtUrl?.trim()
    || lookupCatalogDailyArtUrl(rec.catalogId, rec.title, rec.titleOriginal);
  return {
    ...rec,
    dailyArtUrl,
    famousPoem: rec.famousPoem?.title ? rec.famousPoem : fallback.famousPoem,
    famousSong: rec.famousSong?.title ? rec.famousSong : fallback.famousSong,
  };
}

function parseCachedRecommendation(): ArtRecommendation | null {
  const cached = localStorage.getItem(ART_CACHE_KEYS.recommendation);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached) as ArtRecommendation;
    if (!parsed?.title) return null;
    const sanitized = sanitizeArtRecommendation(parsed);
    return enrichRecommendation(sanitized);
  } catch {
    return null;
  }
}

function getDailyMood(randomOffset?: number) {
  if (typeof randomOffset === "number") {
    const idx = (getDateSeed("muse_daily_art_mood") + randomOffset) % ART_MOODS.length;
    return ART_MOODS[idx];
  }
  return pickDailySeededItem(ART_MOODS, "muse_daily_art_mood");
}

function clearArtRecommendationCache(): void {
  Object.values(ART_CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
}

function isArtCacheFresh(): boolean {
  return isSameDayString(localStorage.getItem(ART_CACHE_KEYS.date));
}

function touchArtCacheDate(): void {
  localStorage.setItem(ART_CACHE_KEYS.date, getTodayDateKey());
}

export function ArtRecommendationView() {
  const { sharedState, updateSharedState, openLucyChat, sendUnifiedMessage } = useApp();
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [recommendation, setRecommendation] = useState<ArtRecommendation | null>(null);
  const [nanobananaImage, setNanobananaImage] = useState<string | null>(null);
  const [artworkImageSource, setArtworkImageSource] = useState<ArtworkImageSource | null>(null);
  const [isArtImageOpen, setIsArtImageOpen] = useState(false);
  const [currentMoodLabel, setCurrentMoodLabel] = useState("창작의 막힘 & 슬럼프 극복");
  const [loadingStep, setLoadingStep] = useState(0);

  // Prism Toss ecosystem state & guard ref
  const [activeToss, setActiveToss] = useState<PrismTossPayload | null>(() => getPendingPrismToss("muse"));
  const activeTossRef = useRef<PrismTossPayload | null>(activeToss);
  const isProcessingTossRef = useRef<boolean>(false);
  const lastProcessedTossKeyRef = useRef<string | null>(null);
  const isGeneratingImageRef = useRef<boolean>(false);

  useEffect(() => {
    activeTossRef.current = activeToss;
  }, [activeToss]);
  
  // Custom theme & concern state
  const [selectedThemeId, setSelectedThemeId] = useState<string>("creative_spark");
  const [customConcern, setCustomConcern] = useState<string>("");
  const [savedThemeLabel, setSavedThemeLabel] = useState<string>("");
  const [savedCustomConcern, setSavedCustomConcern] = useState<string>("");
  const [isSelectingNewTheme, setIsSelectingNewTheme] = useState<boolean>(false);

  // Interactive challenges checklist
  const [completedChallenges, setCompletedChallenges] = useState<Record<number, boolean>>({});
  
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [geminiCopied, setGeminiCopied] = useState(false);
  const hydrateStartedRef = useRef(false);

  const restoreDailyArtFromCache = useCallback((): boolean => {
    if (!isArtCacheFresh()) return false;

    const cachedRec = parseCachedRecommendation();
    if (!cachedRec) return false;

    setRecommendation(cachedRec);
    setCompletedChallenges({});

    const cachedMoodLabel = localStorage.getItem(ART_CACHE_KEYS.mood);
    setCurrentMoodLabel(cachedMoodLabel || getDailyMood().label);

    const cachedImg = localStorage.getItem(ART_CACHE_KEYS.image);
    const cachedSource = localStorage.getItem(ART_CACHE_KEYS.imageSource) as ArtworkImageSource | null;
    if (cachedImg && cachedImg !== "null" && cachedImg !== "undefined") {
      setNanobananaImage(cachedImg);
      if (cachedSource) setArtworkImageSource(cachedSource);
      setLoadingImage(false);
    }

    return true;
  }, []);

  const imageRetryCountRef = useRef(0);

  // Safety timer to prevent infinite image loading state
  useEffect(() => {
    if (!loadingImage) return;
    const timer = setTimeout(() => {
      setLoadingImage(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loadingImage]);

  const generateNanobananaImage = useCallback(async (
    art: ArtRecommendation,
    options?: { forcePollinations?: boolean },
  ) => {
    if (isGeneratingImageRef.current) return;
    isGeneratingImageRef.current = true;
    setLoadingImage(true);
    try {
      const { displayUrl, source } = await resolveArtworkImage(
        {
          title: art.title,
          titleOriginal: art.titleOriginal,
          creator: art.creator,
          creatorOriginal: art.creatorOriginal,
          artworkType: art.artworkType,
          era: art.era,
          description: art.description,
          aestheticTone: art.aestheticTone,
          dailyArtImageUrl: art.imageUrl,
        },
        options,
      );

      setNanobananaImage(displayUrl);
      setArtworkImageSource(source);
      localStorage.setItem(ART_CACHE_KEYS.image, displayUrl);
      localStorage.setItem(ART_CACHE_KEYS.imageSource, source);

      const today = getTodayDateKey();
      const currentArt = sharedState?.dailyArts?.[today];
      if (currentArt) {
        void updateSharedState({
          dailyArts: {
            ...(sharedState?.dailyArts || {}),
            [today]: {
              ...currentArt,
              image: displayUrl,
              imageSource: source,
            },
          },
          lastMuseDailySync: Date.now(),
        }, 'MUSE');
      }
    } catch (e) {
      console.error("Failed to resolve artwork image:", e);
      const fallbackUrl = buildPollinationsArtUrl(art);
      setNanobananaImage(fallbackUrl);
      setArtworkImageSource("pollinations");
      localStorage.setItem(ART_CACHE_KEYS.image, fallbackUrl);
      localStorage.setItem(ART_CACHE_KEYS.imageSource, "pollinations");
    } finally {
      setLoadingImage(false);
      isGeneratingImageRef.current = false;
    }
  }, [sharedState?.dailyArts, updateSharedState]);

  const handleRecommendArt = useCallback(async (options?: { forceRefresh?: boolean; randomOffset?: number; userConcern?: string }) => {
    const concernText = (options?.userConcern ?? customConcern).trim();

    if (!options?.forceRefresh && restoreDailyArtFromCache()) {
      const cachedRec = parseCachedRecommendation();
      if (cachedRec && !localStorage.getItem(ART_CACHE_KEYS.image)) {
        void generateNanobananaImage(cachedRec);
      }
      return;
    }

    setLoading(true);
    setNanobananaImage(null);
    setCompletedChallenges({});

    let offset = options?.randomOffset;
    if (typeof offset !== "number") {
      const savedOffset = localStorage.getItem(ART_CACHE_KEYS.offset);
      offset = savedOffset ? parseInt(savedOffset, 10) : undefined;
    }

    const dailyMood = getDailyMood(offset);
    setCurrentMoodLabel(dailyMood.label);
    localStorage.setItem(ART_CACHE_KEYS.mood, dailyMood.label);
    if (concernText) {
      setSavedCustomConcern(concernText);
      localStorage.setItem(ART_CACHE_KEYS.userConcern, concernText);
    }

    let userContext = "";
    
    // Get live user metadata context from database
    if (auth.currentUser) {
      try {
        const q = query(
          collection(db, "muse_history", auth.currentUser.uid, "entries"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
         const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userContext = querySnapshot.docs
            .map((doc) => doc.data().content || "")
            .join("\n")
            .slice(0, 1000); // truncate for safety
        }
      } catch (err) {
        console.warn("Failed to get latest user context entries for recommender:", err);
      }
    }

    try {
      const excludeCatalogIds = getExcludeCatalogIds();
      const excludePoemTitles = getExcludePoemTitles();
      const excludeSongTitles = getExcludeSongTitles();
      const response = await fetch("/api/ai/recommend-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMood: dailyMood.promptMood,
          moodId: dailyMood.id,
          userContext,
          userConcern: concernText,
          energyFrequency: "528Hz",
          dateKey: getTodayDateKey(),
          randomOffset: offset,
          excludeCatalogIds,
          excludePoemTitles,
          excludeSongTitles,
        })
      });

      if (!response.ok) throw new Error("예술 추천 요청 실패");
      const data = await response.json() as ArtRecommendation;
      const enriched = sanitizeArtRecommendation(data, offset);
      
      setRecommendation(enriched);
      touchArtCacheDate();
      localStorage.setItem(ART_CACHE_KEYS.recommendation, JSON.stringify(enriched));
      recordArtworkHistory(enriched);

      // Realtime cross-device synchronization to Firestore & server vault
      try {
        const today = getTodayDateKey();
        void updateSharedState({
          dailyArts: {
            ...(sharedState?.dailyArts || {}),
            [today]: {
              recommendation: enriched,
              moodLabel: dailyMood.label,
              userConcern: concernText,
              timestamp: Date.now(),
            },
          },
          lastMuseDailySync: Date.now(),
        }, 'MUSE');
      } catch (_) {}
      
      // Auto-trigger picture drawing inspired by this masterpiece
      await generateNanobananaImage(enriched);
    } catch (e) {
      console.error(e);
      // Fallback
      const genericFallback = getDailyArtFallback(offset);
      setRecommendation(genericFallback);
      touchArtCacheDate();
      localStorage.setItem(ART_CACHE_KEYS.recommendation, JSON.stringify(genericFallback));
      recordArtworkHistory(genericFallback);

      try {
        const today = getTodayDateKey();
        void updateSharedState({
          dailyArts: {
            ...(sharedState?.dailyArts || {}),
            [today]: {
              recommendation: genericFallback,
              moodLabel: dailyMood.label,
              userConcern: concernText,
              timestamp: Date.now(),
            },
          },
          lastMuseDailySync: Date.now(),
        }, 'MUSE');
      } catch (_) {}

      await generateNanobananaImage(genericFallback);
    } finally {
      setLoading(false);
    }
  }, [customConcern, generateNanobananaImage, restoreDailyArtFromCache, sharedState?.dailyArts, updateSharedState]);

  // Prism Toss processing handler: binds Oracle Tarot's 3-card sequence & anchor masterpiece
  const handleTossedArtRecommendation = useCallback(async (toss: PrismTossPayload) => {
    const tossKey = `${toss.tossedAt || Date.now()}_${toss.sourceApp || ''}_${toss.actionType || ''}_${(toss.contextMessage || '').slice(0, 30)}`;
    if (isProcessingTossRef.current || (lastProcessedTossKeyRef.current && lastProcessedTossKeyRef.current === tossKey)) {
      return;
    }
    isProcessingTossRef.current = true;
    lastProcessedTossKeyRef.current = tossKey;
    clearPrismToss(); // 🎯 대기 중인 토스를 즉시 소비하여 무한 재호출 루프 원천 차단!

    activeTossRef.current = toss;
    setActiveToss(toss);
    setLoading(true);
    setNanobananaImage(null);
    setCompletedChallenges({});

    // 1. Backup current daily art recommendation if not already backed up
    try {
      if (!localStorage.getItem("prism_toss_daily_backup")) {
        const cachedRec = parseCachedRecommendation();
        if (cachedRec) {
          const backupData = {
            recommendation: cachedRec,
            image: localStorage.getItem(ART_CACHE_KEYS.image),
            imageSource: (localStorage.getItem(ART_CACHE_KEYS.imageSource) as ArtworkImageSource | null),
            moodLabel: localStorage.getItem(ART_CACHE_KEYS.mood) || "창작의 막힘 & 슬럼프 극복",
            concern: localStorage.getItem(ART_CACHE_KEYS.userConcern) || "",
          };
          localStorage.setItem("prism_toss_daily_backup", JSON.stringify(backupData));
        }
      }
    } catch (e) {
      console.warn("Failed to backup daily art before toss:", e);
    }

    try {
      const cards = toss.cards || [];
      const cardNames = cards.map(c => c.nameKo || c.cardName || c.name).filter(Boolean).join(", ");
      const anchorTitle = toss.anchorArtworkTitle || "별이 빛나는 밤 (The Starry Night)";

      // Find best matching masterpiece from catalog, or synthesize from anchor title
      let matchedArt = DAILY_ART_FALLBACKS.find(art => 
        anchorTitle.toLowerCase().includes(art.title.slice(0, 4).toLowerCase()) ||
        art.title.toLowerCase().includes(anchorTitle.slice(0, 4).toLowerCase())
      );

      if (!matchedArt) {
        matchedArt = {
          title: anchorTitle,
          titleOriginal: anchorTitle,
          creator: "세계의 거장 (오라클 선정 명작)",
          creatorOriginal: "Master of World Art",
          artworkType: "미술 (처방 회화)",
          era: "인류 명작 컬렉션",
          description: toss.contextMessage || "오라클 타로의 3대 영혼 처방에 공명하여 영혼의 치유와 재창조를 위해 소환된 명작입니다.",
          whyRecommended: `오라클 타로에서 도출된 [${cardNames}] 3장의 카드 시퀀스와 완전한 주파수로 공명하는 예술 처방입니다.`,
          challenges: cards.map((c, i) => {
            const name = c.nameKo || c.cardName || c.name;
            const kw = c.keyword || c.keywords?.[0];
            return `${i + 1}. [${name}]: ${kw ? `"${kw}"의 에너지를 품고 ` : ''}내면을 관조하며 깊은 호흡을 3회 들이쉬고 내쉬어 보세요.`;
          }),
          aestheticTone: "신비롭고 몽환적인 코스믹 바이올렛과 앰버 골드의 치유 파동",
          quote: toss.anchorArtQuote || "예술은 영혼에 묻은 일상의 먼지를 털어내어 본래의 광채를 되찾게 한다.",
        };
      }

      // Select matching world poem & song pair (weighted by first card's index)
      const seedIndex = cards.length > 0 && cards[0].cardIndex !== undefined 
        ? Math.abs(cards[0].cardIndex) % DAILY_POEM_SONG_FALLBACKS.length 
        : 8; // default to Rilke / Fauré
      const pair = DAILY_POEM_SONG_FALLBACKS[seedIndex] || DAILY_POEM_SONG_FALLBACKS[8];

      const enrichedArt: ArtRecommendation = {
        ...matchedArt,
        challenges: cards.length > 0 
          ? cards.map((c, i) => {
              const name = c.nameKo || c.cardName || c.name;
              const kw = c.keyword || c.keywords?.[0];
              return `카드 #${i + 1} [${name}]: ${kw ? `'${kw}'의 에너지로 ` : ''}자신의 감정을 편견 없이 바라보기`;
            })
          : matchedArt.challenges,
        whyRecommended: `[오라클 3장 토스] ${cardNames}의 서사적 조합에 따라 조율되었습니다. ${toss.contextMessage || matchedArt.whyRecommended}`,
        famousPoem: pair.famousPoem,
        famousSong: pair.famousSong,
      };

      // Sanitize to guarantee 100% boundary between Visual Painting, Poem, and Song
      const sanitizedArt = sanitizeArtRecommendation(enrichedArt, seedIndex);

      setRecommendation(sanitizedArt);
      setCurrentMoodLabel(`오라클 토스: ${cardNames || "영혼의 처방"}`);
      if (toss.contextMessage) {
        setSavedCustomConcern(toss.contextMessage);
      }

      // Trigger artwork visualization
      await generateNanobananaImage(sanitizedArt);
    } catch (err) {
      console.error("Failed to process tossed art recommendation:", err);
    } finally {
      setLoading(false);
      isProcessingTossRef.current = false;
    }
  }, [generateNanobananaImage]);

  // Exit Toss Mode and restore original Daily Art recommendation
  const handleExitTossMode = useCallback(() => {
    setActiveToss(null);
    activeTossRef.current = null;
    isProcessingTossRef.current = false;
    lastProcessedTossKeyRef.current = null;
    clearPrismToss();

    try {
      const backupRaw = localStorage.getItem("prism_toss_daily_backup");
      if (backupRaw) {
        const backup = JSON.parse(backupRaw);
        if (backup.recommendation) {
          setRecommendation(backup.recommendation);
          setNanobananaImage(backup.image || null);
          setArtworkImageSource(backup.imageSource || null);
          setCurrentMoodLabel(backup.moodLabel || "창작의 막힘 & 슬럼프 극복");
          setSavedCustomConcern(backup.concern || "");
          localStorage.removeItem("prism_toss_daily_backup");
          return;
        }
      }
    } catch (_) {}
    localStorage.removeItem("prism_toss_daily_backup");

    if (!restoreDailyArtFromCache()) {
      void handleRecommendArt();
    }
  }, [handleRecommendArt, restoreDailyArtFromCache]);

  // Cross-device synchronization from cloud sharedState
  useEffect(() => {
    // 🌟 Guard: Do NOT overwrite with daily art when in Toss Mode!
    if (activeTossRef.current) return;

    const today = getTodayDateKey();
    const cloudArt = sharedState?.dailyArts?.[today];
    if (cloudArt && typeof cloudArt === "object" && (cloudArt.recommendation || cloudArt.title)) {
      const rec = cloudArt.recommendation || cloudArt;
      localStorage.setItem(ART_CACHE_KEYS.recommendation, JSON.stringify(rec));
      localStorage.setItem(ART_CACHE_KEYS.date, today);

      const img = cloudArt.image || cloudArt.nanobananaImage || cloudArt.imageUrl || rec.imageUrl;
      if (img) {
        localStorage.setItem(ART_CACHE_KEYS.image, img);
      }
      const source = cloudArt.imageSource || cloudArt.artworkImageSource || "dailyart";
      localStorage.setItem(ART_CACHE_KEYS.imageSource, source);

      const mood = cloudArt.moodLabel || cloudArt.currentMoodLabel;
      if (mood) {
        localStorage.setItem(ART_CACHE_KEYS.mood, mood);
      }
      if (cloudArt.userConcern) {
        localStorage.setItem(ART_CACHE_KEYS.userConcern, cloudArt.userConcern);
      }
      if (cloudArt.completedChallenges) {
        setCompletedChallenges(cloudArt.completedChallenges);
      }
    }
  }, [sharedState?.dailyArts]);

  useEffect(() => {
    const handleSync = () => {
      // 🌟 Guard: Do NOT overwrite with daily art when in Toss Mode!
      if (activeTossRef.current) return;

      const today = getTodayDateKey();
      const cloudArt = sharedState?.dailyArts?.[today];
      if (cloudArt && typeof cloudArt === "object" && (cloudArt.recommendation || cloudArt.title)) {
        const rec = cloudArt.recommendation || cloudArt;
        setRecommendation(rec);
        const img = cloudArt.image || cloudArt.nanobananaImage || cloudArt.imageUrl || rec.imageUrl;
        if (img) setNanobananaImage(img);
        const source = cloudArt.imageSource || cloudArt.artworkImageSource || "dailyart";
        setArtworkImageSource(source);
        return;
      }
      if (restoreDailyArtFromCache()) {
        const cachedRec = parseCachedRecommendation();
        if (cachedRec) setRecommendation(cachedRec);
      }
    };
    window.addEventListener("prism:daily_oracle_updated", handleSync);
    window.addEventListener("prism:feature_updated", handleSync);
    window.addEventListener("prism:daily_art_updated", handleSync);
    return () => {
      window.removeEventListener("prism:daily_oracle_updated", handleSync);
      window.removeEventListener("prism:feature_updated", handleSync);
      window.removeEventListener("prism:daily_art_updated", handleSync);
    };
  }, [restoreDailyArtFromCache, sharedState?.dailyArts]);

  // Cycling reassuring logs during API generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    "퀀텀 시냅스를 정렬하여 당신의 최근 내면 흐름을 수집하고 있습니다...",
    "동조 주파수 파동(Hz)과 마인드풀 에너지의 완벽한 조화를 스캔하는 중...",
    "DailyArt Magazine의 Masterpiece Stories에서 검증된 명작을 큐레이션합니다...",
    "예술이 전하는 영감과 실천적 미션을 마법처럼 조율하는 마지막 단계..."
  ];

  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey());

  useEffect(() => {
    const checkDateRollover = () => {
      const nowKey = getTodayDateKey();
      if (nowKey !== currentDateKey) {
        console.log('[ArtRecommendationView] Midnight transition detected. Resetting to new day:', nowKey);
        setCurrentDateKey(nowKey);
        setRecommendation(null);
        setNanobananaImage(null);
        setArtworkImageSource(null);
        setCustomConcern("");
        clearArtRecommendationCache();
      }
    };

    const interval = setInterval(checkDateRollover, 10000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkDateRollover);
    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkDateRollover);
    };
  }, [currentDateKey]);

  useEffect(() => {
    const onTossReceived = (e: Event) => {
      const customEvent = e as CustomEvent<PrismTossPayload>;
      if (customEvent.detail && customEvent.detail.targetApp === "muse") {
        clearPrismToss();
        void handleTossedArtRecommendation(customEvent.detail);
      }
    };
    window.addEventListener("prism:toss_received", onTossReceived);
    return () => {
      window.removeEventListener("prism:toss_received", onTossReceived);
    };
  }, [handleTossedArtRecommendation]);

  useEffect(() => {
    // 0. Check pending Prism Toss first (Oracle -> Muse toss pipeline & Big Bang Warp)
    const pendingToss = getPendingPrismToss("muse");
    if (pendingToss && (pendingToss.actionType === "art_prescription" || pendingToss.autoTrigger)) {
      clearPrismToss();
      void handleTossedArtRecommendation(pendingToss);
      return;
    }

    if (activeTossRef.current) return;
    if (hydrateStartedRef.current) return;
    hydrateStartedRef.current = true;
    // Do NOT auto-run or display result in advance without user request
  }, [handleTossedArtRecommendation]);

  const toggleChallenge = (index: number) => {
    setCompletedChallenges((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopyQuote = () => {
    if (!recommendation) return;
    navigator.clipboard.writeText(`"${recommendation.quote}" - ${recommendation.creator}`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const artworkArticleUrl = recommendation
    ? resolveArtworkDailyArtUrl(
        recommendation.dailyArtUrl,
        recommendation.catalogId,
        recommendation.title,
        recommendation.titleOriginal,
      )
    : "";

  const artworkImageFilename = useMemo(
    () => `muse-daily-art-${recommendation?.title ?? "artwork"}-${getTodayDateKey()}`,
    [recommendation?.title],
  );

  const effectiveImage = useMemo(() => {
    if (nanobananaImage && nanobananaImage !== "null" && nanobananaImage !== "undefined") {
      return nanobananaImage;
    }
    if (recommendation?.imageUrl) {
      return recommendation.imageUrl;
    }
    if (recommendation) {
      return buildPollinationsArtUrl(recommendation);
    }
    return null;
  }, [nanobananaImage, recommendation]);

  // Ensure image generation starts immediately whenever recommendation is ready
  useEffect(() => {
    if (recommendation && !nanobananaImage) {
      void generateNanobananaImage(recommendation);
    }
  }, [recommendation, nanobananaImage, generateNanobananaImage]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 px-4 py-6 md:py-12 text-white">
      {/* Intro Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-bold uppercase tracking-widest shadow-lg animate-pulse">
          <Palette size={14} className="text-blue-400" />
          MUSE SPECIAL FEATURE
        </div>
        <h2 className="text-3xl md:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
          오늘의 <span className="text-blue-400">예술 추천</span>
        </h2>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed font-sans">
          당신의 마음에 잠재된 영적 에너지를 깨우기 위해 뮤즈가 큐레이션하는 고전을 만나보세요. 
          오늘의 명곡·명시·명화가 매일 자동으로 추천됩니다.
        </p>
        <p className="text-[10px] text-white/30 font-mono tracking-wider">
          매일 자정 이후 새로운 명작이 자동으로 큐레이션됩니다 · {getTodayDateKey()}
        </p>
        
      </div>

      {/* Prism Toss Pipeline Active Banner */}
      {activeToss && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-br from-purple-950/50 via-zinc-900/90 to-amber-950/40 border border-purple-500/40 shadow-2xl backdrop-blur-xl space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 text-lg">🔮</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 font-mono block">
                  PRISM TOSS PIPELINE · 오라클 연계 처방
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  오라클 타로에서 토스된 3대 영혼 처방 연계
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExitTossMode}
              className="self-start sm:self-auto text-xs text-purple-200 hover:text-white px-4 py-2 rounded-2xl border border-purple-400/40 hover:border-purple-300 bg-purple-900/40 hover:bg-purple-800/60 transition-all cursor-pointer flex items-center gap-2 shadow-lg font-bold active:scale-95"
            >
              <RefreshCw size={13} className="text-purple-300" />
              <span>일반 데일리 추천 모드로 전환 (원래대로 복원)</span>
              <span className="text-xs">✕</span>
            </button>
          </div>

          {/* 3 Cards Sequence Badge Row */}
          {activeToss.cards && activeToss.cards.length > 0 && (
            <div className="space-y-2 relative z-10">
              <span className="text-[11px] font-mono text-purple-300/80 font-bold uppercase flex items-center gap-1.5">
                <span>⚡ 연계된 3장의 타로 카드 시퀀스</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeToss.cards.map((card, idx) => {
                  const cardTitle = card.nameKo || card.cardName || card.name || `카드 ${idx + 1}`;
                  const cardKw = card.keyword || card.keywords?.[0];
                  return (
                    <div
                      key={card.id || card.cardIndex || idx}
                      className="p-3 rounded-2xl bg-white/[0.04] border border-purple-400/20 flex flex-col gap-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">CARD #{idx + 1}</span>
                        {cardKw && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-medium">
                            {cardKw}
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-white">{cardTitle}</span>
                      {card.description && (
                        <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                          {card.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeToss.anchorArtworkTitle && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-sans flex items-start gap-2 relative z-10">
              <span className="text-sm">🎨</span>
              <div>
                <span className="font-bold text-amber-300">오라클 앵커 명작:</span> "{activeToss.anchorArtworkTitle}"
                <p className="text-[11px] text-white/60 mt-0.5">
                  카드 3장의 서사와 상징에 동조하는 세계의 명곡·명시·명화 3위 일체 도슨트가 조율되었습니다.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Pre-Listening Concern & Mood Input Panel */}
      {!recommendation && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/10 p-6 sm:p-10 rounded-[32px] space-y-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300 font-mono">
              <Sparkles size={13} className="text-blue-400" />
              MUSE PRE-LISTENING · 마음 경청
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              오늘 당신의 마음에 머무는 <span className="text-blue-400">이야기</span>를 들려주세요
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
              오늘 겪고 있는 고민, 풀리지 않는 감정, 혹은 회복하고 싶은 마음에 대해 편안하게 적어주시면,
              그에 딱 맞춘 세계 거장의 명화와 마음을 울리는 명시·명곡을 큐레이션해 드립니다.
            </p>
          </div>

          {/* Quick Concern Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
              <span>💡 빠른 고민 선택</span>
              <span className="text-[10px] text-white/40 font-normal">(클릭하면 아래 입력창에 적용됩니다)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CONCERN_SUGGESTIONS.map((suggestion) => {
                const clean = suggestion.replace(/^[^\s]+\s/, '');
                const isSelected = customConcern === clean;
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setCustomConcern(clean)}
                    className={`text-xs px-3.5 py-2 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-blue-500/20 border-blue-400 text-blue-200 font-bold shadow-lg scale-[1.02]"
                        : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area for Custom Concern */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/80 flex items-center justify-between">
              <span>✍️ 나의 고민 & 현재 상황 직접 적기</span>
              <span className="text-[10px] text-white/40">생략 시 오늘의 내면 주파수로 자동 분석</span>
            </label>
            <textarea
              rows={3}
              value={customConcern}
              onChange={(e) => setCustomConcern(e.target.value)}
              placeholder="예: 요즘 회사 업무와 사람 관계에 지쳐서 마음의 고요와 쉼이 절실해요... / 새로운 프로젝트를 시작하려는데 아이디어가 막히고 불안해요..."
              className="w-full p-4 rounded-2xl border border-white/10 bg-black/40 text-white placeholder:text-white/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed resize-none shadow-inner"
            />
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => void handleRecommendArt({ forceRefresh: true, userConcern: customConcern.trim() })}
              disabled={loading}
              className="prism-rainbow-btn relative py-4 px-10 rounded-2xl text-xs md:text-sm font-black uppercase tracking-[0.15em] transform active:scale-95 text-white shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer min-w-[280px]"
            >
              <Sparkles size={16} className={loading ? "animate-spin" : "animate-pulse"} />
              <span>{customConcern.trim() ? "🎨 나의 고민에 맞춤 예술 추천받기" : "🎨 오늘의 맞춤 예술 추천받기"}</span>
            </button>
            {isArtCacheFresh() && (
              <button
                type="button"
                onClick={() => restoreDailyArtFromCache()}
                className="py-3.5 px-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Palette size={14} className="text-blue-400" />
                <span>오늘 저장된 추천 결과 보기</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading Canvas */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-12 rounded-[32px] bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl backdrop-blur-3xl min-h-[400px]"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-500/40 animate-spin absolute inset-0" />
              <div className="w-16 h-16 rounded-full border-2 border-t-blue-400 border-r-transparent animate-spin relative" />
              <Palette size={20} className="absolute inset-x-0 mx-auto text-blue-400 top-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 font-mono animate-pulse">
                [ ATTACHING ARTISTIC RESONANCE ]
              </h4>
              <p className="text-sm text-white/70 leading-relaxed font-sans font-medium h-12 transition-all">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}

        {/* Art Result Panel */}
        {!loading && recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Shared User Concern Banner */}
            {savedCustomConcern && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5 shadow-sm">
                <span className="text-base">🕊️</span>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 font-mono">나누어 주신 오늘의 마음 & 고민</span>
                  <p className="font-medium text-white/90">"{savedCustomConcern}"</p>
                </div>
              </div>
            )}

            {/* 1. 오늘의 명곡 (Masterpiece Song) */}
            {recommendation.famousSong && (
              <div className="p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-rose-950/30 via-zinc-900 to-black border border-rose-500/20 space-y-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                      <Music size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 block font-mono">
                        MUSE SONG · 1. 오늘의 명곡
                      </span>
                      <h4 className="text-xl md:text-2xl font-bold text-white leading-snug font-sans">
                        {recommendation.famousSong.title}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-rose-300/80 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                    AUDIO HARMONY
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm md:text-base text-rose-300 font-semibold flex items-center gap-1.5">
                    <Feather size={14} />
                    {recommendation.famousSong.artist}
                  </p>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed font-sans pt-1">
                    {recommendation.famousSong.listeningGuide}
                  </p>
                </div>

                <MuseSongYouTubePlayer
                  key={recommendation.famousSong.youtubeVideoId || recommendation.famousSong.title}
                  title={recommendation.famousSong.title}
                  titleOriginal={recommendation.famousSong.titleOriginal}
                  artist={recommendation.famousSong.artist}
                  artistOriginal={recommendation.famousSong.artistOriginal}
                  youtubeVideoId={recommendation.famousSong.youtubeVideoId}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    <span className="font-black uppercase tracking-wider text-white/30">출처</span>
                    {" "}{recommendation.famousSong.songSourceName || "Apple Music Classical / YouTube"}
                    {recommendation.famousSong.artist ? ` · ${recommendation.famousSong.artist}` : ""}
                  </p>
                </div>
              </div>
            )}

            
{/* 2. 오늘의 명시 (Masterpiece Poem) */}
            {recommendation.famousPoem && (
              <div className="p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-black border border-emerald-500/20 space-y-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block font-mono">
                        MUSE POEM · 2. 오늘의 명시
                      </span>
                      <h4 className="text-xl md:text-2xl font-bold text-white leading-snug font-sans">
                        {recommendation.famousPoem.title}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    POETIC RESONANCE
                  </span>
                </div>

                <p className="text-sm md:text-base text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Feather size={14} />
                  {recommendation.famousPoem.poet}
                </p>

                <div className="p-4 md:p-5 rounded-2xl bg-white/[0.03] border-l-4 border-emerald-400/80 pl-5 space-y-2">
                  <p className="text-sm md:text-base text-white/90 italic font-serif leading-relaxed whitespace-pre-line">
                    "{recommendation.famousPoem.excerpt}"
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    💡 추천 배경 및 시적 통찰
                  </span>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed font-sans">
                    {recommendation.famousPoem.whyRecommended}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    <span className="font-black uppercase tracking-wider text-white/30">출처</span>
                    {" "}{recommendation.famousPoem.poemSourceName || "시요일 라이브러리"}
                    {" · "}{recommendation.famousPoem.poet}
                  </p>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <a
                      href={buildPoemGoogleAiSearchUrl(
                        recommendation.famousPoem.title,
                        recommendation.famousPoem.poet,
                        recommendation.famousPoem.titleOriginal,
                        recommendation.famousPoem.poetOriginal,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-200/90 hover:text-white transition-colors cursor-pointer"
                    >
                      원작 감상하기
                      <ChevronRight size={12} />
                    </a>
                    <a
                      href={buildPoemGoogleArtsAndCultureSearchUrl(
                        recommendation.famousPoem.title,
                        recommendation.famousPoem.poet,
                        recommendation.famousPoem.titleOriginal,
                        recommendation.famousPoem.poetOriginal,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-200/90 hover:text-white transition-colors"
                    >
                      Google Arts & Culture 검색
                      <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            
{/* 3. 오늘의 명화 (Masterpiece Painting) */}
            <div className="relative p-6 md:p-10 rounded-[32px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 shadow-3xl overflow-hidden backdrop-blur-2xl">
              {/* Abs Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[130px] rounded-full pointer-events-none -mr-40 -mt-40 z-0" />

              <div className="relative z-10 space-y-8">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-400/30 text-[11px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5 shadow-sm">
                      <Palette size={13} />
                      🎨 3. 오늘의 명화 · MASTERPIECE PAINTING
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-medium tracking-wide text-white/50">
                      {recommendation.artworkType}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] text-[10px] font-medium tracking-wide text-white/50">
                      {recommendation.era}
                    </span>
                  </div>
                  
                  <div className="text-[10px] font-mono tracking-widest text-[#a5b4fc]/80 bg-[#a5b4fc]/5 border border-[#a5b4fc]/10 px-3 py-1.5 rounded-xl">
                    ENERGY FREQUENCY: 528Hz Sync
                  </div>
                </div>

                {/* Title & Creator */}
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-4xl font-sans font-extrabold text-white leading-tight tracking-tight">
                    {recommendation.title}
                  </h3>
                  <p className="text-sm md:text-base text-blue-400 font-sans font-bold flex items-center gap-1.5">
                    <Feather size={14} />
                    {recommendation.creator}
                  </p>
                </div>

                {/* NanoBanana Masterpiece Image Canvas */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] w-full max-w-lg mx-auto flex flex-col items-center justify-center group shadow-2xl">
                  {loadingImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 text-xs p-6 text-center bg-black/60 z-10 transition-all">
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-yellow-500/40 animate-spin absolute inset-0" />
                        <div className="w-10 h-10 rounded-full border-2 border-t-yellow-400 border-r-transparent animate-spin relative" />
                      </div>
                      <span className="font-mono tracking-widest uppercase animate-pulse text-[10px] text-yellow-300 font-black">
                        [ 🏛️ 세계 미술관 공식 원작 아카이브 로딩 중... ]
                      </span>
                    </div>
                  )}
                  {effectiveImage ? (
                    <>
                      <ImageOutputActions
                        src={effectiveImage}
                        alt={`${recommendation.title} — ${recommendation.creator}`}
                        filename={artworkImageFilename}
                        isOpen={isArtImageOpen}
                        onOpenChange={setIsArtImageOpen}
                      />
                      <img 
                        src={effectiveImage} 
                        alt={`${recommendation.title} — ${recommendation.creator}`}
                        referrerPolicy="no-referrer"
                        onLoad={() => setLoadingImage(false)}
                        onError={() => {
                          setLoadingImage(false);
                          if (imageRetryCountRef.current === 0) {
                            imageRetryCountRef.current += 1;
                            const fallbackUrl = buildPollinationsArtUrl(recommendation);
                            setNanobananaImage(fallbackUrl);
                            setArtworkImageSource("pollinations");
                            localStorage.setItem(ART_CACHE_KEYS.image, fallbackUrl);
                            localStorage.setItem(ART_CACHE_KEYS.imageSource, "pollinations");
                          }
                        }}
                        onClick={() => setIsArtImageOpen(true)}
                        className="w-full h-full object-cover cursor-zoom-in transition-all duration-700 hover:scale-105 opacity-100 scale-100" 
                      />
                      {getArtworkImageBadgeLabel(artworkImageSource) ? (
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/85 backdrop-blur-md rounded-xl border border-yellow-400/30 flex items-center gap-2 shadow-lg z-20 pointer-events-none">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400"></span>
                          </span>
                          <span className="text-[9px] font-black tracking-widest text-yellow-300 uppercase font-mono">
                            {getArtworkImageBadgeLabel(artworkImageSource)}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/50 text-xs p-6 text-center animate-pulse">
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-yellow-500/40 animate-spin absolute inset-0" />
                        <div className="w-10 h-10 rounded-full border-2 border-t-yellow-400 border-r-transparent animate-spin relative" />
                      </div>
                      <span className="font-mono tracking-widest uppercase text-[10px] text-yellow-300 font-extrabold">
                        [ 🏛️ 세계 미술관 공식 원작 아카이브 불러오는 중... ]
                      </span>
                    </div>
                  )}
                </div>

                {effectiveImage && !loadingImage && (
                  <p className="text-[10px] text-amber-200/80 text-center leading-relaxed px-2 -mt-2">
                    {isAiRecreatedArtworkSource(artworkImageSource)
                      ? "✨ 고전 명화의 구성과 화풍을 정밀 분석하여 재현한 고화질 미학 버전입니다."
                      : "🏛️ 시카고 미술관 / 메트로폴리탄 / 위키미디어 / DailyArt 공식 소장 원작 스캔본입니다."}
                  </p>
                )}

                {effectiveImage && !loadingImage && (
                  <>
                    <p className="text-[10px] text-white/40 text-center -mt-4">
                      그림을 탭하거나 버튼으로 크게 보기 · 다운로드 · AI 재생성
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 -mt-2">
                      <button
                        type="button"
                        onClick={() => setIsArtImageOpen(true)}
                        className="px-3 py-1.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <Maximize2 size={12} />
                        크게 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadImage(effectiveImage, artworkImageFilename)}
                        className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={12} />
                        다운로드
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (recommendation) {
                            void generateNanobananaImage(recommendation, { forcePollinations: true });
                          }
                        }}
                        disabled={loadingImage}
                        className="px-3 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={12} className={loadingImage ? "animate-spin" : ""} />
                        작품 AI 이미지 재생성
                      </button>
                    </div>
                  </>
                )}

                {/* Description */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    심층 미학 & 미묘한 서사
                  </span>
                  <p className="text-sm md:text-base text-white/70 leading-relaxed font-sans tracking-wide">
                    {recommendation.description}
                  </p>
                </div>

                {/* why recommended - insights */}
                <div className="p-5 md:p-6 rounded-[24px] bg-blue-500/[0.03] border border-blue-500/10 space-y-3 animate-fade-in">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300">
                    <Sparkles size={11} className="animate-pulse" />
                    뮤즈의 주파수 가이드 전언
                  </span>
                  <p className="text-xs md:text-sm text-blue-100/80 leading-relaxed font-sans font-medium">
                    {recommendation.whyRecommended}
                  </p>
                </div>

                {/* Aesthetic Mood tone line */}
                {recommendation.aestheticTone && (
                  <div className="text-xs text-white/50 border-t border-white/5 pt-4 flex items-center gap-2 font-mono">
                    <span className="text-blue-400 font-bold uppercase text-[10px]">AESTHETIC TONE:</span>
                    <span>{recommendation.aestheticTone}</span>
                  </div>
                )}

                {/* Quote */}
                <div className="p-6 md:p-8 rounded-[28px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Feather size={64} className="text-white" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                      거장의 영감 어록
                    </span>
                    <blockquote className="text-lg md:text-xl font-serif italic text-white/90 leading-relaxed">
                      "{recommendation.quote}"
                    </blockquote>
                    <p className="text-xs text-white/40 font-mono">
                      — {recommendation.creator}
                    </p>
                  </div>
                </div>

                {/* Link to DailyArt Article */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white/70">출처:</span>
                    <span>DailyArt Magazine · 시카고 미술관 · 메트로폴리탄 원작 아카이브</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {artworkArticleUrl && (
                      <a 
                        href={artworkArticleUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 font-bold"
                      >
                        원문 아티클 읽기
                        <ChevronRight size={14} />
                      </a>
                    )}
                    <a
                      href={buildArtworkGoogleArtsAndCultureSearchUrl(
                        recommendation.title,
                        recommendation.creator,
                        recommendation.titleOriginal,
                        recommendation.creatorOriginal,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-200/90 hover:text-white transition-colors"
                    >
                      Google Arts & Culture 검색
                      <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {(nanobananaImage || recommendation.imageUrl) && recommendation.famousPoem && recommendation.famousSong && (
              <div className="p-6 md:p-8 rounded-[28px] bg-gradient-to-br from-blue-500/[0.05] to-indigo-500/[0.02] border border-blue-500/15 space-y-4">
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    MUSE AUDIO DOCENT
                  </span>
                  <p className="text-sm text-white/80 font-sans">
                    오늘의 명곡, 명시, 명화를 뮤즈가 하나의 이야기로 엮어 순서대로 음성 안내해 드립니다.
                  </p>
                </div>
                <MuseDocentAudio
                  artwork={{
                    imageUrl: effectiveImage,
                    title: recommendation.title,
                    creator: recommendation.creator,
                    artworkType: recommendation.artworkType,
                    era: recommendation.era,
                    description: recommendation.description,
                    whyRecommended: recommendation.whyRecommended,
                    aestheticTone: recommendation.aestheticTone,
                    quote: recommendation.quote,
                    famousPoem: recommendation.famousPoem,
                    famousSong: recommendation.famousSong,
                  }}
                />
              </div>
            )}

            {/* Micro Challenges / Mindful quests */}
            <div className="p-6 md:p-8 rounded-[28px] bg-white/[0.01] border border-white/5 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#a5b4fc]/90 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#a5b4fc]" />
                  오늘의 마인드풀 창조적 달성 챌린지
                </h3>
                <p className="text-[11px] text-white/40 font-sans">
                  추천된 명화와 공명하여 오늘 하루 속에서 창의적 폐쇄를 돌파할 수 있는 두 가지 쾌활한 연습입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.challenges.map((c, idx) => {
                  const done = !!completedChallenges[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleChallenge(idx)}
                      className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 focus:outline-none cursor-pointer ${
                        done
                          ? "bg-green-500/5 border-green-500/30 text-white/50"
                          : "bg-white/[0.01] border-white/5 text-white hover:bg-white/[0.03] hover:border-white/10"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        done 
                          ? "bg-green-500 border-green-400 text-black font-bold" 
                          : "border-white/20 text-transparent"
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      
                      <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${done ? "text-green-400/60" : "text-blue-400"}`}>
                          MISSION O{idx + 1}
                        </span>
                        <p className={`text-xs md:text-sm font-sans leading-relaxed ${done ? "line-through text-white/40" : "text-white/80"}`}>
                          {c}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🌟 루시와 1:1 심층 상담 (Deep Insight) Banner */}
            <div className="p-6 md:p-8 rounded-[28px] bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-950/20 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                    <Sparkles size={13} className="animate-pulse" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-blue-200">
                    루시와 1:1 심층 상담 (Deep Insight)
                  </span>
                </div>
                <p className="text-[11px] text-white/70 font-sans leading-relaxed">
                  오늘 추천된 명화 [{recommendation.title}]와 영감 구절을 바탕으로, 루시와 함께 내면의 창조적 잠재력과 예술적 통찰을 심층 탐색하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void sendArtRecommendationToLucy(recommendation, openLucyChat, sendUnifiedMessage);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.35)] active:scale-95 cursor-pointer shrink-0"
              >
                <Sparkles size={13} />
                <span>루시와 심층 상담하기</span>
              </button>
            </div>

            {/* Unlimited Re-generation Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  if (activeTossRef.current) {
                    handleExitTossMode();
                  } else {
                    setRecommendation(null);
                    setNanobananaImage(null);
                    setArtworkImageSource(null);
                    clearArtRecommendationCache();
                  }
                }}
                className="px-5 py-3 rounded-2xl border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-blue-950/20"
              >
                <RefreshCw size={14} className="text-blue-400" />
                <span>다른 고민 / 테마로 예술 추천 다시 받기 (무제한)</span>
              </button>
            </div>
            <p className="text-[10px] text-white/40 font-mono text-center">
              언제든지 새로운 고민이나 감정 상태에 맞춰 새로운 명곡·명시·명화를 무제한 추천받을 수 있습니다.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      
    </div>
  );
}
