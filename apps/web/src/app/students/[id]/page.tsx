'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { StudentSummary } from '@orbitus/shared';
import { isDemoMode, getAllMockStudents, getMockSummary, MOCK_BLOCKERS, MOCK_GOALS, type BlockerItem, type GoalItem } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface TopicOption {
  id: string;
  name: string;
  slug: string;
  xpWeight?: number;
}

const MOCK_TOPICS: TopicOption[] = [
  { id: 't1', name: 'Introdução ao HTML', slug: 'intro-html', xpWeight: 1 },
  { id: 't2', name: 'Lógica de programação', slug: 'logica-prog', xpWeight: 1.2 },
  { id: 't3', name: 'Planilhas básicas', slug: 'excel-basico', xpWeight: 1 },
];

export default function StudentPage() {
  const params = useParams();
  const id = params?.id as string;
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [lessonSuccess, setLessonSuccess] = useState('');
  const [lessonError, setLessonError] = useState('');
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);
  const [blockerError, setBlockerError] = useState('');
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editClassGroupId, setEditClassGroupId] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [classGroupsForEdit, setClassGroupsForEdit] = useState<{ id: string; name: string }[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(''), 3000);
  }, []);

  useEffect(() => {
    if (!showEditForm || !id) return;
    setEditDisplayName(summary?.student?.displayName ?? '');
    setEditFullName(summary?.student?.fullName ?? '');
    setEditClassGroupId((summary?.student as { classGroupId?: string })?.classGroupId ?? (summary?.student as { classGroup?: { id: string } })?.classGroup?.id ?? '');
    setEditStatus((summary?.student as { status?: string })?.status ?? 'active');
    if (!isDemoMode() && getToken()) {
      fetch(`${API_URL}/students/class-groups`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => Array.isArray(list) && setClassGroupsForEdit(list.map((g: { id: string; name: string }) => ({ id: g.id, name: g.name }))));
    }
  }, [showEditForm, id, summary?.student]);

  const loadSummary = useCallback(() => {
    if (!id) return;
    const token = getToken();
    if (!token) return;
    if (isDemoMode()) {
      const all = getAllMockStudents();
      const student = all.find((s) => s.id === id);
      if (student) setSummary(getMockSummary(student));
      return;
    }
    fetch(`${API_URL}/students/${id}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.student) setSummary(data);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#lesson') setShowLessonForm(true);
    if (hash === '#blocker') setShowBlockerForm(true);
    if (hash === '#goal') setShowGoalForm(true);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    setError('');
    if (isDemoMode()) {
      const all = getAllMockStudents();
      const student = all.find((s) => s.id === id);
      if (student) setSummary(getMockSummary(student));
      else setError('Aluno não encontrado.');
      setTopics(MOCK_TOPICS);
      setBlockers(MOCK_BLOCKERS.filter((b) => b.studentId === id));
      setGoals(MOCK_GOALS.filter((g) => g.studentId === id));
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/students/${id}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.student) setSummary(data);
        else if (data?.message) setError(data.message);
      })
      .catch(() => setError('Falha ao carregar.'))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/students/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => Array.isArray(list) && list.length > 0 && setTopics(list))
      .catch(() => setTopics(MOCK_TOPICS));

    if (!isDemoMode()) {
      fetch(`${API_URL}/students/${id}/blockers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => Array.isArray(list) && setBlockers(list));
      fetch(`${API_URL}/students/${id}/goals`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => Array.isArray(list) && setGoals(list));
    } else {
      setBlockers(MOCK_BLOCKERS.filter((b) => b.studentId === id));
      setGoals(MOCK_GOALS.filter((g) => g.studentId === id));
    }
  }, [id, retryCount]);

  async function handleRegisterLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const topicId = (form.elements.namedItem('topicId') as HTMLSelectElement)?.value?.trim();
    const heldAt = (form.elements.namedItem('heldAt') as HTMLInputElement)?.value;
    const durationMinutes = parseInt((form.elements.namedItem('durationMinutes') as HTMLInputElement)?.value || '0', 10);
    const rating = parseInt((form.elements.namedItem('rating') as HTMLSelectElement)?.value || '0', 10);
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement)?.value?.trim() || undefined;
    setLessonError('');
    if (!topicId) { setLessonError('Selecione o tópico.'); return; }
    if (!heldAt) { setLessonError('Informe a data e hora da aula.'); return; }
    if (durationMinutes < 1) { setLessonError('Duração deve ser de pelo menos 1 minuto.'); return; }
    if (rating < 1) { setLessonError('Selecione a avaliação (1 a 5 estrelas).'); return; }
    const token = getToken();
    if (!token || isDemoMode()) {
      setLessonError('Conecte a API para registrar aulas.');
      return;
    }
    setLessonSuccess('');
    setLessonSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/students/${id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topicId,
          heldAt: new Date(heldAt).toISOString(),
          durationMinutes,
          rating,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLessonError(data.message ?? 'Erro ao registrar aula.');
        return;
      }
      setLessonSuccess(`Aula registrada! +${data.xpEarned ?? 0} XP`);
      showToast(`Aula registrada! +${data.xpEarned ?? 0} XP`);
      form.reset();
      setShowLessonForm(false);
      loadSummary();
    } catch {
      setLessonError('Falha de conexão.');
    } finally {
      setLessonSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main id="main" className="min-h-screen p-8" aria-busy="true" aria-label="Carregando ficha do aluno">
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
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => { setError(''); setRetryCount((c) => c + 1); }}
            className="rounded-lg bg-orbitus-accent px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Tentar de novo
          </button>
          <Link href="/roster" className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-orbitus-card">
            Voltar ao Roster
          </Link>
        </div>
      </main>
    );
  }

  const { student, lastLessons, skillBars, activeBlockersCount, activeGoalsCount } = summary;

  useEffect(() => {
    if (typeof document !== 'undefined' && student?.displayName) document.title = `Ficha de ${student.displayName} — Orbitus`;
  }, [student?.displayName]);

  return (
    <main id="main" className="min-h-screen p-8">
      <div className="mb-8 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/roster" className="text-orbitus-accent hover:underline">Roster</Link>
          <span aria-hidden>›</span>
          <span className="text-white">{student.displayName}</span>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/roster" className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 hover:bg-orbitus-card">
            ← Voltar ao Roster
          </Link>
          {isDemoMode() && (
            <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-400">Modo demo</span>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 shadow-lg" role="status" aria-live="polite" aria-atomic="true">
          {toastMessage}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-8">
        <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orbitus-accent/20 text-3xl">
              {student.avatarType === 'emoji' ? student.avatarValue : '🧑‍🎓'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{student.displayName}</h1>
              {student.fullName && (
                <p className="text-gray-400">{student.fullName}</p>
              )}
              <p className="text-sm text-orbitus-xp">
                Nível {student.level} · XP {student.xp}
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
                className="rounded bg-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-500"
              >
                {showEditForm ? 'Fechar' : 'Editar dados'}
              </button>
            )}
          </div>
        </div>

        {showEditForm && (
          <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
            <h2 className="mb-4 font-semibold text-white">Editar dados do aluno</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isDemoMode() || !getToken()) return;
                setEditError('');
                if (!editDisplayName.trim()) {
                  setEditError('Preencha o nome ou apelido.');
                  return;
                }
                setEditSubmitting(true);
                try {
                  const res = await fetch(`${API_URL}/students/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({
                      displayName: editDisplayName.trim(),
                      fullName: editFullName.trim() || null,
                      classGroupId: editClassGroupId.trim() || null,
                      status: editStatus,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setEditError(data.message ?? 'Erro ao atualizar.');
                    return;
                  }
                  showToast('Dados atualizados!');
                  setShowEditForm(false);
                  loadSummary();
                } catch {
                  setEditError('Falha de conexão.');
                } finally {
                  setEditSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm text-gray-400">Nome ou apelido</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Nome completo (opcional)</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                />
              </div>
              {classGroupsForEdit.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Turma</label>
                  <select
                    value={editClassGroupId}
                    onChange={(e) => setEditClassGroupId(e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                  >
                    <option value="">Nenhuma</option>
                    {classGroupsForEdit.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              {editError && <p className="text-sm text-red-400">{editError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={editSubmitting} className="rounded bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {editSubmitting ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setShowEditForm(false)} className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registrar aula */}
        <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Registrar aula</h2>
            {!showLessonForm ? (
              <button
                type="button"
                onClick={() => setShowLessonForm(true)}
                className="rounded bg-orbitus-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Nova aula
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLessonForm(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Fechar
              </button>
            )}
          </div>
          {showLessonForm && (
            <form onSubmit={handleRegisterLesson} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Tópico</label>
                <select
                  name="topicId"
                  required
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                >
                  <option value="">Selecione</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Data e hora</label>
                  <input
                    type="datetime-local"
                    name="heldAt"
                    required
                    className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Duração (min)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    min={1}
                    max={480}
                    defaultValue={45}
                    required
                    className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Avaliação (1-5)</label>
                <select
                  name="rating"
                  required
                  defaultValue="4"
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} estrela(s)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Observação (opcional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                />
              </div>
              {lessonSuccess && <p className="text-sm text-green-400">{lessonSuccess}</p>}
              {lessonError && <p id="lesson-error" className="text-sm text-red-400" role="alert">{lessonError}</p>}
              <button
                type="submit"
                disabled={lessonSubmitting}
                className="rounded bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {lessonSubmitting ? 'Salvando…' : 'Registrar'}
              </button>
            </form>
          )}
          {isDemoMode() && showLessonForm && (
            <p className="mt-2 text-xs text-amber-400">Modo demo: conecte a API para registrar aulas de verdade.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Bloqueios</h2>
            <button
              type="button"
              onClick={() => setShowBlockerForm((v) => !v)}
              className="rounded bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/30"
            >
              {showBlockerForm ? 'Fechar' : 'Marcar bloqueio'}
            </button>
          </div>
          {showBlockerForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const titleOrTopic = (form.elements.namedItem('titleOrTopic') as HTMLInputElement)?.value?.trim();
                const severity = parseInt((form.elements.namedItem('severity') as HTMLSelectElement)?.value ?? '1', 10);
                const observation = (form.elements.namedItem('observation') as HTMLTextAreaElement)?.value?.trim();
                setBlockerError('');
                if (!titleOrTopic) { setBlockerError('Preencha onde o aluno trava (título do bloqueio).'); return; }
                if (isDemoMode()) {
                  setBlockers((prev) => [...prev, { id: `b-${Date.now()}`, studentId: id, titleOrTopic, severity, tags: [], observation: observation || null, status: 'active', createdAt: new Date().toISOString() }]);
                  setShowBlockerForm(false);
                  form.reset();
                  showToast('Bloqueio registrado.');
                  return;
                }
                setBlockerError('');
                setBlockerSubmitting(true);
                try {
                  const res = await fetch(`${API_URL}/students/${id}/blockers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ titleOrTopic, severity, observation: observation || undefined }),
                  });
                  const data = await res.json();
                  if (!res.ok) { setBlockerError(data.message ?? 'Erro'); return; }
                  setBlockers((prev) => [...prev, { ...data, createdAt: data.createdAt ?? new Date().toISOString() }]);
                  showToast('Bloqueio registrado.');
                  setShowBlockerForm(false);
                  form.reset();
                  loadSummary();
                } catch { setBlockerError('Falha de conexão'); }
                finally { setBlockerSubmitting(false); }
              }}
              className="mb-4 space-y-3"
            >
              <input name="titleOrTopic" placeholder="Onde trava?" required className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none" />
              <select name="severity" defaultValue="2" className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none">
                <option value={1}>1 - Leve</option>
                <option value={2}>2 - Média</option>
                <option value={3}>3 - Alta</option>
              </select>
              <textarea name="observation" rows={2} placeholder="Observação (opcional)" className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none" />
              {blockerError && <p id="blocker-error" className="text-sm text-red-400" role="alert">{blockerError}</p>}
              <button type="submit" disabled={blockerSubmitting} className="rounded bg-amber-500/20 px-4 py-2 text-sm text-amber-400 disabled:opacity-50">
                {blockerSubmitting ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          )}
          {blockers.length === 0 ? (
            <p className="text-gray-500">Nenhum bloqueio registrado.</p>
          ) : (
            <ul className="space-y-2">
              {blockers.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-white">{b.titleOrTopic}</span>
                    <span className="ml-2 text-gray-500">sev. {b.severity}</span>
                    {b.status === 'resolved' && <span className="ml-2 rounded bg-green-500/20 px-1.5 text-xs text-green-400">resolvido</span>}
                  </div>
                  {b.status === 'active' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (isDemoMode()) {
                          setBlockers((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'resolved' as const } : x)));
                          showToast('Bloqueio resolvido!');
                          return;
                        }
                        const token = getToken();
                        if (!token) return;
                        const res = await fetch(`${API_URL}/students/${id}/blockers/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'resolved' }) });
                        if (res.ok) { setBlockers((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'resolved' as const } : x))); showToast('Bloqueio resolvido!'); }
                        loadSummary();
                      }}
                      className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30"
                    >
                      Resolver
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Metas</h2>
            <button type="button" onClick={() => setShowGoalForm((v) => !v)} className="rounded bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30">
              {showGoalForm ? 'Fechar' : 'Adicionar meta'}
            </button>
          </div>
          {showGoalForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('goalTitle') as HTMLInputElement)?.value?.trim();
                const deadline = (form.elements.namedItem('goalDeadline') as HTMLInputElement)?.value || null;
                setGoalError('');
                if (!title) { setGoalError('Preencha o título da meta.'); return; }
                const token = getToken();
                if (isDemoMode() || !token) {
                setGoals((prev) => [...prev, { id: `goal-${Date.now()}`, studentId: id, title, description: null, status: 'pending', deadlineAt: deadline, completedAt: null, createdAt: new Date().toISOString() }]);
                setShowGoalForm(false);
                form.reset();
                showToast('Meta adicionada.');
                  return;
                }
                setGoalSubmitting(true);
                try {
                  const res = await fetch(`${API_URL}/students/${id}/goals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ title, deadlineAt: deadline || undefined }),
                  });
                  const data = await res.json();
                  if (res.ok && data?.id) {
                    setGoals((prev) => [...prev, { id: data.id, studentId: id, title, description: data.description ?? null, status: data.status ?? 'pending', deadlineAt: data.deadlineAt ?? deadline, completedAt: data.completedAt ?? null, createdAt: data.createdAt ?? new Date().toISOString() }]);
                    setShowGoalForm(false);
                    form.reset();
                    showToast('Meta adicionada.');
                  }
                } finally {
                  setGoalSubmitting(false);
                }
              }}
              className="mb-4 space-y-3"
            >
              <input name="goalTitle" placeholder="Título da meta" required className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none" aria-invalid={!!goalError} aria-describedby={goalError ? 'goal-error' : undefined} />
              <input name="goalDeadline" type="date" className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none" />
              {goalError && <p id="goal-error" className="text-sm text-red-400" role="alert">{goalError}</p>}
              <button type="submit" disabled={goalSubmitting} className="rounded bg-blue-500/20 px-4 py-2 text-sm text-blue-400 disabled:opacity-50">Salvar</button>
            </form>
          )}
          {goals.length === 0 ? (
            <p className="text-gray-500">Nenhuma meta cadastrada.</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
                  <div>
                    <span className={g.status === 'completed' ? 'text-gray-500 line-through' : 'font-medium text-white'}>{g.title}</span>
                    {g.deadlineAt && (
                      <>
                        <span className="ml-2 text-gray-500">até {new Date(g.deadlineAt).toLocaleDateString('pt-BR')}</span>
                        {g.status !== 'completed' && (() => {
                          const deadline = new Date(g.deadlineAt);
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          deadline.setHours(0, 0, 0, 0);
                          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          if (daysLeft < 0) return <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">Atrasado</span>;
                          if (daysLeft === 0) return <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">Prazo hoje</span>;
                          if (daysLeft <= 3) return <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">Prazo em {daysLeft} dia(s)</span>;
                          return null;
                        })()}
                      </>
                    )}
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${g.status === 'completed' ? 'bg-green-500/20 text-green-400' : g.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{g.status === 'completed' ? 'concluída' : g.status === 'in_progress' ? 'em andamento' : 'pendente'}</span>
                  </div>
                  {g.status !== 'completed' && (
                    <div className="flex gap-1">
                      {g.status === 'pending' && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (isDemoMode() || !getToken()) {
                              setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, status: 'in_progress' as const } : x)));
                              return;
                            }
                            try {
                              const res = await fetch(`${API_URL}/students/${id}/goals/${g.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                body: JSON.stringify({ status: 'in_progress' }),
                              });
                              if (res.ok) { setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, status: 'in_progress' as const } : x))); showToast('Meta em andamento.'); }
                            } catch {}
                          }}
                          className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/30"
                        >
                          Em andamento
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof window !== 'undefined' && !window.confirm('Marcar esta meta como concluída?')) return;
                          if (isDemoMode() || !getToken()) {
                            setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, status: 'completed' as const, completedAt: new Date().toISOString() } : x)));
                            showToast('Meta concluída!');
                          return;
                        }
                        try {
                          const res = await fetch(`${API_URL}/students/${id}/goals/${g.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                              body: JSON.stringify({ status: 'completed' }),
                            });
                            if (res.ok) { setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, status: 'completed' as const, completedAt: new Date().toISOString() } : x))); showToast('Meta concluída!'); }
                          } catch {}
                        }}
                        className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {skillBars.length > 0 && (
          <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
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

        <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6">
          <h2 className="mb-4 font-semibold text-white">Últimas aulas</h2>
          {lastLessons.length === 0 ? (
            <p className="text-gray-500">Nenhuma aula registrada ainda.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-600" aria-hidden />
              <ul className="space-y-0">
                {lastLessons.map((l) => (
                  <li key={l.id} className="relative flex gap-4 pb-4 last:pb-0">
                    <div className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 rounded-full bg-orbitus-accent ring-4 ring-orbitus-card" aria-hidden />
                    <div className="min-w-0 flex-1 rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
                      <p className="font-medium text-white">{l.topicName}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(l.heldAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="mt-1 text-orbitus-xp">+{l.xpEarned} XP · {l.durationMinutes} min</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
