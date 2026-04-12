'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { StudentSummary } from '@orbitus/shared';
import { isDemoMode } from '@/lib/mock-data';
import { fetchStudentSummary, fetchTopics, fetchBlockers, fetchGoals } from '@/lib/api';
import type { TopicOption } from '@/lib/api/students';
import type { BlockerItem } from '@/lib/api/blockers';
import type { GoalItem } from '@/lib/api/goals';
import { getToken } from '@/lib/api/client';
import { RegisterLessonForm } from '@/components/student/RegisterLessonForm';
import { BlockersList } from '@/components/student/BlockersList';
import { GoalsList } from '@/components/student/GoalsList';
import { StudentEditForm } from '@/components/student/StudentEditForm';
import { LessonTimeline } from '@/components/student/LessonTimeline';
import { AttendanceHistory } from '@/components/student/AttendanceHistory';
import { StudentReportCard } from '@/components/student/StudentReportCard';

export default function StudentPage() {
  const params = useParams();
  const id = params?.id as string;
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!id) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await fetchStudentSummary(id);
      setSummary(data);
    } catch {
      // silently fail on refresh
    }
  }, [id]);

  const loadAll = useCallback(async () => {
    if (!id) return;
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [summaryData, topicsData, blockersData, goalsData] = await Promise.allSettled([
        fetchStudentSummary(id),
        fetchTopics(),
        fetchBlockers(id),
        fetchGoals(id),
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      else setError(summaryData.reason instanceof Error ? summaryData.reason.message : 'Falha ao carregar.');

      if (topicsData.status === 'fulfilled') setTopics(topicsData.value);
      if (blockersData.status === 'fulfilled') setBlockers(blockersData.value);
      if (goalsData.status === 'fulfilled') setGoals(goalsData.value);
    } finally {
      setLoading(false);
    }
  }, [id, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#lesson') {/* handled by child */}
  }, [id]);

  useEffect(() => {
    if (typeof document !== 'undefined' && summary?.student?.displayName) {
      document.title = `Ficha de ${summary.student.displayName} — Orbitus`;
    }
  }, [summary?.student?.displayName]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleLessonSuccess = useCallback((xpEarned: number) => {
    showToast(`Aula registrada! +${xpEarned} XP`);
    void loadSummary();
  }, [showToast, loadSummary]);

  const handleTopicCreated = useCallback((topic: TopicOption) => {
    setTopics((prev) => (prev.some((t) => t.id === topic.id) ? prev : [...prev, topic]));
  }, []);

  const handleLessonUpdate = useCallback(() => {
    showToast('Aula atualizada.');
    void loadSummary();
  }, [showToast, loadSummary]);

  const handleBlockersUpdate = useCallback(() => {
    showToast('Bloqueio atualizado.');
    void loadSummary();
  }, [showToast, loadSummary]);

  const handleGoalsUpdate = useCallback(() => {
    showToast('Meta atualizada.');
    void loadSummary();
  }, [showToast, loadSummary]);

  if (loading) {
    return (
      <main id="main" className="page-shell" aria-busy="true" aria-label="Carregando ficha do aluno">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-600" />
            <div className="h-4 w-4 animate-pulse rounded bg-gray-600" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-600" />
          </div>
        </div>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gray-600" />
              <div className="flex-1">
                <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-600" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-700" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded bg-gray-600" />
              <div className="h-6 w-24 animate-pulse rounded bg-gray-600" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
            <div className="mb-3 h-5 w-36 animate-pulse rounded bg-gray-600" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-700" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-gray-600" />
            <div className="h-24 w-full animate-pulse rounded bg-gray-700" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400">{error || 'Aluno não encontrado.'}</p>
        <div className="flex w-full max-w-xs flex-col gap-3 touch-manipulation sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => { setError(''); setRetryCount((c) => c + 1); }}
            className="min-h-11 rounded-lg bg-orbitus-accent px-4 py-2.5 font-medium text-white hover:opacity-90 sm:min-h-0 sm:py-2"
          >
            Tentar de novo
          </button>
          <Link
            href="/roster"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-600 px-4 py-2.5 text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-2"
          >
            Voltar ao Roster
          </Link>
        </div>
      </main>
    );
  }

  const { student, lastLessons, skillBars, activeBlockersCount, activeGoalsCount } = summary;
  const generatedAtLabel = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <main id="main" data-print-sheet className="page-shell">
      <div className="mb-6 hidden print:block">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Orbitus Classroom RPG</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{student.displayName}</h1>
        <p className="mt-1 text-sm text-gray-600">Ficha do aluno · gerada em {generatedAtLabel}</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-gray-400" aria-label="Trilha">
          <Link href="/roster" className="text-orbitus-accent hover:underline">Roster</Link>
          <span aria-hidden>›</span>
          <span className="truncate text-white">{student.displayName}</span>
        </nav>
        <div className="flex flex-wrap items-stretch gap-2 touch-manipulation sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-10 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-1.5"
          >
            Imprimir ficha
          </button>
          <Link
            href="/roster"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-1.5"
          >
            ← Voltar ao Roster
          </Link>
          {isDemoMode() && (
            <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-400">Modo demo</span>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 shadow-lg print:hidden" role="status" aria-live="polite" aria-atomic="true">
          {toastMessage}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Student header card */}
        <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orbitus-accent/20 text-3xl">
              {student.avatarType === 'emoji' ? student.avatarValue : '🧑‍🎓'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white print:hidden">{student.displayName}</h1>
              {student.fullName && (
                <p className="print-sheet-muted text-gray-400">{student.fullName}</p>
              )}
              <p className="text-sm text-orbitus-xp">
                Nível {student.level} · XP {student.xp}
              </p>
              {student.classGroup?.name && (
                <p className="print-sheet-muted mt-1 text-sm text-gray-400">
                  Turma: {student.classGroup.name}
                </p>
              )}
              <p className="print-sheet-muted mt-1 text-sm text-gray-400">
                Status: {student.status}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-amber-500/20 px-2 py-1 text-amber-400">
              {activeBlockersCount} bloqueio(s) ativo(s)
            </span>
            <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-400">
              {activeGoalsCount} meta(s) ativa(s)
            </span>
            {!isDemoMode() && (
              <button
                type="button"
                onClick={() => setShowEditForm((v) => !v)}
                className="rounded bg-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-500 print:hidden"
              >
                {showEditForm ? 'Fechar' : 'Editar dados'}
              </button>
            )}
          </div>
        </div>

        {showEditForm && (
          <StudentEditForm
            studentId={id}
            summary={summary}
            onSuccess={() => { showToast('Dados atualizados!'); void loadSummary(); }}
            onClose={() => setShowEditForm(false)}
          />
        )}

        <StudentReportCard
          summary={summary}
          blockers={blockers}
          goals={goals}
          generatedAtLabel={generatedAtLabel}
        />

        <RegisterLessonForm
          studentId={id}
          topics={topics}
          onSuccess={handleLessonSuccess}
          onTopicCreated={handleTopicCreated}
        />

        <BlockersList studentId={id} blockers={blockers} onUpdate={handleBlockersUpdate} />

        <GoalsList studentId={id} goals={goals} onUpdate={handleGoalsUpdate} />

        {skillBars.length > 0 && (
          <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
            <h2 className="mb-4 font-semibold text-white">Habilidades</h2>
            <div className="space-y-3">
              {skillBars.map((s) => (
                <div key={s.skillId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span style={{ color: s.color ?? undefined }}>{s.skillName}</span>
                    <span className="text-gray-400">Nível {s.level} · {s.currentXp} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (s.currentXp % 100))}%`,
                        backgroundColor: s.color ?? '#8b5cf6',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <LessonTimeline studentId={id} lessons={lastLessons} onLessonUpdate={handleLessonUpdate} />

        <AttendanceHistory studentId={id} />
      </div>
    </main>
  );
}
