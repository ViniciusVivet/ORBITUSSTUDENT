'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { StudentListItem, StudentSummary } from '@orbitus/shared';
import { fetchStudentSummary } from '@/lib/api/students';
import { updateLesson } from '@/lib/api/lessons';
import { QuickLessonForm } from '@/components/roster/QuickLessonForm';
import { AstronautAvatar } from '@/components/AstronautAvatar';

interface Props {
  studentId: string;
  studentPreview: StudentListItem;
  planetColor: { primary: string; glow: string; ring: string; bg: string };
  onClose: () => void;
}

type Lesson = StudentSummary['lastLessons'][number];

function SkeletonLine({ w }: { w: string }) {
  return <div className={`h-3 animate-pulse rounded bg-[#1a2040] ${w}`} />;
}

function mediaLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'Abrir PDF';
  if (/\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(lower)) return 'Abrir imagem';
  if (/\.(mp4|mov|webm)(\?|$)/.test(lower) || lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'Abrir video';
  }
  return 'Abrir material';
}

export function DetailPanel({ studentId, studentPreview, planetColor, onClose }: Props) {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickLessonOpen, setQuickLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonMediaUrl, setLessonMediaUrl] = useState('');
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonError, setLessonError] = useState('');

  const s = summary?.student ?? studentPreview;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentSummary(studentId);
      setSummary(data);
    } catch {
      // fallback to preview data
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

  const recentLessons = summary?.lastLessons ?? [];
  const activeBlockersCount = summary?.activeBlockersCount ?? s.attentionHints?.activeBlockersCount ?? 0;
  const activeGoalsCount = summary?.activeGoalsCount ?? 0;

  function openLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setLessonNotes(lesson.notes ?? '');
    setLessonMediaUrl(lesson.mediaUrl ?? '');
    setLessonError('');
  }

  async function saveLesson() {
    if (!selectedLesson) return;
    setLessonSaving(true);
    setLessonError('');
    try {
      await updateLesson(studentId, selectedLesson.id, {
        notes: lessonNotes.trim() || null,
        mediaUrl: lessonMediaUrl.trim() || null,
      });
      setSelectedLesson(null);
      void load();
    } catch (err) {
      setLessonError(err instanceof Error ? err.message : 'Falha ao salvar aula.');
    } finally {
      setLessonSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 sm:hidden"
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden border-l border-[#1a2040] bg-[#111527] shadow-2xl sm:w-[320px] md:w-[360px]"
        role="dialog"
        aria-modal="true"
        aria-label={`Painel de ${s.displayName}`}
      >
        <div className="shrink-0 border-b border-[#1a2040] p-4" style={{ background: planetColor.bg }}>
          <div className="flex items-start gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <AstronautAvatar
                planetColor={planetColor}
                avatarValue={s.avatarType === 'emoji' ? s.avatarValue : undefined}
                size={56}
              />
              <div
                className="absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black ring-2 ring-[#111527]"
                style={{ background: planetColor.primary }}
              >
                {s.level ?? 1}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-white">{s.displayName}</h2>
              <p className="truncate text-xs text-gray-400">{s.classGroup?.name ?? 'Sem turma'}</p>
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

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#1a2040] hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
              <section>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Historico recente</p>
                  {recentLessons.length > 0 && (
                    <span className="text-[10px] text-gray-700">{recentLessons.length} aula{recentLessons.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {recentLessons.length > 0 ? (
                  <ul className="space-y-1.5">
                    {recentLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => openLesson(lesson)}
                          className="w-full rounded-lg border border-[#1a2040] bg-[#141832] px-3 py-2 text-left text-xs text-gray-300 transition hover:border-orbitus-accent/50 hover:bg-[#1a2040] focus:outline-none focus:ring-2 focus:ring-orbitus-accent"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-200">{lesson.topicName || 'Sem topico'}</p>
                              <p className="mt-0.5 text-gray-500">
                                {new Date(lesson.heldAt).toLocaleDateString('pt-BR')} - {lesson.rating}* - +{lesson.xpEarned} XP
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-orbitus-accent/10 px-2 py-0.5 text-[10px] text-orbitus-accent-bright">
                              {lesson.durationMinutes}m
                            </span>
                          </div>
                          {(lesson.notes || lesson.mediaUrl) && (
                            <p className="mt-1 text-[10px] text-gray-500">
                              {lesson.notes ? 'Com texto' : ''}
                              {lesson.notes && lesson.mediaUrl ? ' - ' : ''}
                              {lesson.mediaUrl ? 'Com material' : ''}
                            </p>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-gray-600">Nenhuma aula registrada</p>
                )}
              </section>

              <AnimatePresence>
                {quickLessonOpen && (
                  <QuickLessonForm
                    studentId={studentId}
                    onClose={() => { setQuickLessonOpen(false); void load(); }}
                  />
                )}
              </AnimatePresence>

              {activeBlockersCount > 0 && (
                <section>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Bloqueios ativos</p>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                    {activeBlockersCount} bloqueio{activeBlockersCount !== 1 ? 's' : ''} ativo{activeBlockersCount !== 1 ? 's' : ''}
                  </div>
                  <Link
                    href={`/students/${studentId}#blocker`}
                    className="mt-1 block text-right text-[10px] text-gray-600 transition hover:text-orbitus-accent-bright"
                  >
                    ver todos
                  </Link>
                </section>
              )}

              {activeGoalsCount > 0 && (
                <section>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Metas ativas</p>
                  <div className="rounded-lg border border-orbitus-accent/20 bg-orbitus-accent/5 px-3 py-2 text-xs text-orbitus-accent-bright">
                    {activeGoalsCount} meta{activeGoalsCount !== 1 ? 's' : ''} em andamento
                  </div>
                  <Link
                    href={`/students/${studentId}`}
                    className="mt-1 block text-right text-[10px] text-gray-600 transition hover:text-orbitus-accent-bright"
                  >
                    ver todas
                  </Link>
                </section>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#1a2040] p-3">
          <button
            type="button"
            onClick={() => setQuickLessonOpen((v) => !v)}
            className="w-full rounded-lg py-2 text-sm font-semibold text-black transition hover:opacity-90"
            style={{ background: planetColor.primary }}
          >
            Registrar aula
          </button>
          <div className="flex gap-2">
            <Link
              href={`/students/${studentId}#blocker`}
              className="flex-1 rounded-lg border border-red-500/30 bg-red-500/5 py-2 text-center text-xs text-red-400 transition hover:bg-red-500/15"
            >
              Bloqueio
            </Link>
            <Link
              href={`/students/${studentId}`}
              className="flex-1 rounded-lg border border-[#1a2040] bg-[#141832] py-2 text-center text-xs text-gray-300 transition hover:bg-[#1a2040] hover:text-white"
            >
              Ver ficha completa
            </Link>
          </div>
        </div>
      </motion.aside>

      {selectedLesson && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setSelectedLesson(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-panel-lesson-title"
            className="w-full max-w-lg rounded-t-xl border border-[#1a2040] bg-[#111527] p-5 shadow-2xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 id="detail-panel-lesson-title" className="font-semibold text-white">{selectedLesson.topicName}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(selectedLesson.heldAt).toLocaleString('pt-BR')} - {selectedLesson.durationMinutes} min - +{selectedLesson.xpEarned} XP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-[#1a2040] hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Texto da aula</label>
                <textarea
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  rows={5}
                  placeholder="O que foi feito, dificuldades, proximos passos..."
                  className="w-full resize-none rounded-lg border border-[#1a2040] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Foto, video ou PDF</label>
                <input
                  type="url"
                  value={lessonMediaUrl}
                  onChange={(e) => setLessonMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#1a2040] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Cole um link do Drive, YouTube, PDF, imagem ou video.</p>
              </div>

              {lessonMediaUrl.trim() && (
                <a
                  href={lessonMediaUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-orbitus-accent/40 px-3 py-2 text-sm text-orbitus-accent hover:bg-orbitus-accent/10"
                >
                  {mediaLabel(lessonMediaUrl.trim())}
                </a>
              )}

              {lessonError && <p className="text-sm text-red-400" role="alert">{lessonError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  className="rounded-lg border border-[#1a2040] px-4 py-2 text-sm text-gray-300 hover:bg-[#1a2040]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveLesson()}
                  disabled={lessonSaving}
                  className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {lessonSaving ? 'Salvando...' : 'Salvar aula'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
