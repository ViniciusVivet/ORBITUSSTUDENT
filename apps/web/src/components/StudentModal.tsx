'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { useStudentModal } from '@/hooks/useStudentModal';
import { OverviewTab } from '@/components/student-modal/OverviewTab';
import { AddLessonTab } from '@/components/student-modal/AddLessonTab';
import { BlockersTab } from '@/components/student-modal/BlockersTab';
import { GoalsTab } from '@/components/student-modal/GoalsTab';
import { useState } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Tab = 'overview' | 'lesson' | 'blockers' | 'goals';

interface Props {
  studentId: string;
  studentPreview: StudentListItem;
  onClose: () => void;
}

export function StudentModal({ studentId, studentPreview, onClose }: Props) {
  const { summary, loading, topics, blockers, goals, toast, showToast, reload, addTopic } = useStudentModal(studentId, studentPreview);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const el = modalRef.current;
    if (!el || loading) return;
    const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables[0]?.focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [loading, activeTab]);

  const s = summary?.student ?? studentPreview;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'lesson', label: '+ Aula' },
    { id: 'blockers', label: 'Bloqueios', count: blockers.filter((b) => b.status === 'active').length },
    { id: 'goals', label: 'Metas', count: goals.filter((g) => g.status !== 'completed').length },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-orbitus-border bg-orbitus-card shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toast */}
          {toast && (
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-lg border border-green-500/40 bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 shadow-lg" role="status">
              {toast}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-orbitus-border p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orbitus-accent/30 to-purple-900/40 text-2xl ring-2 ring-orbitus-border">
              {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="truncate font-bold text-white">{s.displayName}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="badge-level">Nv {s.level}</span>
                <span className="badge-xp">{s.xp} XP</span>
                {s.classGroup?.name && (
                  <span className="text-xs text-gray-500">{s.classGroup.name}</span>
                )}
                {(s.attentionHints?.activeBlockersCount ?? 0) > 0 && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400 ring-1 ring-red-500/30">
                    {s.attentionHints!.activeBlockersCount} bloqueio{s.attentionHints!.activeBlockersCount !== 1 ? 's' : ''}
                  </span>
                )}
                {s.attentionHints?.daysSinceLastLesson === null && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400 ring-1 ring-amber-500/30">sem aula</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orbitus-border hover:text-white"
              aria-label="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-orbitus-border bg-orbitus-surface/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'text-orbitus-accent-bright' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${tab.id === 'blockers' ? 'bg-red-500/20 text-red-400' : 'bg-orbitus-accent/20 text-orbitus-accent-bright'}`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute inset-x-0 bottom-0 h-0.5 bg-orbitus-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-orbitus-border" />
                <div className="h-20 animate-pulse rounded-lg bg-orbitus-border/60" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-orbitus-border" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && summary && (
                  <OverviewTab
                    summary={summary}
                    studentId={studentId}
                    onNavigateToLesson={() => setActiveTab('lesson')}
                    onClose={onClose}
                  />
                )}
                {activeTab === 'lesson' && (
                  <AddLessonTab
                    studentId={studentId}
                    topics={topics}
                    onSuccess={() => { void reload(); setActiveTab('overview'); }}
                    showToast={showToast}
                    onTopicCreated={addTopic}
                  />
                )}
                {activeTab === 'blockers' && (
                  <BlockersTab
                    studentId={studentId}
                    blockers={blockers}
                    onUpdate={() => void reload()}
                    showToast={showToast}
                  />
                )}
                {activeTab === 'goals' && (
                  <GoalsTab
                    studentId={studentId}
                    goals={goals}
                    onUpdate={() => void reload()}
                    showToast={showToast}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
