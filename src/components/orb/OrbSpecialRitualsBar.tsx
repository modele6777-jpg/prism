import React from 'react';
import { Zap, Sparkles, Flame } from 'lucide-react';

export type OrbSpecialRitualType = 'quantum' | 'aura' | 'rune' | 'void_nebula';

interface OrbSpecialRitualsBarProps {
  onSelectRitual: (type: OrbSpecialRitualType) => void;
  className?: string;
}

export function OrbSpecialRitualsBar({
  onSelectRitual,
  className = '',
}: OrbSpecialRitualsBarProps) {
  const rituals = [
    {
      id: 'quantum' as OrbSpecialRitualType,
      title: '양자 결단',
      sub: 'Yes / No',
      icon: <Zap size={14} className="text-cyan-300" />,
      colorClass: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-200 hover:border-cyan-400',
    },
    {
      id: 'aura' as OrbSpecialRitualType,
      title: '소울 오라',
      sub: '주파수 스캔',
      icon: <Sparkles size={14} className="text-emerald-300" />,
      colorClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-200 hover:border-emerald-400',
    },
    {
      id: 'rune' as OrbSpecialRitualType,
      title: '룬 캐스팅',
      sub: '고대 신탁',
      icon: <span className="font-serif font-black text-sm text-purple-300 leading-none">ᛟ</span>,
      colorClass: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-200 hover:border-purple-400',
    },
    {
      id: 'void_nebula' as OrbSpecialRitualType,
      title: '고민·소원',
      sub: '소멸 & 방출',
      icon: <Flame size={14} className="text-amber-300" />,
      colorClass: 'from-amber-500/20 to-rose-500/10 border-amber-500/30 text-amber-200 hover:border-amber-400',
    },
  ];

  return (
    <div className={`w-full max-w-lg flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          오브 4대 특수 신탁 의식 (Rituals)
        </span>
        <span className="text-[10px] text-slate-500">터치하여 의식 시작</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {rituals.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelectRitual(r.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b border backdrop-blur-md transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-sm cursor-pointer ${r.colorClass}`}
          >
            <div className="mb-1 flex items-center justify-center w-6 h-6 rounded-xl bg-white/5">
              {r.icon}
            </div>
            <span className="text-[11px] font-black text-white leading-tight">{r.title}</span>
            <span className="text-[9px] text-slate-400 leading-tight mt-0.5 whitespace-nowrap">{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
