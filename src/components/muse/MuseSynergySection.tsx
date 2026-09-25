import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Palette, Volume2, VolumeX, Check, Copy, RefreshCw, 
  User, Feather, Lightbulb, Image as ImageIcon, Eye, X, Download, BookOpen,
  Maximize2
} from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';
import { getSafeArtworkUrl, buildPollinationsArtUrl } from '@/utils/artworkImage';
import { ImageOutputActions, downloadImage } from '@/components/ImageOutputActions';

interface MasterpieceDialogueData {
  title: string;
  masterName: string;
  masterTitle: string;
  masterpieceName: string;
  masterpieceMedium: string;
  masterpieceInsight: string;
  masterDirectAdvice: string;
  creativeSparkTechnique: string;
  colorPalette: string[];
  inspirationAffirmation: string;
}

interface MasterItem {
  id: string;
  name: string;
  title: string;
  piece: string;
  medium: string;
  icon: string;
  imageUrl: string;
}

const MASTERS_LIST: MasterItem[] = [
  { 
    id: 'vangogh', 
    name: '빈센트 반 고흐 (Vincent van Gogh)', 
    title: '불꽃의 화가', 
    piece: '별이 빛나는 밤 (The Starry Night)', 
    medium: '유화 (Oil on Canvas)', 
    icon: '🎨',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'
  },
  { 
    id: 'davinci', 
    name: '레오나르도 다 빈치 (Leonardo da Vinci)', 
    title: '르네상스 만능 천재', 
    piece: '모나리자 (Mona Lisa)', 
    medium: '유화 및 르네상스 걸작', 
    icon: '📐',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'
  },
  { 
    id: 'monet', 
    name: '클로드 모네 (Claude Monet)', 
    title: '빛의 연금술사', 
    piece: '수련 (Water Lilies)', 
    medium: '인상주의 회화', 
    icon: '🪷',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg'
  },
  { 
    id: 'debussy', 
    name: '클로드 드뷔시 (Claude Debussy)', 
    title: '음향의 시인', 
    piece: '달빛 (Clair de Lune)', 
    medium: '인상주의 피아노 독주곡 & 야상곡', 
    icon: '🎹',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Henri_Le_Sidaner_-_Clair_de_lune.jpg/1280px-Henri_Le_Sidaner_-_Clair_de_lune.jpg'
  },
  { 
    id: 'hesse', 
    name: '헤르만 헤세 (Hermann Hesse)', 
    title: '영혼의 탐도자', 
    piece: '데미안 & 싯다르타 (Demian & Siddhartha)', 
    medium: '철학 소설 & 영적 탐색의 여정', 
    icon: '📖',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Hermann_Hesse_1927.jpg/800px-Hermann_Hesse_1927.jpg'
  },
  { 
    id: 'bach', 
    name: '요한 제바스티안 바흐 (J.S. Bach)', 
    title: '음악의 아버지', 
    piece: '골드베르크 변주곡 (Goldberg Variations)', 
    medium: '대위법 건반 협주곡 & 신성한 하모니', 
    icon: '🎼',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Johann_Sebastian_Bach.jpg/800px-Johann_Sebastian_Bach.jpg'
  },
];

const FALLBACK_DIALOGUE: MasterpieceDialogueData = {
  title: "거장의 예술적 영감 마스터클래스 (Masterpiece Resonance Dialogue)",
  masterName: "빈센트 반 고흐 (Vincent van Gogh)",
  masterTitle: "불꽃의 화가",
  masterpieceName: "별이 빛나는 밤 (The Starry Night)",
  masterpieceMedium: "유화 (Oil on Canvas)",
  masterpieceInsight: "가장 짙은 어둠 속에서도 별들은 소용돌이치며 타오르고 있습니다. 고통과 외로움은 예술의 장애물이 아니라 영혼의 빛을 토해내게 만드는 거룩한 캔버스입니다.",
  masterDirectAdvice: "나의 친구여, 그대가 느끼는 정체기와 불안을 두려워하지 마십시오. 머리로 계산하지 말고 심장의 심연에서 끓어오르는 솔직한 붓질을 세상에 쏟아내십시오.",
  creativeSparkTechnique: "임파스토(Impasto) 기법: 생각을 거치지 않고 직관적인 두터운 질감으로 감정의 원형을 즉시 표현하기",
  colorPalette: ["#1E3A8A (밤하늘 딥 울트라마린)", "#F59E0B (소용돌이치는 황금별)", "#065F46 (영원의 사이프러스 그린)"],
  inspirationAffirmation: "나는 내 안의 모든 감정과 고뇌를 가장 위대한 창조적 영감의 불꽃으로 승화시킨다."
};

