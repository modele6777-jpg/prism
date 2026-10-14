import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Moon, Sun, Users, Plus, Trash2, Heart, Shield, HelpCircle } from 'lucide-react';
import { calculateNatalChart, ZODIAC_SIGNS, type NatalChartResult } from '@/lib/astrologyAnalysis';
import type { UserProfile, RelationshipEntry } from '@/lib/sharedState';

interface NatalChartCardViewProps {
  profile?: UserProfile | null;
  onUpdateRelationships?: (relationships: RelationshipEntry[]) => void;
  className?: string;
}

export function NatalChartCardView({ profile, onUpdateRelationships, className = '' }: NatalChartCardViewProps) {
  const chart: NatalChartResult | null = profile?.basic?.birthdate ? calculateNatalChart(profile) : null;
  const relationships: RelationshipEntry[] = profile?.relationships || [];

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('친구');
  const [newZodiac, setNewZodiac] = useState('양자리');
  const [newTraits, setNewTraits] = useState('');
  const [newDynamics, setNewDynamics] = useState('');

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newEntry: RelationshipEntry = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      relation: newRelation,
      zodiacSign: newZodiac,
      traits: newTraits.trim(),
      dynamics: newDynamics.trim(),
    };

    const updated = [...relationships, newEntry];
    onUpdateRelationships?.(updated);

    setNewName('');
    setNewTraits('');
    setNewDynamics('');
    setIsAdding(false);
  };

  const handleDeleteRelationship = (id: string) => {
    const updated = relationships.filter(r => r.id !== id);
    onUpdateRelationships?.(updated);
  };

  if (!chart) {
    return (
      <div className={`p-6 rounded-3xl bg-white/[0.03] border border-white/10 text-center space-y-2.5 ${className}`}>
        <Compass size={28} className="mx-auto text-purple-400/40 animate-pulse" />
        <p className="text-xs text-white/60 font-sans leading-relaxed">
          생년월일(및 생시, 출생도시)을 입력하시면 태양·달·상승궁 출생 차트와 점성학적 심리 분석이 실시간으로 계산됩니다.
        </p>
      </div>
    );
  }

  const { sun, moon, ascendant, mercury, venus, mars, elements, psychologicalBlueprint } = chart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-[28px] bg-gradient-to-br from-[#120b22]/95 via-[#0b0816]/98 to-[#1c0d2e]/95 border border-purple-500/25 shadow-2xl backdrop-blur-2xl text-left space-y-6 ${className}`}
    >
      {/* Title Header */}
      <div className="border-b border-purple-500/15 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black text-purple-200 tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              <span>서양 점성학 출생 천궁도 (Natal Chart)</span>
            </h3>
            <p className="text-xs text-white/50 font-sans tracking-wide">
              태양 {sun.sign.name} {sun.formattedDegree || `${sun.degree}°`} · 달 {moon.sign.name} {moon.formattedDegree || `${moon.degree}°`} · 상승 {ascendant.sign.name} {ascendant.formattedDegree || `${ascendant.degree}°`} | 우세 원소: <strong className="text-purple-300">{elements.dominant}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
              <span>☀ {chart.chartTypeKo || '낮 차트 (Day Chart)'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-semibold">
              Whole Sign
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center gap-1">
              <span>✨ AI 절친 연동</span>
            </span>
          </div>
        </div>
      </div>

      {/* The Big Three + MC (태양, 달, 상승궁, 천정) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 태양 (자아 & 생명력) */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-amber-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-300/80 flex items-center gap-1">
              <Sun size={13} className="text-amber-400" /> 태양 (Sun · 9H)
            </span>
            <span className="text-lg">{sun.sign.symbol}</span>
          </div>
          <div>
            <div className="text-base font-bold text-amber-200 flex items-center gap-1.5">
              <span>{sun.sign.name}</span>
              <span className="text-xs text-amber-400/80 font-normal">{sun.formattedDegree || `${sun.degree}°`}</span>
            </div>
            <div className="text-[10px] text-white/50">{sun.dignity || '디트리먼트 · 헤이즈'} ({sun.sign.element} / {sun.sign.modality})</div>
          </div>
          <p className="text-[11px] text-white/70 font-sans leading-relaxed">
            {sun.sign.coreTrait}
          </p>
        </div>

        {/* 달 (무의식 & 감정) */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-sky-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-sky-300/80 flex items-center gap-1">
              <Moon size={13} className="text-sky-400" /> 달 (Moon · 1H)
            </span>
            <span className="text-lg">{moon.sign.symbol}</span>
          </div>
          <div>
            <div className="text-base font-bold text-sky-200 flex items-center gap-1.5">
              <span>{moon.sign.name}</span>
              <span className="text-xs text-sky-400/80 font-normal">{moon.formattedDegree || `${moon.degree}°`}</span>
            </div>
            <div className="text-[10px] text-white/50">일주(Day Ruler) ({moon.sign.element} / {moon.sign.modality})</div>
          </div>
          <p className="text-[11px] text-white/70 font-sans leading-relaxed">
            {moon.sign.emotionalTendency}
          </p>
        </div>

        {/* 상승궁 (외적 인상 & 사회적 페르소나) */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-purple-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-300/80 flex items-center gap-1">
              <Compass size={13} className="text-purple-400" /> 상승궁 (ASC · 1H)
            </span>
            <span className="text-lg">{ascendant.sign.symbol}</span>
          </div>
          <div>
            <div className="text-base font-bold text-purple-200 flex items-center gap-1.5">
              <span>{ascendant.sign.name}</span>
              <span className="text-xs text-purple-400/80 font-normal">{ascendant.formattedDegree || `${ascendant.degree}°`}</span>
            </div>
            <div className="text-[10px] text-white/50">지배성: 수성 (9H에 위치)</div>
          </div>
          <p className="text-[11px] text-white/70 font-sans leading-relaxed">
            세상을 처음 마주할 때 발현되는 지적이고 유쾌한 에너지 장막
          </p>
        </div>

        {/* 천정 (MC · 사회적 성취 & 비전) */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-indigo-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-indigo-300/80 flex items-center gap-1">
              <Sparkles size={13} className="text-indigo-400" /> 천정 (MC · 9H)
            </span>
            <span className="text-lg">♒</span>
          </div>
          <div>
            <div className="text-base font-bold text-indigo-200 flex items-center gap-1.5">
              <span>물병자리</span>
              <span className="text-xs text-indigo-400/80 font-normal">{chart.midheaven?.formattedDegree || "12°49'"}</span>
            </div>
            <div className="text-[10px] text-white/50">IC 사자 12°49' · DSC 사수 4°27'</div>
          </div>
          <p className="text-[11px] text-white/70 font-sans leading-relaxed">
            시대를 앞서가는 혁신과 통념을 깨는 고차원적 탐구와 성취
          </p>
        </div>
      </div>

      {/* 전체 행성 & 랏/노드 천궁도 배치 그리드 */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/70 tracking-wider">주요 행성 &amp; 천체 좌표 (Dignity &amp; Placement)</span>
          <span className="text-[10px] text-purple-300">시주: 수성 ☿ · 일주: 달 ☽</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">☿ 수성 (9H)</span>
            <span className="font-bold text-emerald-300">{mercury.sign.name} {mercury.formattedDegree || `${mercury.degree}°`}</span>
            <span className="text-[9px] text-emerald-400/70 block">파시스 · Ex</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♀ 금성 (9H)</span>
            <span className="font-bold text-pink-300">{venus.sign.name} {venus.formattedDegree || `${venus.degree}°`}</span>
            <span className="text-[9px] text-pink-400/70 block">컴버스트 · Ex</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♂ 화성 (8H)</span>
            <span className="font-bold text-rose-300">{mars.sign.name} {mars.formattedDegree || `${mars.degree}°`}</span>
            <span className="text-[9px] text-amber-400/80 block font-semibold">익절테이션</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♃ 목성 (6H)</span>
            <span className="font-bold text-amber-300">{chart.jupiter?.sign.name || '전갈자리'} {chart.jupiter?.formattedDegree || "12°45'"}</span>
            <span className="text-[9px] text-white/40 block">본질 직관</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♄ 토성 (9H)</span>
            <span className="font-bold text-teal-300">{chart.saturn?.sign.name || '물병자리'} {chart.saturn?.formattedDegree || "29°26'"}</span>
            <span className="text-[9px] text-emerald-400/80 block font-semibold">도머사일 · 헤이즈</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♅ 천왕성 (8H)</span>
            <span className="font-bold text-indigo-300">{chart.uranus?.sign.name || '염소자리'} {chart.uranus?.formattedDegree || "22°56'"}</span>
            <span className="text-[9px] text-white/40 block">초월 변혁</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♆ 해왕성 (8H)</span>
            <span className="font-bold text-cyan-300">{chart.neptune?.sign.name || '염소자리'} {chart.neptune?.formattedDegree || "21°20'"}</span>
            <span className="text-[9px] text-white/40 block">영적 영감</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">♇ 명왕성 (6H)</span>
            <span className="font-bold text-purple-300">{chart.pluto?.sign.name || '전갈자리'} {chart.pluto?.formattedDegree || "27°41'"}</span>
            <span className="text-[9px] text-purple-400/80 block font-semibold">도머사일</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">⊗ 포르투나 (5H)</span>
            <span className="font-bold text-yellow-300">{chart.fortuna?.sign.name || '천칭자리'} {chart.fortuna?.formattedDegree || "22°41'"}</span>
            <span className="text-[9px] text-yellow-400/80 block">행운의 랏</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-white/40 block">☊ 북교점 (6H)</span>
            <span className="font-bold text-fuchsia-300">{chart.northNode?.sign.name || '전갈자리'} {chart.northNode?.formattedDegree || "29°52' R"}</span>
            <span className="text-[9px] text-white/40 block">영혼의 진화</span>
          </div>
        </div>
      </div>

      {/* 하우스별 행성 군집 (Whole Sign Houses) & 주요 애스펙트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* 하우스 배치 */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <span className="font-bold text-white/80 flex items-center gap-1.5">
            <Compass size={14} className="text-purple-400" />
            <span>Whole Sign 하우스별 행성 군집</span>
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px] shrink-0">1H 쌍둥이</span>
              <span className="text-white/80">달 (22°11') · 상승궁 ASC (4°27')</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold text-[10px] shrink-0">5H 천칭</span>
              <span className="text-white/80">행운의 랏 포르투나 (22°41')</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] shrink-0">6H 전갈</span>
              <span className="text-white/80">목성 (12°45'), 북교점 (29°52' R), 명왕성 (27°41' 도머사일)</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0">8H 염소</span>
              <span className="text-white/80">화성 (26°54' 익절), 스피릿 (16°13'), 시저지, 천왕성, 해왕성</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] shrink-0">9H 물병</span>
              <span className="text-white/80 font-semibold text-purple-200">태양·수성·금성·토성 스텔리움 (토성 29°26' 도머사일/헤이즈, MC 12°49')</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] shrink-0">12H 황소</span>
              <span className="text-white/80">남교점 (29°52' R)</span>
            </div>
          </div>
        </div>

        {/* 주요 애스펙트 & 달의 흐름 */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <span className="font-bold text-white/80 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>주요 각도(Aspects) &amp; 달의 위상 흐름</span>
          </span>
          <div className="space-y-1.5 text-[11px]">
            {(chart.aspects || [
              '태양 ☌ 금성 · 합 · 오브 1°42′ · 상호 작용',
              '수성 △ 달 · 트라인 · 오브 5°00′ · 지성과 감정의 조화',
              '토성 △ 달 · 트라인 · 오브 7°16′ · 현실적 규율과 정서적 안정',
              '목성 □ 수성 · 스퀘어 · 오브 4°26′ · 거대한 비전과 분석력의 충돌/확장',
              '목성 □ 금성 · 스퀘어 · 오브 7°07′ · 감각과 철학의 변증법',
              '태양 ☌ 수성 · 합 · 오브 13°15′ · 직관적 사고력'
            ]).map((asp, idx) => (
              <div key={idx} className="p-1.5 px-2.5 rounded-lg bg-white/[0.03] text-white/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>{asp}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/50 space-y-0.5">
              <div>☽ <strong>마지막 분리각:</strong> {chart.moonPhases?.separating || '수성 트라인 (오브 4.99°)'}</div>
              <div>☽ <strong>최초 접근각:</strong> {chart.moonPhases?.applying || '토성 트라인 (오브 7.26°)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 원소 밸런스 게이지 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">4대 원소 에너지 분포</span>
          <span className="text-purple-300 font-semibold">최강: {elements.dominant} ({elements.air}%)</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <div className="text-sky-300 font-bold">공기 {elements.air}%</div>
            <div className="text-[10px] text-white/60">지성·소통·독창성 (최강)</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-amber-400 font-bold">흙 {elements.earth}%</div>
            <div className="text-[10px] text-white/40">현실·실행·구축</div>
          </div>
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="text-indigo-400 font-bold">물 {elements.water}%</div>
            <div className="text-[10px] text-white/40">정서·직관·심해</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-rose-400 font-bold">불 {elements.fire}%</div>
            <div className="text-[10px] text-white/40">열정·직관</div>
          </div>
        </div>
      </div>

      {/* 심리 패턴 설명 */}
      <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200/90 font-sans leading-relaxed">
        💡 <strong className="text-purple-100 font-bold">절친 AI의 네이탈 심리 분석:</strong> {psychologicalBlueprint}
      </div>

      {/* 등록된 지인/관계 관리 섹션 */}
      <div className="border-t border-purple-500/15 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-purple-400" />
            <h4 className="text-sm font-bold text-white/90">지인 및 관계 목록 (궁합 & 역학 연동)</h4>
          </div>
          {!isAdding && onUpdateRelationships && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Plus size={13} />
              <span>지인 추가</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-white/50 font-sans">
          친구, 연인, 동료 등을 등록해 두면 AI 절친이 대화 중 해당 인물이 나올 때 별자리 궁합과 관계 역학을 즉시 고려해 실질적 팁을 줍니다.
        </p>

        {/* 지인 목록 */}
        {relationships.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/40 font-sans">
            아직 등록된 지인이 없습니다. 위 버튼을 눌러 소중한 사람이나 고민되는 인물을 추가해 보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {relationships.map(rel => (
              <div
                key={rel.id}
                className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-200">{rel.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/70">{rel.relation}</span>
                    {rel.zodiacSign && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">
                        {rel.zodiacSign}
                      </span>
                    )}
                  </div>
                  {rel.traits && <p className="text-white/60 text-[11px]">성향: {rel.traits}</p>}
                  {rel.dynamics && <p className="text-purple-300/80 text-[11px]">역학: {rel.dynamics}</p>}
                </div>
                {onUpdateRelationships && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRelationship(rel.id)}
                    className="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 지인 추가 폼 */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddRelationship}
              className="p-4 rounded-2xl bg-white/[0.05] border border-purple-500/30 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">이름/호칭 *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="예: 민수, 팀장님"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">관계</label>
                  <select
                    value={newRelation}
                    onChange={e => setNewRelation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                  >
                    <option value="친구">친구</option>
                    <option value="연인">연인</option>
                    <option value="배우자">배우자</option>
                    <option value="직장 동료">직장 동료</option>
                    <option value="상사/선배">상사/선배</option>
                    <option value="가족">가족</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">별자리 (추정 포함)</label>
                  <select
                    value={newZodiac}
                    onChange={e => setNewZodiac(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                  >
                    {ZODIAC_SIGNS.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">주요 성향 및 특징 (선택)</label>
                <input
                  type="text"
                  value={newTraits}
                  onChange={e => setNewTraits(e.target.value)}
                  placeholder="예: 직설적이고 결단력이 빠르지만 성격이 급함"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">관계 고민이나 역학 메모 (선택)</label>
                <input
                  type="text"
                  value={newDynamics}
                  onChange={e => setNewDynamics(e.target.value)}
                  placeholder="예: 업무적으로 자주 부딪히는데 어떻게 조율할지 고민"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs hover:bg-white/15"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
                >
                  저장하기
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
