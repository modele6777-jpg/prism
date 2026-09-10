import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Palette, Volume2, VolumeX, Check, Copy, RefreshCw, 
  Award, User, Feather, Lightbulb, Image as ImageIcon, Eye, X, Download, BookOpen 
} from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

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
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    id: 'hesse', 
    name: '헤르만 헤세 (Hermann Hesse)', 
    title: '영혼의 탐도자', 
    piece: '데미안 & 싯다르타 (Demian & Siddhartha)', 
    medium: '철학 소설 & 영적 탐색의 여정', 
    icon: '📖',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    id: 'bach', 
    name: '요한 제바스티안 바흐 (J.S. Bach)', 
    title: '음악의 아버지', 
    piece: '골드베르크 변주곡 (Goldberg Variations)', 
    medium: '대위법 건반 협주곡 & 신성한 하모니', 
    icon: '🎼',
    imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200&auto=format&fit=crop'
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

  // Masterpiece artwork image states
  const [artworkImageUrl, setArtworkImageUrl] = useState<string>(MASTERS_LIST[0].imageUrl);
  const [isGeneratingArtwork, setIsGeneratingArtwork] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const handleSaveToReBible = () => {
    try {
      const savedKey = 'lucy_rebible_inspirations';
      const existing = JSON.parse(localStorage.getItem(savedKey) || '[]');
      const newEntry = {
        id: `rebible_${Date.now()}`,
        master: selectedMaster.name,
        piece: selectedMaster.piece,
        insight: dialogueData.masterpieceInsight,
        advice: dialogueData.masterDirectAdvice,
        affirmation: dialogueData.inspirationAffirmation,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(savedKey, JSON.stringify([newEntry, ...existing].slice(0, 50)));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (e) {
      console.warn('Failed to save to Re:Bible:', e);
    }
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
    setArtworkImageUrl(master.imageUrl);
  };

  const handleGenerateAiMasterpiece = (seedOffset = Date.now()) => {
    setIsGeneratingArtwork(true);
    const targetPiece = dialogueData.masterpieceName || selectedMaster.piece;
    const targetMaster = dialogueData.masterName || selectedMaster.name;
    const targetMedium = dialogueData.masterpieceMedium || selectedMaster.medium;
    const prompt = `Faithful museum masterpiece reproduction of "${targetPiece}" by ${targetMaster}. ${targetMedium}. Fine art museum oil painting, high resolution, authentic period colors and textures, museum lighting, 8k masterpiece.`;
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seedOffset}&nologo=true&model=turbo`;

    const testImg = new Image();
    testImg.onload = () => {
      setArtworkImageUrl(pollUrl);
      setIsGeneratingArtwork(false);
    };
    testImg.onerror = () => {
      setArtworkImageUrl(pollUrl);
      setIsGeneratingArtwork(false);
    };
    testImg.src = pollUrl;
  };

  const handleStartMasterclass = async () => {
    setIsLoading(true);

    const systemPrompt = "당신은 뮤즈의 예술 거장 마스터클래스 멘토입니다. 데일리 예술 명작 큐레이션과 역사적 롤모델과의 1:1 심층 대화를 융합하여, 사용자의 창작/인생 정체기를 단번에 돌파시키는 거장의 예술적 마스터클래스 조언을 생성하세요.";
    const userPrompt = `[선택된 거장]: ${selectedMaster.name} (${selectedMaster.title})
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
      setArtworkImageUrl(selectedMaster.imageUrl);
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
                DAILY ART + ROLE MODEL DIALOGUE FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">639Hz HARMONY TONE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Palette className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" size={28} />
              <span>거장의 예술적 영감 마스터클래스</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/70 max-w-xl leading-relaxed">
              <strong>데일리 예술 추천(섹션1)</strong>의 위대한 명작 큐레이션과 <strong>롤모델과의 대화(섹션2)</strong>를 융합하여, 창작의 벽에 부딪힌 당신을 위해 역사적 거장이 건네는 1:1 심층 예술 마스터클래스입니다.
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

              <button
                onClick={handleSaveToReBible}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  savedToast
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
                }`}
              >
                {savedToast ? <Check size={14} className="text-emerald-400" /> : <Award size={14} className="text-amber-300" />}
                <span>{savedToast ? '영감의 서 저장 완료!' : 'Re:Bible에 저장'}</span>
              </button>
            </div>
          </div>

          {/* Masterpiece Showcase: Actual Artwork Image + AI Reproduction */}
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/30 bg-black/60 shadow-2xl space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ImageIcon size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{dialogueData.masterpieceName}</span>
                    <span className="text-[10px] font-normal text-blue-300 font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      {dialogueData.masterpieceMedium}
                    </span>
                  </h4>
                  <p className="text-[11px] text-white/50">{dialogueData.masterName} · 미술관 컬렉션 & AI 정밀 재현 화폭</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="작품 크게 보기"
                >
                  <Eye size={13} />
                  <span>크게 보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAiMasterpiece()}
                  disabled={isGeneratingArtwork}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-violet-600/30 hover:from-blue-600/50 hover:to-violet-600/50 border border-blue-400/40 text-blue-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  title="해당 작품과 유사하게 AI 이미지 생성/재생성"
                >
                  <Sparkles size={13} className={isGeneratingArtwork ? "animate-spin text-yellow-300" : "text-yellow-300"} />
                  <span>{isGeneratingArtwork ? "AI 작품 화폭 생성 중..." : "AI 작품 유사 생성 / 재생성"}</span>
                </button>
              </div>
            </div>

            {/* Artwork Frame */}
            <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
              <img
                src={artworkImageUrl}
                alt={dialogueData.masterpieceName}
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                onError={(e) => {
                  const fallbackPrompt = encodeURIComponent(`Masterpiece artwork ${dialogueData.masterpieceName} by ${dialogueData.masterName}, fine art oil painting, museum photograph`);
                  e.currentTarget.src = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=768&nologo=true&model=turbo`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/90 pointer-events-none">
                <span className="font-serif italic drop-shadow-md">
                  "{dialogueData.masterpieceName}" — {dialogueData.masterName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono text-blue-300">
                  Masterpiece Gallery
                </span>
              </div>
            </div>

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

      {/* Artwork Image Lightbox Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">{dialogueData.masterpieceName}</h4>
                  <p className="text-xs text-white/50">{dialogueData.masterName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={artworkImageUrl}
                    download={`${dialogueData.masterpieceName}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    title="이미지 다운로드 / 새 창 열기"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Image */}
              <div className="p-4 sm:p-6 flex-1 flex items-center justify-center overflow-auto">
                <img
                  src={artworkImageUrl}
                  alt={dialogueData.masterpieceName}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl border border-white/10 shadow-2xl"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 bg-zinc-900/60 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                <span>{dialogueData.masterpieceMedium}</span>
                <button
                  type="button"
                  onClick={() => {
                    handleGenerateAiMasterpiece();
                  }}
                  disabled={isGeneratingArtwork}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 font-bold transition-all disabled:opacity-50"
                >
                  <Sparkles size={13} className={isGeneratingArtwork ? "animate-spin" : ""} />
                  <span>새 AI 화폭으로 재현하기</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
