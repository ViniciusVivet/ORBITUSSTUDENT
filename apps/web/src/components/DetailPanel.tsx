'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { StudentListItem, StudentSummary } from '@orbitus/shared';
import { fetchStudentSummary } from '@/lib/api/students';
import { QuickLessonForm } from '@/components/roster/QuickLessonForm';
import { AnimatePresence } from 'framer-motion';

interface Props {
  studentId: string;
  studentPreview: StudentListItem;
  planetColor: { primary: string; glow: string; ring: string; bg: string };
  onClose: () => void;
}

function SkeletonLine({ w }: { w: string }) {
  return <div className={`h-3 animate-pulse rounded bg-[#1a2040] ${w}`} />;
}

export function DetailPanel({ studentId, studentPreview, planetColor, onClose }: Props) {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickLessonOpen, setQuickLessonOpen] = useState(false);

  const s = summary?.student ?? studentPreview;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentSummary(studentId);
      setSummary(data);
    } catch {
      // fallback to preview data — summary stays null
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const lastLesson = summary?.lastLessons?.[0];
  const activeBlockersCount = summary?.activeBlockersCount ?? s.attentionHints?.activeBlockersCount ?? 0;
  const activeGoalsCount = summary?.activeGoalsCount ?? 0;

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 h-full w-full sm:w-[320px] md:w-[360px] flex flex-col bg-[#111527]/98 backdrop-blur-xl border-l border-[#1a2040] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Painel de ${s.displayName}`}
      >
        {/* Header */}
        <div
          className="shrink-0 p-4 border-b border-[#1a2040]"
          style={{ background: planetColor.bg }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${planetColor.primary}40, #111527 70%)`,
                boxShadow: `0 0 0 2px ${planetColor.ring}60, 0 4px 20px ${planetColor.glow}`,
              }}
            >
              {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🚀'}
              {/* Level */}
              <div
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black ring-2 ring-[#111527]"
                style={{ background: planetColor.primary }}
              >
                {s.level ?? 1}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-white truncate">{s.displayName}</h2>
              <p className="text-xs text-gray-400 truncate">{s.classGroup?.name ?? 'Sem turma'}</p>
              {/* Quick stats chips */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: planetColor.bg, color: planetColor.primary, border: `1px solid ${planetColor.ring}40` }}
                >
                  {s.xp ?? 0} XP
                </span>
                {activeBlockersCount > 0 && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/30">
                    {activeBlockersCount} bloqueio{activeBlockersCount !== 1 ? 's' : ''}
                  </span>
                )}
                {activeGoalsCount > 0 && (
                  <span className="rounded-full bg-orbitus-accent/15 px-2 py-0.5 text-[10px] font-semibold text-orbitus-accent-bright ring-1 ring-orbitus-accent/30">
                    {activeGoalsCount} meta{activeGoalsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-[#1a2040] transition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <SkeletonLine w="w-3/4" />
              <SkeletonLine w="w-1/2" />
              <div className="h-16 animate-pulse rounded-lg bg-[#1a2040]/60" />
              <SkeletonLine w="w-2/3" />
              <SkeletonLine w="w-1/2" />
            </div>
          ) : (
            <>
              {/* Last lesson */}
              <section>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Última aula</p>
                {lastLesson ? (
                  <div className="rounded-lg border border-[#1a2040] bg-[#141832] px-3 py-2 text-xs text-gray-300">
                    <p className="font-medium text-gray-200">{lastLesson.topicName || 'Sem tópico'}</p>
                    <p className="text-gray-500 mt-0.5">
                      {new Date(lastLesson.heldAt).toLocaleDateString('pt-BR')} · {lastLesson.rating}★ · +{lastLesson.xpEarned} XP
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic">Nenhuma aula registrada</p>
                )}
              </section>

              {/* Quick lesson inline form */}
              <AnimatePresence>
                {quickLessonOpen && (
                  <QuickLessonForm
                    studentId={studentId}
                    onClose={() => { setQuickLessonOpen(false); void load(); }}
                  />
                )}
              </AnimatePresence>

              {/* Blockers */}
              {activeBlockersCount > 0 && (
                <section>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Bloqueios ativos</p>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                    {activeBlockersCount} bloqueio{activeBlockersCount !== 1 ? 's' : ''} ativo{activeBlockersCount !== 1 ? 's' : ''}
                  </div>
                  <Link
                    href={`/students/${studentId}#blocker`}
                    className="mt-1 block text-right text-[10px] text-gray-600 hover:text-orbitus-accent-bright transition"
                  >
                    ver todos →
                  </Link>
                </section>
              )}

              {/* Goals */}
              {activeGoalsCount > 0 && (
                <section>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Metas ativas</p>
                  <div className="rounded-lg border border-orbitus-accent/20 bg-orbitus-accent/5 px-3 py-2 text-xs text-orbitus-accent-bright">
                    {activeGoalsCount} meta{activeGoalsCount !== 1 ? 's' : ''} em andamento
                  </div>
                  <Link
                    href={`/students/${studentId}`}
                    className="mt-1 block text-right text-[10px] text-gray-600 hover:text-orbitus-accent-bright transition"
                  >
                    ver todas →
                  </Link>
                </section>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-[#1a2040] p-3 space-y-2">
          <button
            type="button"
            onClick={() => setQuickLessonOpen((v) => !v)}
            className="w-full rounded-lg py-2 text-sm font-semibold text-black transition hover:opacity-90"
            style={{ background: planetColor.primary }}
          >
            ⚡ Registrar aula
          </button>
          <div className="flex gap-2">
            <Link
              href={`/students/${studentId}#blocker`}
              className="flex-1 rounded-lg border border-red-500/30 bg-red-500/5 py-2 text-center text-xs text-red-400 hover:bg-red-500/15 transition"
            >
              🔴 Bloqueio
            </Link>
            <Link
              href={`/students/${studentId}`}
              className="flex-1 rounded-lg border border-[#1a2040] bg-[#141832] py-2 text-center text-xs text-gray-300 hover:text-white hover:bg-[#1a2040] transition"
            >
              Ver ficha completa →
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
