import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Sparkles,
  Star,
  Layers,
  Flame,
  Droplets,
  TreePine,
  Mountain,
  Shield,
  Send,
  Copy,
  Check,
  Volume2,
  VolumeX,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Heart,
  Briefcase,
  Coins,
  Sun
} from 'lucide-react';
import { useApp, getPersistentUserProfile, setPersistentUserProfile } from '@/contexts/AppContext';
import {
  calculateDetailedSaju,
  generateDailySajuReport,
  ELEMENT_DETAILS,
  BRANCH_KOREAN,
  STEM_KOREAN,
  type SajuAnalysisResult,
  type FiveElement,
  type DailySajuReport
} from '@/lib/sajuAnalysis';
import { invokeLLM } from '@/lib/ai';
import { playTTS, playTTSInChunks, stopTTS, useTTSActive } from '@/utils/tts';

// 지장간(支藏干: 각 지지에 숨겨진 천간 기운)
const JIJANGAN_MAP: Record<string, string[]> = {
  子: ['壬', '癸'],
  丑: ['癸', '辛', '己'],
  寅: ['戊', '丙', '甲'],
  卯: ['甲', '乙'],
  辰: ['乙', '癸', '戊'],
  巳: ['戊', '庚', '丙'],
  午: ['丙', '己', '丁'],
  未: ['丁', '乙', '己'],
  申: ['戊', '壬', '庚'],
  酉: ['庚', '辛'],
  戌: ['辛', '丁', '戊'],
  亥: ['戊', '甲', '壬'],
};

// 12운성 (일간 기준 각 지지의 12운성: 장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양)
const TWELVE_STAGES_MATRIX: Record<string, Record<string, string>> = {
  甲: { 亥: '장생', 子: '목욕', 丑: '관대', 寅: '건록', 卯: '제왕', 辰: '쇠', 巳: '병', 午: '사', 未: '묘', 申: '절', 酉: '태', 戌: '양' },
  乙: { 午: '장생', 巳: '목욕', 辰: '관대', 卯: '건록', 寅: '제왕', 丑: '쇠', 子: '병', 亥: '사', 戌: '묘', 酉: '절', 申: '태', 未: '양' },
  丙: { 寅: '장생', 卯: '목욕', 辰: '관대', 巳: '건록', 午: '제왕', 未: '쇠', 申: '병', 酉: '사', 戌: '묘', 亥: '절', 子: '태', 丑: '양' },
  丁: { 酉: '장생', 申: '목욕', 未: '관대', 午: '건록', 巳: '제왕', 辰: '쇠', 卯: '병', 寅: '사', 丑: '묘', 子: '절', 亥: '태', 戌: '양' },
  戊: { 寅: '장생', 卯: '목욕', 辰: '관대', 巳: '건록', 午: '제왕', 未: '쇠', 申: '병', 酉: '사', 戌: '묘', 亥: '절', 子: '태', 丑: '양' },
  己: { 酉: '장생', 申: '목욕', 未: '관대', 午: '건록', 巳: '제왕', 辰: '쇠', 卯: '병', 寅: '사', 丑: '묘', 子: '절', 亥: '태', 戌: '양' },
  庚: { 巳: '장생', 午: '목욕', 未: '관대', 申: '건록', 酉: '제왕', 戌: '쇠', 亥: '병', 子: '사', 丑: '묘', 寅: '절', 卯: '태', 辰: '양' },
  辛: { 子: '장생', 亥: '목욕', 戌: '관대', 酉: '건록', 申: '제왕', 未: '쇠', 午: '병', 巳: '사', 辰: '묘', 卯: '절', 寅: '태', 丑: '양' },
  壬: { 申: '장생', 酉: '목욕', 戌: '관대', 亥: '건록', 子: '제왕', 丑: '쇠', 寅: '병', 卯: '사', 辰: '묘', 巳: '절', 午: '태', 未: '양' },
  癸: { 卯: '장생', 寅: '목욕', 丑: '관대', 子: '건록', 亥: '제왕', 戌: '쇠', 酉: '병', 申: '사', 未: '묘', 午: '절', 巳: '태', 辰: '양' },
};

interface TrinityDestinyReportViewProps {
  onConsult?: (text: string) => void;
}

