import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  MessageCircle,
  Plus,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { loadAllPermanentMemories, DailyMemoryEntry } from '@/lib/chatMemoryArchive';
import { loadSavedChatInsights } from '@/lib/chatInsightsEngine';
import { cleanUserMessageDisplay } from '@/utils/cleanMessage';

interface LucyChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onContinueChat?: () => void;
}

export function LucyChatHistoryModal({
  isOpen,
  onClose,
  onNewChat,
  onContinueChat,
}: LucyChatHistoryModalProps) {
  const { personaMessages, sharedState, firebaseUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // User display name
  const userDisplayName = useMemo(() => {
    return (
      sharedState?.userProfile?.basic?.nickname ||
      sharedState?.userProfile?.basic?.name ||
      firebaseUser?.displayName ||
      '제제'
    );
  }, [sharedState?.userProfile, firebaseUser?.displayName]);

  // Current active session analysis
  const currentSession = useMemo(() => {
    const list = Array.isArray(personaMessages?.lucy) ? personaMessages.lucy : [];
    const userMsgs = list.filter((m) => m.role === 'user' && m.content);
    if (userMsgs.length === 0) return null;

    const lastMsg = list[list.length - 1];
    const lastUserMsg = [...userMsgs].reverse()[0];
    const lastUserText = typeof lastUserMsg.content === 'string'
      ? cleanUserMessageDisplay(lastUserMsg.content)
      : Array.isArray(lastUserMsg.content)
      ? cleanUserMessageDisplay(lastUserMsg.content.find((c: any) => c.type === 'text')?.text || '')
      : '진행 중인 대화';

    return {
      messageCount: list.length,
      userQueryCount: userMsgs.length,
      lastText: lastUserText,
      timestamp: lastMsg?.timestamp || Date.now(),
    };
  }, [personaMessages?.lucy]);

  // Permanent daily memories from local storage
  const pastMemories = useMemo(() => {
    return loadAllPermanentMemories();
  }, [isOpen]);

  // Filtered past memories by search query
  const filteredMemories = useMemo(() => {
    if (!searchQuery.trim()) return pastMemories;
    const query = searchQuery.toLowerCase().trim();
    return pastMemories.filter((m) => {
      return (
        m.date.includes(query) ||
        m.summary.toLowerCase().includes(query) ||
        m.userTopics.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [pastMemories, searchQuery]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0b0f19]/90 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.03]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0 ring-2 ring-amber-400/40">
                <Sparkles size={20} className="text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                    Lucy ai 대화 기록 보관함
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Soul Memory
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {userDisplayName} 님과 루시가 함께 나눈 소중한 영혼 대화 세션 아카이브입니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* New Chat Primary Action Button */}
              {onNewChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewChat();
                  }}
                  className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  title="새로운 대화 시작"
                >
                  <Plus size={15} />
                  <span>새 대화</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search Bar & Action Filter Tabs */}
          <div className="px-5 sm:px-7 py-3 border-b border-white/10 bg-white/[0.015] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="지난 대화 키워드 검색 (주제, 날짜, 질문 내용)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 focus:border-amber-400/60 focus:bg-white/[0.1] text-xs text-white placeholder-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Direct Continue Chat Button */}
            {currentSession && onContinueChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueChat();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <MessageCircle size={14} />
                <span>현재 대화 이어가기</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Main Scrollable Sessions List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 select-text">
            {/* 1. Current Active Session Highlight Card */}
            {currentSession && !searchQuery && (
              <div className="relative group">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-400/40 shadow-lg relative overflow-hidden backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-black text-emerald-300 tracking-wide uppercase">
                        현재 진행 중인 대화 세션
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (질문 {currentSession.userQueryCount}회 · 메시지 {currentSession.messageCount}개)
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(currentSession.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 leading-relaxed mb-3">
                    "{currentSession.lastText}"
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onContinueChat) onContinueChat();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>대화 이어가기</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Past Daily Sessions Header */}
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" />
                <span>영구 보존된 날짜별 대화 기록 (Soul Memory)</span>
                <span className="text-[10px] text-slate-500 font-normal">({filteredMemories.length}개)</span>
              </h3>
            </div>

            {/* If empty */}
            {filteredMemories.length === 0 && !currentSession && (
              <div className="text-center py-12 px-4 space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare size={22} />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  {searchQuery ? '검색된 대화 기록이 없습니다.' : '아직 보존된 과거 대화 기록이 없습니다.'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Lucy ai와 나누는 질문과 인사이트는 매일 영구 기억(Soul Memory)에 자동으로 요약 보존됩니다.
                </p>
                {onNewChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNewChat();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    첫 대화 시작하기
                  </button>
                )}
              </div>
            )}

            {/* List of past memories */}
            {filteredMemories.map((entry, index) => (
              <motion.div
                key={entry.date || index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 transition-all group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold text-[11px]">
                      {entry.date}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      총 {entry.dialogueCount}회 대화
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onContinueChat) onContinueChat();
                    }}
                    className="text-[11px] text-slate-400 group-hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>대화창 열기</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Topics Hashtags */}
                {entry.userTopics && entry.userTopics.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {entry.userTopics.slice(0, 4).map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10 truncate max-w-[220px]"
                      >
                        #{topic}
                      </span>
                    ))}
                    {entry.userTopics.length > 4 && (
                      <span className="text-[10px] text-slate-500">
                        +{entry.userTopics.length - 4}개 더보기
                      </span>
                    )}
                  </div>
                )}

                {/* Summary Snippet */}
                <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
                  {entry.summary}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer Navigation Tip */}
          <div className="px-5 sm:px-7 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>영구 기억(Soul Memory)은 루시의 배경 지식으로 상시 유지됩니다.</span>
            </span>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onContinueChat) onContinueChat();
              }}
              className="text-white hover:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              대화창으로 바로 가기 →
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