export function MuseSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedMaster, setSelectedMaster] = useState<MasterItem>(MASTERS_LIST[0]);
  const [userCreativeDilemma, setUserCreativeDilemma] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dialogueData, setDialogueData] = useState<MasterpieceDialogueData>(FALLBACK_DIALOGUE);
  const [isSynthesized, setIsSynthesized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const isTTSActive = useTTSActive();

  // Masterpiece artwork image states (오늘의 명화와 동일한 캔버스 및 다중 폴백 구조)
  const [imageFallbackIndex, setImageFallbackIndex] = useState<number>(0);
  const [loadingArtwork, setLoadingArtwork] = useState<boolean>(true);
  const [artworkLoadError, setArtworkLoadError] = useState<boolean>(false);
  const [isArtImageOpen, setIsArtImageOpen] = useState<boolean>(false);
  const [customArtworkUrl, setCustomArtworkUrl] = useState<string>('');
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);

  // 거장 또는 대화 내용이 바뀔 때 이미지 로딩 및 폴백 상태 초기화
  useEffect(() => {
    setImageFallbackIndex(0);
    setArtworkLoadError(false);
    setLoadingArtwork(true);
  }, [selectedMaster.id, dialogueData.masterpieceName, customArtworkUrl]);

  // 오늘의 명화와 동일한 원작 프록시 + 다중 폴백 체인
  const fallbackUrls = useMemo(() => {
    const list: string[] = [];

    // 1. 사용자가 AI 재생성을 요청한 경우 커스텀 AI 명화 URL 최우선
    if (customArtworkUrl) {
      list.push(customArtworkUrl);
    }

    // 2. 선택된 거장의 공식 컬렉션/원작 이미지 (프록시 및 원본)
    if (selectedMaster.imageUrl) {
      list.push(getSafeArtworkUrl(selectedMaster.imageUrl));
      list.push(encodeURI(selectedMaster.imageUrl));
    }

    // 3. 작품명과 거장 이름에 기반한 고화질 미학 AI 재현 URL
    const faithfulUrl = buildPollinationsArtUrl(
      {
        title: dialogueData.masterpieceName,
        creator: dialogueData.masterName,
        artworkType: dialogueData.masterpieceMedium || '명화 회화',
        era: selectedMaster.title || '고전 명작',
        description: dialogueData.masterpieceInsight || 'Masterpiece artwork',
        aestheticTone: dialogueData.colorPalette?.join(', ') || 'classical museum fine art',
      },
      1024,
      768
    );
    list.push(faithfulUrl);

    // 4. 고호환성 초간단 명화 프롬프트
    const simplePrompt = encodeURIComponent(
      `Masterpiece museum fine art oil painting of "${dialogueData.masterpieceName}" by ${dialogueData.masterName}, museum photograph, ultra detailed canvas`
    );
    list.push(`https://image.pollinations.ai/prompt/${simplePrompt}?width=1024&height=768&nologo=true&seed=42`);

    return [...new Set(list.filter(Boolean))];
  }, [customArtworkUrl, selectedMaster, dialogueData]);

  const effectiveArtworkImage = fallbackUrls[imageFallbackIndex] || fallbackUrls[0] || '';
  const artworkFilename = `masterpiece-${dialogueData.masterpieceName}-${dialogueData.masterName}`;

  const handleRegenerateArtwork = () => {
    setLoadingArtwork(true);
    setArtworkLoadError(false);
    setImageFallbackIndex(0);
    const seed = Math.floor(Math.random() * 900000) + 100000;
    const prompt = encodeURIComponent(
      `Faithful fine art oil painting reproduction of "${dialogueData.masterpieceName}" by ${dialogueData.masterName}, ${dialogueData.masterpieceMedium}, rich brushwork, museum gallery lighting, ultra high resolution masterpiece`
    );
    const newUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=768&nologo=true&seed=${seed}&model=turbo`;
    setCustomArtworkUrl(newUrl);
    setIsAiGenerated(true);
  };

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const toggle639Hz = () => {
    if (isAudioPlaying) {
      try {
        oscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
      audioCtxRef.current = null;
      oscRef.current = null;
      setIsAudioPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(639, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        setIsAudioPlaying(true);
      } catch (e) {
        console.warn('Audio synthesis error:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      try {
        oscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
      stopTTS();
    };
  }, []);

  const handleSpeakMasterpiece = () => {
    if (isTTSActive) {
      stopTTS();
    } else {
      const text = `거장의 예술적 영감 마스터클래스입니다. ${dialogueData.masterName}의 조언: ${dialogueData.masterDirectAdvice}. 명작 통찰: ${dialogueData.masterpieceInsight}. 영감 확언: ${dialogueData.inspirationAffirmation}`;
      playTTS(text, 'Kore', false, '치유');
    }
  };

  const handleSelectMaster = (master: MasterItem) => {
    setSelectedMaster(master);
    setCustomArtworkUrl('');
    setIsAiGenerated(false);
    setImageFallbackIndex(0);
    setArtworkLoadError(false);
    setLoadingArtwork(true);
  };

  const handleStartMasterclass = async () => {
    setIsLoading(true);

    const systemPrompt = "당신은 뮤즈의 예술 거장 마스터클래스 멘토입니다. 좌측 메뉴 [Art]의 데일리 예술 명작 큐레이션과 우측 메뉴 [MATE]의 역사적 롤모델과의 1:1 심층 대화를 완벽히 융합하여, 사용자의 창작/인생 정체기를 단번에 돌파시키는 거장의 예술적 마스터클래스 조언을 생성하세요.";
    const userPrompt = `[양쪽 메뉴 융합: ART 명작 큐레이션 ✕ MATE 거장 대화]
[선택된 거장]: ${selectedMaster.name} (${selectedMaster.title})
[대표 명작]: ${selectedMaster.piece}
[사용자의 현재 고민 / 창작 정체기 / 상태]: "${userCreativeDilemma.trim() || '영감의 고갈과 방향성에 대한 고민'}"
[사용자 닉네임]: "${userProfile?.basic?.nickname || '예술가'}"

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "마스터클래스 고유 명칭 (예: ${selectedMaster.name}의 영혼 돌파 마스터클래스)",
  "masterName": "${selectedMaster.name}",
  "masterTitle": "${selectedMaster.title}",
  "masterpieceName": "${selectedMaster.piece}",
  "masterpieceMedium": "${selectedMaster.medium}",
  "masterpieceInsight": "이 명작에 담긴 심오한 창조적 비밀과 철학적 통찰 (2~3문장)",
  "masterDirectAdvice": "거장이 1인칭으로 사용자에게 직접 건네는 따뜻하고 통찰력 넘치는 예술적 돌파 조언 (3~4문장)",
  "creativeSparkTechnique": "오늘 당장 작업이나 일상에 적용할 수 있는 거장의 창작 기법 1가지",
  "colorPalette": [
    "영감 색상 코드 1 (설명)",
    "영감 색상 코드 2 (설명)",
    "영감 색상 코드 3 (설명)"
  ],
  "inspirationAffirmation": "창조성을 일깨우는 1인칭 예술 확언문"
}`;

    const safetyTimeout = new Promise<MasterpieceDialogueData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_DIALOGUE,
          masterName: selectedMaster.name,
          masterTitle: selectedMaster.title,
          masterpieceName: selectedMaster.piece,
          masterpieceMedium: selectedMaster.medium,
          title: `〈${selectedMaster.name}〉 예술 영감 마스터클래스`
        });
      }, 6500);
    });

    const runAI = async (): Promise<MasterpieceDialogueData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && parsed.masterDirectAdvice) {
          return parsed;
        }
      } catch (e) {
        console.warn('[MuseSynergy] invokeLLM error:', e);
      }
      throw new Error('Need fallback');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setDialogueData(result);
      setCustomArtworkUrl('');
      setIsAiGenerated(false);
      setImageFallbackIndex(0);
      setArtworkLoadError(false);
      setLoadingArtwork(true);
      setIsSynthesized(true);
      recordPrismFeature({
        app: 'muse',
        featureName: 'Muse Masterpiece Dialogue Synergy',
        summary: result.title,
        details: { master: selectedMaster.name, title: result.title }
      });
      updateSharedState({}, 'MUSE');
    } catch (e) {
      console.warn('Muse fallback error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `🎨 [${dialogueData.title}]\n\n👤 거장: ${dialogueData.masterName} (${dialogueData.masterTitle})\n🖼️ 명작: ${dialogueData.masterpieceName}\n\n💡 명작 통찰: ${dialogueData.masterpieceInsight}\n\n💬 거장의 1:1 조언:\n"${dialogueData.masterDirectAdvice}"\n\n⚡ 창작 돌파 기법: ${dialogueData.creativeSparkTechnique}\n\n🌟 예술 확언: "${dialogueData.inspirationAffirmation}"\n- PRISM MUSE Masterpiece Dialogue`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-zinc-950/90 to-violet-950/40 shadow-[0_0_50px_rgba(59,130,246,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-400 animate-pulse" />
                ART ✕ MATE FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">639Hz HARMONY TONE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Palette className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" size={28} />
              <span>거장의 예술적 영감 마스터클래스</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/70 max-w-xl leading-relaxed">
              <strong>Art(데일리 명작 큐레이션)</strong>과 <strong>MATE(거장 롤모델 1:1 대화)</strong>의 양쪽 메뉴를 융합하여, 창작의 벽에 부딪힌 당신을 위해 역사적 거장이 건네는 1:1 심층 예술 마스터클래스입니다.
            </p>
          </div>

          <button
            onClick={toggle639Hz}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
              isAudioPlaying
                ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isAudioPlaying ? '639Hz 영감 주파수 재생 중' : '639Hz 주파수 켜기'}</span>
          </button>
        </div>
      </div>

      {/* Master Selection Form */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-blue-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <User size={16} className="text-blue-400" />
            <span>1. 마스터클래스를 진행할 예술 거장 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">역사적 명작 연계</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MASTERS_LIST.map((master) => {
            const isSelected = selectedMaster.id === master.id;
            return (
              <button
                key={master.id}
                type="button"
                onClick={() => handleSelectMaster(master)}
                className={`relative overflow-hidden p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-500/25 border-blue-400/80 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.02]'
                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xl">{master.icon}</span>
                  <span className="text-[10px] text-blue-300 font-mono font-bold uppercase">{master.title}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate relative z-10">{master.name}</h4>
                <p className="text-[10px] text-white/60 truncate font-serif relative z-10">🖼️ {master.piece}</p>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-2 font-medium">
            거장에게 조언받고 싶은 현재의 창작 고민이나 인생의 막막함을 적어주세요:
          </label>
          <input
            type="text"
            value={userCreativeDilemma}
            onChange={(e) => setUserCreativeDilemma(e.target.value)}
            placeholder="예: 새로운 아이디어가 떠오르지 않고 완성할 자신감이 떨어졌어요..."
            className="w-full px-4 py-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/60 font-sans"
          />
        </div>

        <button
          onClick={handleStartMasterclass}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin text-white" />
              <span>거장의 예술적 영감 마스터클래스 접속 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="text-yellow-300" />
              <span>〈거장의 1:1 영감 마스터클래스 대화〉 시작하기</span>
            </>
          )}
        </button>
      </div>

      {/* Synthesized Masterclass Output */}
      {isSynthesized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-blue-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
                  MASTERPIECE DIALOGUE DIPLOMA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  {dialogueData.masterTitle}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{dialogueData.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleSpeakMasterpiece}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTTSActive
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30'
                }`}
              >
                {isTTSActive ? <VolumeX size={14} className="text-amber-300" /> : <Volume2 size={14} className="text-blue-300" />}
                <span>{isTTSActive ? '낭독 중단' : '거장 조언 음성 낭독'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? '복사 완료' : '마스터클래스 전체 복사'}</span>
              </button>
            </div>
          </div>

          {/* Masterpiece Showcase: Actual Artwork Image + AI Reproduction (오늘의 명화와 동일한 캔버스 미학 연출) */}
          <div className="relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-blue-500/30 shadow-2xl backdrop-blur-2xl space-y-6">
            {/* Meta details */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-400/30 text-[11px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5 shadow-sm">
                  <Palette size={13} />
                  🎨 거장의 명작 · MASTERPIECE ARTWORK
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-medium tracking-wide text-white/50">
                  {dialogueData.masterpieceMedium}
                </span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-[#a5b4fc]/80 bg-[#a5b4fc]/5 border border-[#a5b4fc]/10 px-3 py-1.5 rounded-xl">
                ENERGY FREQUENCY: 639Hz Sync
              </div>
            </div>

            {/* Title & Creator */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h4 className="text-xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {dialogueData.masterpieceName}
              </h4>
              <p className="text-xs sm:text-sm text-blue-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                <Feather size={14} />
                {dialogueData.masterName} · {dialogueData.masterTitle}
              </p>
            </div>

            {/* Masterpiece Image Canvas (부드러운 페이드인 및 카드 확대 애니메이션) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-[4/3] w-full max-w-lg mx-auto flex flex-col items-center justify-center group shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-blue-400/40 hover:shadow-[0_0_35px_rgba(59,130,246,0.25)]"
            >
              {loadingArtwork && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 text-xs p-6 text-center bg-black/60 z-10 transition-all">
                  <div className="relative w-10 h-10">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-yellow-500/40 animate-spin absolute inset-0" />
                    <div className="w-10 h-10 rounded-full border-2 border-t-yellow-400 border-r-transparent animate-spin relative" />
                  </div>
                  <span className="font-mono tracking-widest uppercase animate-pulse text-[10px] text-yellow-300 font-black">
                    [ 🏛️ 거장의 원작 갤러리 불러오는 중... ]
                  </span>
                </div>
              )}

              {effectiveArtworkImage && !artworkLoadError ? (
                <>
                  <ImageOutputActions
                    src={effectiveArtworkImage}
                    alt={`${dialogueData.masterpieceName} — ${dialogueData.masterName}`}
                    filename={artworkFilename}
                    isOpen={isArtImageOpen}
                    onOpenChange={setIsArtImageOpen}
                  />
                  <img
                    key={effectiveArtworkImage}
                    src={effectiveArtworkImage}
                    alt={`${dialogueData.masterpieceName} — ${dialogueData.masterName}`}
                    referrerPolicy="no-referrer"
                    onLoad={() => {
                      setLoadingArtwork(false);
                      setArtworkLoadError(false);
                    }}
                    onError={() => {
                      if (imageFallbackIndex + 1 < fallbackUrls.length) {
                        setImageFallbackIndex((prev) => prev + 1);
                      } else {
                        setLoadingArtwork(false);
                        setArtworkLoadError(true);
                      }
                    }}
                    onClick={() => setIsArtImageOpen(true)}
                    className={`w-full h-full object-cover cursor-zoom-in transition-all duration-700 ease-out hover:scale-105 ${
                      loadingArtwork ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
                    }`}
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/85 backdrop-blur-md rounded-xl border border-yellow-400/30 flex items-center gap-2 shadow-lg z-20 pointer-events-none">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400"></span>
                    </span>
                    <span className="text-[9px] font-black tracking-widest text-yellow-300 uppercase font-mono">
                      {isAiGenerated ? '✨ AI 명화 재현' : '🏛️ 거장 원작 갤러리'}
                    </span>
                  </div>
                </>
              ) : artworkLoadError ? (
                /* Elegant Masterpiece Museum Canvas Plaque Fallback */
                <div className="relative w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-950/40 via-zinc-900 to-indigo-950/40 border border-amber-400/20">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-3 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                    <Palette size={26} />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400/80 font-bold mb-1">
                    🏛️ MUSEUM MASTERPIECE ARCHIVE
                  </span>
                  <h4 className="text-lg md:text-xl font-serif font-extrabold text-white mb-1 px-4 leading-tight">
                    {dialogueData.masterpieceName}
                  </h4>
                  <p className="text-xs text-amber-200/70 font-medium mb-4">
                    {dialogueData.masterName} · {dialogueData.masterpieceMedium}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImageFallbackIndex(0);
                        setArtworkLoadError(false);
                        setLoadingArtwork(true);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                    >
                      <RefreshCw size={12} className={loadingArtwork ? 'animate-spin' : ''} />
                      원작 이미지 다시 불러오기
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateArtwork}
                      className="px-3.5 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                    >
                      <Sparkles size={12} />
                      AI 명화 재현
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>

            {/* Action Bar & Buttons */}
            {effectiveArtworkImage && !loadingArtwork && (
              <>
                <p className="text-[10px] text-white/40 text-center -mt-2">
                  그림을 탭하거나 버튼으로 크게 보기 · 다운로드 · AI 재생성
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 -mt-2">
                  <button
                    type="button"
                    onClick={() => setIsArtImageOpen(true)}
                    className="px-3.5 py-1.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <Maximize2 size={13} />
                    크게 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadImage(effectiveArtworkImage, artworkFilename)}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <Download size={13} />
                    다운로드
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateArtwork}
                    disabled={loadingArtwork}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles size={13} className={loadingArtwork ? 'animate-spin' : ''} />
                    작품 AI 이미지 재생성
                  </button>
                </div>
              </>
            )}

            {/* Masterpiece Insight Box */}
            <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/25 space-y-1.5">
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} />
                작품에 깃든 창조적 비밀과 통찰
              </span>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-sans">
                "{dialogueData.masterpieceInsight}"
              </p>
            </div>
          </div>

          {/* Master 1:1 Direct Advice */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900/30 via-zinc-900/50 to-indigo-900/20 border border-blue-400/40 relative shadow-inner space-y-3">
            <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-400" />
              {dialogueData.masterName}의 1:1 직접 조언 (Direct Advice)
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight break-keep">
              "{dialogueData.masterDirectAdvice}"
            </p>
          </div>

          {/* Technique & Palette Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                <Lightbulb size={12} /> 거장의 창작 돌파 기법
              </span>
              <p className="text-xs text-white/80 leading-relaxed font-sans">{dialogueData.creativeSparkTechnique}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-300 uppercase flex items-center gap-1.5">
                <Palette size={12} /> 영감 팔레트
              </span>
              <div className="flex flex-col gap-1 text-xs text-white/70">
                {dialogueData.colorPalette.map((col, i) => (
                  <span key={i} className="truncate">{col}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Affirmation Banner */}
          <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-1">
            <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">
              CREATIVE SPARK AFFIRMATION
            </span>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              "{dialogueData.inspirationAffirmation}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