export function TrinityDestinyReportView({ onConsult }: TrinityDestinyReportViewProps) {
  const { sharedState } = useApp();
  const profile = sharedState?.userProfile || getPersistentUserProfile();
  const isTTSActive = useTTSActive();

  // 프로필 편집 모달/인라인 토글
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.basic?.name || '여행자');
  const [editBirthdate, setEditBirthdate] = useState(profile?.basic?.birthdate || '1995-05-15');
  const [editBirthtime, setEditBirthtime] = useState(profile?.basic?.birthtime || '12:00');
  const [editGender, setEditGender] = useState<'male' | 'female'>(profile?.basic?.gender === 'female' ? 'female' : 'male');
  const [copied, setCopied] = useState(false);

  // AI 질의응답 상태
  const [questionInput, setQuestionInput] = useState('');
  const [aiAnswers, setAiAnswers] = useState<Array<{ q: string; a: string; time: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 대화 추가 시 하단 자동 스크롤
  useEffect(() => {
    if (aiAnswers.length > 0 || isAiLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiAnswers, isAiLoading]);

  // 사주 계산 결과 (메모이제이션)
  const saju = useMemo(() => {
    return calculateDetailedSaju(profile);
  }, [profile]);

  // 프로필 저장 핸들러
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newProfile = {
      ...(profile || {}),
      basic: {
        ...(profile?.basic || {}),
        name: editName.trim() || '여행자',
        birthdate: editBirthdate,
        birthtime: editBirthtime,
        gender: editGender,
      },
    };
    setPersistentUserProfile(newProfile as any);
    setIsEditingProfile(false);
  };

  // 12운성 가져오기 헬퍼
  const getTwelveStage = (zhi: string) => {
    if (!saju?.pillars.day.gan) return '건록';
    return TWELVE_STAGES_MATRIX[saju.pillars.day.gan]?.[zhi] || '조화';
  };

  // 클립보드 복사
  const handleCopyReport = () => {
    if (!saju) return;
    const text = `[📜 사주 오행 & 만세력 리포트]\n` +
      `- 이름: ${saju.name} (${saju.gender})\n` +
      `- 생년월일시: ${saju.birthdate} ${saju.birthtime || '시간 미입력'}\n` +
      `- 본원(일간): ${saju.dayMaster.hanja}(${saju.dayMaster.korean}) - ${saju.dayMaster.symbolName}\n` +
      `- 사주 4주 8자:\n` +
      `  * 년주: ${saju.pillars.year.full} (${saju.pillars.year.tenGodGan.name}/${saju.pillars.year.tenGodZhi.name})\n` +
      `  * 월주: ${saju.pillars.month.full} (${saju.pillars.month.tenGodGan.name}/${saju.pillars.month.tenGodZhi.name})\n` +
      `  * 일주: ${saju.pillars.day.full} (${saju.pillars.day.tenGodGan.name}/${saju.pillars.day.tenGodZhi.name})\n` +
      `  * 시주: ${saju.pillars.hour ? `${saju.pillars.hour.full} (${saju.pillars.hour.tenGodGan.name}/${saju.pillars.hour.tenGodZhi.name})` : '시간 미지정'}\n` +
      `- 오행 분포: 목(${saju.elements.counts.목}) 화(${saju.elements.counts.화}) 토(${saju.elements.counts.토}) 금(${saju.elements.counts.금}) 수(${saju.elements.counts.수})\n` +
      `- 중심 기운: ${saju.elements.dominant.name} / 결핍 기운: ${saju.elements.lacking.name}\n` +
      `- 용신 보약: ${saju.yongsin.name} (${saju.yongsin.actionTip})\n` +
      `- 2026 병오년 흐름: ${saju.annual2026.theme}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 오늘의 사주 일진 및 운세 리포트 계산
  const todayReport = useMemo(() => {
    if (!saju) return null;
    return generateDailySajuReport(saju);
  }, [saju]);

  // TTS 토글: '오늘의 사주 리포트' 음성 낭독 및 중지
  const handleToggleTTS = async () => {
    if (isTTSActive) {
      stopTTS();
      return;
    }
    if (!saju) return;

    const report = todayReport || generateDailySajuReport(saju);
    if (!report?.speechText) return;

    // 자연스럽고 끊김 없는 청크 스트리밍 재생 (음성 클릭 시 즉시 중지 가능)
    await playTTSInChunks(report.speechText, 'Kore', 350, '따뜻함');
  };

  // AI 명리 1:1 상담 질문 전송
  const handleAskAI = async (customQ?: string) => {
    const q = (customQ || questionInput).trim();
    if (!q || isAiLoading || !saju) return;

    setQuestionInput('');
    setIsAiLoading(true);

    try {
      const systemPrompt = `당신은 대한민국 최고의 정통 사주명리학 대가이자 따뜻한 카운슬러 '루시(Lucy)'입니다.
다음은 내담자의 정밀 사주 원국과 오행 분석 데이터입니다:

${saju.systemPromptSummary}

내담자의 질문에 대해:
1. 사주 4주 8자의 음양오행 및 일간(${saju.dayMaster.hanja}), 십신, 신살을 종합적으로 근거로 삼아 명쾌하게 해설하세요.
2. 미신적이거나 공포를 조장하는 말을 철저히 배제하고, 내담자가 자신의 타고난 잠재력과 결핍된 기운을 지혜롭게 보완할 수 있는 현대적이고 실천적인 조언을 3~4문장(250자 내외)으로 친절하게 답변하세요.`;

      const reply = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: q },
        ],
      });

      const cleanReply = reply.replace(/```/g, '').trim();
      setAiAnswers((prev) => [
        ...prev,
        {
          q,
          a: cleanReply,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }),
        },
      ]);
    } catch (err) {
      console.error('Failed to get saju AI advice:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 퀵 추천 질문
  const QUICK_QUESTIONS = [
    '💼 내 오행에 가장 어울리는 직업과 업무 스타일은?',
    '💰 내 사주 원국의 재물 흐름과 돈을 모으는 비결은?',
    '❤️ 나의 연애 성향과 나를 채워주는 좋은 인연의 기운은?',
    '⚡ 2026년 나에게 가장 중요한 터닝 포인트와 기회는?',
    '🌿 부족한 오행을 일상에서 가장 쉽게 채우는 현실 팁은?',
  ];

  // 오행 컬러 팔레트
  const ELEMENT_COLORS: Record<FiveElement, { bg: string; text: string; border: string; badge: string; hex: string; icon: any }> = {
    목: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', hex: '#10b981', icon: TreePine },
    화: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', hex: '#f43f5e', icon: Flame },
    토: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-200 border-amber-500/40', hex: '#f59e0b', icon: Mountain },
    금: { bg: 'bg-slate-300/10', text: 'text-slate-200', border: 'border-slate-400/30', badge: 'bg-slate-400/20 text-slate-200 border-slate-400/40', hex: '#cbd5e1', icon: Shield },
    수: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', hex: '#38bdf8', icon: Droplets },
  };

  // 만약 사주 정보가 아직 입력되지 않았을 경우 입력 폼 표시
  if (!saju || !saju.hasBirthInfo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass p-8 sm:p-10 rounded-3xl bg-[#14151a]/95 border border-amber-500/30 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
            <Compass size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
              영혼의 설계도 — 사주 오행 & 만세력 리포트
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              생년월일과 태어난 시간을 입력하시면, 정통 명리학 기반의 사주 4주 8자 원국표와 목·화·토·금·수 오행 밸런스를 즉시 분석해 드립니다.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="max-w-md mx-auto space-y-4 text-left pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">성함 또는 닉네임</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">생년월일 (양력)</label>
                <input
                  type="date"
                  value={editBirthdate}
                  onChange={(e) => setEditBirthdate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">태어난 시간 (생시)</label>
                <input
                  type="time"
                  value={editBirthtime}
                  onChange={(e) => setEditBirthtime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    editGender === 'male'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    editGender === 'female'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-95 text-zinc-950 font-bold text-sm shadow-xl transition-all mt-4"
            >
              사주 원국 및 오행 리포트 생성하기 ✨
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { pillars, dayMaster, elements, yongsin, annual2026, specialStructures } = saju;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 text-left">
      {/* 1. 상단 인트로 배너 & 프로필 정보 바 */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1b1c22] via-[#14151a] to-[#101115] border border-amber-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <Compass size={13} className="text-amber-400" />
                DESTINY BLUEPRINT • 정통 명리학
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-mono">
                {saju.name}님의 사주 명식
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
              영혼의 설계도 <span className="text-amber-300">사주 만세력</span> 리포트
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl">
              생년월일시의 우주적 배치를 통해 타고난 본원(日干)과 5대 오행의 강약, 인생을 이끄는 대운 및 2026년 세운의 조화를 심층 분석합니다.
            </p>
          </div>

          {/* 컨트롤 버튼 그룹: 복사, TTS, 프로필 수정 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleTTS}
              className={`p-2.5 rounded-2xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
                isTTSActive
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/30 text-amber-300 hover:text-white'
              }`}
              title={isTTSActive ? '음성 멈추기' : '오늘의 사주 리포트 소리로 듣기'}
            >
              {isTTSActive ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="hidden sm:inline">{isTTSActive ? '음성 중지' : '소리로 듣기'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
              title="리포트 요약 클립보드 복사"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span className="hidden sm:inline">{copied ? '복사됨!' : '리포트 복사'}</span>
            </button>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="p-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 transition-all text-xs font-medium flex items-center gap-1.5"
            >
              <Edit3 size={15} />
              <span>{isEditingProfile ? '접기' : '사주 정보 수정'}</span>
            </button>
          </div>
        </div>

        {/* 프로필 요약 카드 바 */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-zinc-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-amber-400" />
            <span className="text-zinc-500">생년월일:</span>
            <span className="text-white font-bold">{saju.birthdate} (양력)</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" />
            <span className="text-zinc-500">생시:</span>
            <span className="text-white font-bold">{saju.birthtime || '시간 미지정'}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <User size={13} className="text-amber-400" />
            <span className="text-zinc-500">성별:</span>
            <span className="text-white font-bold">{saju.gender}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-amber-400" />
            <span className="text-zinc-500">본원 일주:</span>
            <span className="text-amber-300 font-bold">{pillars.day.gan}{pillars.day.zhi} ({pillars.day.ganKr}{pillars.day.zhiKr}일주)</span>
          </div>
        </div>

        {/* 프로필 인라인 수정 폼 */}
        <AnimatePresence>
          {isEditingProfile && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="mt-5 p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">성함</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">생년월일</label>
                  <input
                    type="date"
                    value={editBirthdate}
                    onChange={(e) => setEditBirthdate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">생시 (태어난 시간)</label>
                  <input
                    type="time"
                    value={editBirthtime}
                    onChange={(e) => setEditBirthtime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">성별</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#24262b] border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md"
                >
                  변경사항 적용 및 사주 재계산
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* 2. 오늘의 사주 & 일진(日辰) 리포트 배너 카드 */}
      {todayReport && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-950/30 via-[#1c1b22] to-[#121318] border-2 border-amber-500/40 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="relative z-10 space-y-4">
            {/* 헤더 행: 뱃지, 날짜, 오디오 컨트롤 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                    TODAY'S DESTINY • 오늘의 사주 리포트
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-xs font-mono font-semibold">
                    {todayReport.dateStr}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-white flex items-center gap-2 pt-0.5">
                  <span>오늘의 일진:</span>
                  <span className="text-amber-300">{todayReport.dayPillar.full}</span>
                </h3>
              </div>

              {/* 오디오 재생 버튼 */}
              <button
                onClick={handleToggleTTS}
                className={`px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold flex items-center gap-2 shadow-lg shrink-0 ${
                  isTTSActive
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border-amber-400/50 text-amber-200 hover:text-white'
                }`}
              >
                {isTTSActive ? (
                  <>
                    <VolumeX size={16} className="text-zinc-950" />
                    <span>음성 리포트 중지</span>
                    {/* 오디오 이퀄라이저 애니메이션 바 */}
                    <div className="flex items-end gap-0.5 h-3 ml-1">
                      <span className="w-1 bg-zinc-950 rounded-full animate-bounce [animation-delay:0ms] h-full" />
                      <span className="w-1 bg-zinc-950 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
                      <span className="w-1 bg-zinc-950 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
                    </div>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} className="text-amber-400" />
                    <span>오늘의 사주 소리로 듣기</span>
                  </>
                )}
              </button>
            </div>

            {/* 본문 요약 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* 1. 오늘의 십신 기운 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 font-mono">
                  <span>⚡</span> 오늘의 십신(十神) 작용
                </span>
                <p className="text-sm font-serif font-bold text-white">
                  {todayReport.todayTheme}
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {todayReport.todayAdvice}
                </p>
              </div>

              {/* 2. 내 사주 본원과의 조화 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1 font-mono">
                  <span>🌊</span> 오행 조화 & 에너지 흐름
                </span>
                <p className="text-sm font-serif font-bold text-white">
                  {saju.dayMaster.symbolName}와의 상호작용
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {todayReport.harmonySummary}
                </p>
              </div>

              {/* 3. 오늘의 3대 개운 팁 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                  <span>🌿</span> 오늘의 행운 보약 처방
                </span>
                <div className="space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">행운 컬러:</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-white/10">{todayReport.remedy.luckyColor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">추천 음식:</span>
                    <span className="font-bold text-white truncate max-w-[140px]">{todayReport.remedy.luckyFood}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">개운 팁:</span>
                    <span className="font-bold text-amber-300 truncate max-w-[140px]">{todayReport.remedy.actionTip}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 음성 재생 중 상태 알림 배너 */}
            {isTTSActive && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="font-medium">
                    🎙️ 루시가 오늘의 사주 만세력 리포트를 들려드리고 있습니다...
                  </span>
                </div>
                <button
                  onClick={stopTTS}
                  className="text-[11px] underline text-amber-300 hover:text-white shrink-0"
                >
                  멈추기
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* 3. 사주 4주 8자 만세력 원국표 (Four Pillars Matrix) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>사주 4주 8자 만세력 원국표</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 font-normal">
                  四柱原局
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                오른쪽에서 왼쪽으로 읽는 전통 만세력 (년주 ➔ 월주 ➔ 일주 ➔ 시주)
              </p>
            </div>
          </div>
        </div>

        {/* 4개 기둥 그리드 (시주, 일주, 월주, 년주) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* [1] 시주 (時柱) */}
          <div className={`rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between border transition-all ${
            pillars.hour
              ? 'bg-[#18191e]/90 border-white/10 hover:border-white/20'
              : 'bg-white/[0.02] border-dashed border-white/10'
          }`}>
            <div className="w-full text-center pb-2.5 border-b border-white/10">
              <span className="text-xs font-bold text-zinc-400 font-serif">시주 (時柱)</span>
              <p className="text-[10px] text-zinc-500 font-sans">말년운 • 자녀 • 내면의 꿈</p>
            </div>

            {pillars.hour ? (
              <div className="w-full py-4 space-y-4 text-center">
                {/* 천간 */}
                <div className="space-y-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    {pillars.hour.tenGodGan.name.split('(')[0]}
                  </span>
                  <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.hour.elGan].text}`}>
                    {pillars.hour.gan}
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {pillars.hour.ganKr} ({pillars.hour.yinYangGan}{pillars.hour.elGan})
                  </p>
                </div>

                <div className="w-8 h-px bg-white/10 mx-auto" />

                {/* 지지 */}
                <div className="space-y-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    {pillars.hour.tenGodZhi.name.split('(')[0]}
                  </span>
                  <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.hour.elZhi].text}`}>
                    {pillars.hour.zhi}
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {pillars.hour.zhiKr} ({pillars.hour.yinYangZhi}{pillars.hour.elZhi})
                  </p>
                </div>

                {/* 지장간 & 12운성 */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">지장간:</span>
                    <span className="text-zinc-300 font-serif">{(JIJANGAN_MAP[pillars.hour.zhi] || []).join(' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">12운성:</span>
                    <span className="text-amber-300 font-bold">{getTwelveStage(pillars.hour.zhi)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                <span>태어난 시간 미지정</span>
                <p className="text-[10px] text-zinc-600 mt-1">상단 수정에서 생시를 입력해 보세요</p>
              </div>
            )}
          </div>

          {/* [2] 일주 (日柱) — 본원 (가장 중요) */}
          <div className="rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between bg-gradient-to-b from-amber-500/15 via-[#1b1c22] to-[#16171b] border-2 border-amber-400/50 shadow-xl shadow-amber-500/10 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Star size={9} className="fill-zinc-950" />
                본원(Self)
              </span>
            </div>

            <div className="w-full text-center pb-2.5 border-b border-amber-500/20">
              <span className="text-xs font-bold text-amber-300 font-serif">일주 (日柱)</span>
              <p className="text-[10px] text-amber-200/60 font-sans">나 자신 • 배우자 • 중년운</p>
            </div>

            <div className="w-full py-4 space-y-4 text-center">
              {/* 천간 (일간/Day Master) */}
              <div className="space-y-1">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  일간(나의 영혼)
                </span>
                <div className={`text-4xl sm:text-5xl font-serif font-black ${ELEMENT_COLORS[pillars.day.elGan].text} drop-shadow-md`}>
                  {pillars.day.gan}
                </div>
                <p className="text-[11px] text-amber-300 font-bold font-mono">
                  {pillars.day.ganKr} ({pillars.day.yinYangGan}{pillars.day.elGan})
                </p>
              </div>

              <div className="w-8 h-px bg-amber-400/30 mx-auto" />

              {/* 지지 (일지) */}
              <div className="space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {pillars.day.tenGodZhi.name.split('(')[0]}
                </span>
                <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.day.elZhi].text}`}>
                  {pillars.day.zhi}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {pillars.day.zhiKr} ({pillars.day.yinYangZhi}{pillars.day.elZhi})
                </p>
              </div>

              {/* 지장간 & 12운성 */}
              <div className="pt-2 border-t border-amber-500/20 space-y-1 text-[10px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">지장간:</span>
                  <span className="text-amber-200 font-serif font-medium">{(JIJANGAN_MAP[pillars.day.zhi] || []).join(' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">12운성:</span>
                  <span className="text-amber-300 font-bold">{getTwelveStage(pillars.day.zhi)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* [3] 월주 (月柱) */}
          <div className="rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between bg-[#18191e]/90 border border-white/10 hover:border-white/20 transition-all">
            <div className="w-full text-center pb-2.5 border-b border-white/10">
              <span className="text-xs font-bold text-zinc-400 font-serif">월주 (月柱)</span>
              <p className="text-[10px] text-zinc-500 font-sans">사회운 • 직업 • 부모 형제</p>
            </div>

            <div className="w-full py-4 space-y-4 text-center">
              {/* 천간 */}
              <div className="space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {pillars.month.tenGodGan.name.split('(')[0]}
                </span>
                <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.month.elGan].text}`}>
                  {pillars.month.gan}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {pillars.month.ganKr} ({pillars.month.yinYangGan}{pillars.month.elGan})
                </p>
              </div>

              <div className="w-8 h-px bg-white/10 mx-auto" />

              {/* 지지 */}
              <div className="space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {pillars.month.tenGodZhi.name.split('(')[0]}
                </span>
                <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.month.elZhi].text}`}>
                  {pillars.month.zhi}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {pillars.month.zhiKr} ({pillars.month.yinYangZhi}{pillars.month.elZhi})
                </p>
              </div>

              {/* 지장간 & 12운성 */}
              <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">지장간:</span>
                  <span className="text-zinc-300 font-serif">{(JIJANGAN_MAP[pillars.month.zhi] || []).join(' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">12운성:</span>
                  <span className="text-amber-300 font-bold">{getTwelveStage(pillars.month.zhi)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* [4] 년주 (年柱) */}
          <div className="rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between bg-[#18191e]/90 border border-white/10 hover:border-white/20 transition-all">
            <div className="w-full text-center pb-2.5 border-b border-white/10">
              <span className="text-xs font-bold text-zinc-400 font-serif">년주 (年柱)</span>
              <p className="text-[10px] text-zinc-500 font-sans">조상덕 • 유년기 • {pillars.year.animal}띠</p>
            </div>

            <div className="w-full py-4 space-y-4 text-center">
              {/* 천간 */}
              <div className="space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {pillars.year.tenGodGan.name.split('(')[0]}
                </span>
                <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.year.elGan].text}`}>
                  {pillars.year.gan}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {pillars.year.ganKr} ({pillars.year.yinYangGan}{pillars.year.elGan})
                </p>
              </div>

              <div className="w-8 h-px bg-white/10 mx-auto" />

              {/* 지지 */}
              <div className="space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {pillars.year.tenGodZhi.name.split('(')[0]}
                </span>
                <div className={`text-3xl sm:text-4xl font-serif font-black ${ELEMENT_COLORS[pillars.year.elZhi].text}`}>
                  {pillars.year.zhi}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {pillars.year.zhiKr} ({pillars.year.yinYangZhi}{pillars.year.elZhi})
                </p>
              </div>

              {/* 지장간 & 12운성 */}
              <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">지장간:</span>
                  <span className="text-zinc-300 font-serif">{(JIJANGAN_MAP[pillars.year.zhi] || []).join(' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">12운성:</span>
                  <span className="text-amber-300 font-bold">{getTwelveStage(pillars.year.zhi)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 오행(木·火·土·金·水) 밸런스 & 맞춤 처방전 */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[#18191e]/95 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <TreePine size={16} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                오행(五行) 밸런스 & 에너지 분포
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                목·화·토·금·수 5대 원소의 상생과 상극 비율
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">
              중심 기운: <strong className="text-amber-300">{elements.dominant.name}</strong>
            </span>
            <span className="text-white/20">|</span>
            <span className="text-xs text-zinc-400 font-mono">
              결핍 기운: <strong className="text-sky-300">{elements.lacking.name}</strong>
            </span>
          </div>
        </div>

        {/* 5대 오행 프로그레스 바 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['목', '화', '토', '금', '수'] as const).map((el) => {
            const count = elements.counts[el];
            const pct = elements.percentages[el];
            const detail = ELEMENT_DETAILS[el];
            const isDominant = elements.dominant.element === el;
            const isLacking = elements.lacking.element === el;
            const ElIcon = ELEMENT_COLORS[el].icon;

            return (
              <div
                key={el}
                className={`p-4 rounded-2xl border transition-all ${
                  isDominant
                    ? 'bg-amber-500/10 border-amber-400/40 ring-1 ring-amber-500/30'
                    : isLacking
                    ? 'bg-sky-500/5 border-sky-400/20'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ElIcon size={14} className={ELEMENT_COLORS[el].text} />
                    <span className="font-serif font-bold text-sm text-white">{detail.hanja} ({el})</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${ELEMENT_COLORS[el].text}`}>
                    {count}개 ({pct}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(8, pct)}%`,
                      backgroundColor: ELEMENT_COLORS[el].hex,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-400">
                  <span>{detail.direction}</span>
                  {isDominant && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                      최대 과다
                    </span>
                  )}
                  {isLacking && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 font-bold">
                      보충 필요
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 오행 종합 요약 설명 */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300 leading-relaxed font-sans">
          💡 <strong className="text-amber-300 font-medium">오행 해석:</strong> {elements.summary}
        </div>

        {/* 결핍 오행 맞춤 개운 처방전 (Elemental Prescription) */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>결핍된 [{elements.lacking.name}] 기운을 채워줄 4대 개운 보약 처방</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. 색상 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block">🎨 개운 행운 색상</span>
              <p className="text-xs font-bold text-zinc-200">{ELEMENT_DETAILS[elements.lacking.element].colorName}</p>
              <p className="text-[11px] text-zinc-400 leading-tight">옷이나 소품, 인테리어 포인트로 착용</p>
            </div>

            {/* 2. 음식 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block">🍲 보양 추천 음식</span>
              <p className="text-xs font-bold text-zinc-200">{ELEMENT_DETAILS[elements.lacking.element].remedyFood}</p>
              <p className="text-[11px] text-zinc-400 leading-tight">몸속의 장기 기운을 순환시키는 식단</p>
            </div>

            {/* 3. 방위 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block">🧭 길한 방위</span>
              <p className="text-xs font-bold text-zinc-200">{ELEMENT_DETAILS[elements.lacking.element].direction}</p>
              <p className="text-[11px] text-zinc-400 leading-tight">책상 방향 또는 여행/산책 방향</p>
            </div>

            {/* 4. 활동 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block">🌿 일상 힐링 습관</span>
              <p className="text-xs font-bold text-zinc-200">{ELEMENT_DETAILS[elements.lacking.element].remedyActivity}</p>
              <p className="text-[11px] text-zinc-400 leading-tight">부족한 에너지를 채우는 신체 루틴</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 일간(본원) 심리 & 영적 아키타입 프로파일링 */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1d1b26] via-[#14151a] to-[#121318] border border-purple-500/20 shadow-2xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Star size={16} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-purple-200">
              {dayMaster.hanja}({dayMaster.korean}) 본원 영적 아키타입
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              {dayMaster.symbolName}
            </p>
          </div>
        </div>

        {/* 타이틀 및 키워드 */}
        <div className="space-y-3">
          <h4 className="text-lg sm:text-xl font-serif font-bold text-white">
            "{dayMaster.archetypeTitle}"
          </h4>

          <div className="flex flex-wrap gap-1.5">
            {dayMaster.coreKeywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-xs font-medium"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* 성향 및 사명 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <span>✨</span> 타고난 본원의 본질 (Essence)
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {dayMaster.personalityEssence}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <span>🧭</span> 영혼의 사명 (Spiritual Mission)
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {dayMaster.spiritualMission}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
              <span>💡</span> 마인드셋 & 번아웃 예방 조언
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {dayMaster.mindsetAdvice}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <span>🌿</span> 건강 & 웰니스 관리 포인트
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {dayMaster.wellnessFocus}
            </p>
          </div>
        </div>
      </div>

      {/* 5. 2026 병오년(丙午年) 세운(歲運)과의 조화 */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-950/20 via-[#191512] to-[#121316] border border-amber-500/30 shadow-2xl space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Sun size={16} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-200">
              {annual2026.yearName} 세운과의 조화
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              강렬한 불(火)의 기운과 내 사주 원국이 만났을 때 열리는 기회
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1">
          <span className="text-[11px] font-bold text-amber-300 font-mono">2026 핵심 세운 테마</span>
          <p className="text-sm sm:text-base font-serif font-bold text-white">
            {annual2026.theme}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-400/20 space-y-1.5">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <TrendingUp size={14} />
              올해 꼭 잡아야 할 기회의 문 (Opportunity)
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {annual2026.keyOpportunity}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-400/20 space-y-1.5">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
              <Shield size={14} />
              경계하고 조심해야 할 주의점 (Caution)
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {annual2026.caution}
            </p>
          </div>
        </div>
      </div>

      {/* 6. 핵심 신살 및 특수 격국 통찰 */}
      {specialStructures.length > 0 && (
        <div className="rounded-3xl p-6 sm:p-8 bg-[#18191e]/95 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Star size={16} className="text-yellow-400" />
            <h3 className="text-base font-serif font-bold text-white">
              보유 신살(神煞) 및 특수 격국 통찰
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {specialStructures.map((struct, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">{struct.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                    {struct.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{struct.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AI 명리 마스터 실시간 1:1 Q&A 상담 (인터랙티브 대화방) */}
      <div className="rounded-3xl overflow-hidden bg-[#18191c] border border-amber-400/30 shadow-2xl flex flex-col backdrop-blur-xl">
        {/* 헤더 */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#212328] via-[#1d1e22] to-[#212328] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-lg">
                📜✨
              </div>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>명리 AI 마스터 심층 상담실</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-medium">
                  실시간 질의응답
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                내 사주 원국과 오행 밸런스를 바탕으로 무엇이든 질문해 보세요
              </p>
            </div>
          </div>

          {onConsult && (
            <button
              onClick={() => onConsult(`내 사주 만세력 원국(${saju.dayMaster.hanja} ${saju.dayMaster.symbolName})을 바탕으로 심층 상담을 나누고 싶어!`)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>루시 1:1 상담실 연결</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* 답변 내역 영역 */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[420px] min-h-[160px] overflow-y-auto bg-gradient-to-b from-[#18191c] to-[#121316]">
          {aiAnswers.length === 0 && !isAiLoading ? (
            <div className="text-center py-8 space-y-2 text-zinc-500">
              <HelpCircle size={28} className="mx-auto text-zinc-600" />
              <p className="text-xs sm:text-sm">
                사주 원국에 대해 궁금한 점을 아래 추천 질문이나 입력창을 통해 물어보세요.
              </p>
              <p className="text-[11px] text-zinc-600">
                직업 적성, 재물운, 연애운, 2026년 흐름 등 무엇이든 명쾌하게 풀어드립니다.
              </p>
            </div>
          ) : (
            aiAnswers.map((item, idx) => (
              <div key={idx} className="space-y-3 pb-3 border-b border-white/5 last:border-b-0">
                {/* 유저 질문 */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[#FEE500] text-zinc-950 text-xs sm:text-sm font-medium shadow-md">
                    {item.q}
                  </div>
                </div>

                {/* AI 명리 마스터 답변 */}
                <div className="flex justify-start items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xs shrink-0 mt-1">
                    📜
                  </div>
                  <div className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-sm bg-[#24262b] border border-white/10 text-xs sm:text-sm text-zinc-100 leading-relaxed shadow-md">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[10px] text-amber-300/80 font-bold">
                      <span>명리 마스터 루시</span>
                      <span className="text-zinc-500 font-mono">{item.time}</span>
                    </div>
                    <p className="whitespace-pre-line break-words">{item.a}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isAiLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-300 py-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>사주 원국과 오행 흐름을 종합하여 통찰을 정리하고 있습니다...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 퀵 추천 질문 칩 */}
        <div className="px-4 py-2.5 bg-[#1f2126] border-t border-white/10 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-amber-400 font-bold shrink-0 flex items-center gap-1 pl-1">
            <span>💡</span> 추천 질문:
          </span>
          {QUICK_QUESTIONS.map((qText, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAI(qText)}
              disabled={isAiLoading}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-yellow-400/20 active:scale-95 border border-white/15 hover:border-yellow-400/40 text-[11px] sm:text-xs text-zinc-200 hover:text-yellow-200 transition-all font-medium whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {qText}
            </button>
          ))}
        </div>

        {/* 질문 폼 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI();
          }}
          className="p-3 sm:p-4 bg-[#18191c] border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={isAiLoading}
            placeholder="내 사주 원국에 대해 궁금한 점을 적어보세요 (예: 올해 이직이나 시험운은?)"
            className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.07] border border-white/15 focus:border-yellow-400/60 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!questionInput.trim() || isAiLoading}
            className="w-11 h-11 rounded-2xl bg-[#FEE500] hover:bg-yellow-400 active:scale-95 text-zinc-950 font-bold flex items-center justify-center transition-all shadow-md disabled:opacity-40 shrink-0"
            title="질문 전송"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
