'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudentSummary, StudentListItem } from '@orbitus/shared';
import { isDemoMode, getMockSummary, MOCK_BLOCKERS, MOCK_GOALS, type BlockerItem, type GoalItem } from '@/lib/mock-data';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

const MOCK_TOPICS = [
  { id: 't1', name: 'Introdução ao HTML' },
  { id: 't2', name: 'Lógica de programação' },
  { id: 't3', name: 'Planilhas básicas' },
  { id: 't4', name: 'JavaScript fundamentals' },
  { id: 't5', name: 'CSS e layout' },
];

type Tab = 'overview' | 'lesson' | 'blockers' | 'goals';

interface Props {
  studentId: string;
  studentPreview: StudentListItem;
  onClose: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition hover:scale-110 ${n <= value ? 'text-orbitus-xp' : 'text-orbitus-border'}`}
          aria-label={`${n} estrela${n !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function SeverityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['', 'Baixa', 'Média', 'Alta'];
  const colors = ['', 'bg-green-500/20 text-green-400 ring-green-500/40', 'bg-amber-500/20 text-amber-400 ring-amber-500/40', 'bg-red-500/20 text-red-400 ring-red-500/40'];
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${n === value ? colors[n] : 'bg-orbitus-border/50 text-gray-500 ring-orbitus-border hover:text-gray-300'}`}
        >
          {labels[n]}
        </button>
      ))}
    </div>
  );
}

export function StudentModal({ studentId, studentPreview, onClose }: Props) {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [topics, setTopics] = useState(MOCK_TOPICS);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [toast, setToast] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Lesson form
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [lessonDuration, setLessonDuration] = useState(60);
  const [lessonRating, setLessonRating] = useState(0);
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonSending, setLessonSending] = useState(false);
  const [lessonError, setLessonError] = useState('');

  // Blocker form
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerTitle, setBlockerTitle] = useState('');
  const [blockerSeverity, setBlockerSeverity] = useState(1);
  const [blockerObs, setBlockerObs] = useState('');
  const [blockerSending, setBlockerSending] = useState(false);
  const [blockerError, setBlockerError] = useState('');

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalSending, setGoalSending] = useState(false);
  const [goalError, setGoalError] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  }, []);

  const load = useCallback(async () => {
    if (isDemoMode()) {
      setSummary(getMockSummary(studentPreview));
      setBlockers(MOCK_BLOCKERS.filter((b) => b.studentId === studentId));
      setGoals(MOCK_GOALS.filter((g) => g.studentId === studentId));
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) { setSummary(getMockSummary(studentPreview)); setLoading(false); return; }
    try {
      const [sumRes, blRes, goRes, topRes] = await Promise.allSettled([
        fetch(`${API_URL}/students/${studentId}/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/${studentId}/blockers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/${studentId}/goals`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/topics`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sumRes.status === 'fulfilled' && sumRes.value.ok) setSummary(await sumRes.value.json());
      else setSummary(getMockSummary(studentPreview));
      if (blRes.status === 'fulfilled' && blRes.value.ok) { const d = await blRes.value.json(); if (Array.isArray(d)) setBlockers(d); }
      if (goRes.status === 'fulfilled' && goRes.value.ok) { const d = await goRes.value.json(); if (Array.isArray(d)) setGoals(d); }
      if (topRes.status === 'fulfilled' && topRes.value.ok) { const d = await topRes.value.json(); if (Array.isArray(d) && d.length > 0) setTopics(d); }
    } catch {
      setSummary(getMockSummary(studentPreview));
    } finally {
      setLoading(false);
    }
  }, [studentId, studentPreview]);

  useEffect(() => { load(); }, [load]);

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
  const isDemo = isDemoMode();

  async function submitLesson() {
    if (!lessonTopic) { setLessonError('Selecione o tópico.'); return; }
    if (lessonRating === 0) { setLessonError('Selecione a avaliação.'); return; }
    if (isDemo) { setLessonError('Modo demo — conecte a API para registrar aulas.'); return; }
    const token = getToken();
    if (!token) return;
    setLessonError('');
    setLessonSending(true);
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicId: lessonTopic, heldAt: new Date(lessonDate).toISOString(), durationMinutes: lessonDuration, rating: lessonRating, notes: lessonNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setLessonError(data.message ?? 'Erro ao registrar.'); return; }
      showToast(`✅ Aula registrada! +${data.xpEarned ?? 0} XP`);
      setLessonTopic('');
      setLessonRating(0);
      setLessonNotes('');
      load();
      setActiveTab('overview');
    } catch { setLessonError('Falha de conexão.'); }
    finally { setLessonSending(false); }
  }

  async function submitBlocker() {
    if (!blockerTitle.trim()) { setBlockerError('Informe o tópico do bloqueio.'); return; }
    if (isDemo) { setBlockerError('Modo demo — conecte a API.'); return; }
    const token = getToken();
    if (!token) return;
    setBlockerError('');
    setBlockerSending(true);
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/blockers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ titleOrTopic: blockerTitle.trim(), severity: blockerSeverity, observation: blockerObs.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setBlockerError(data.message ?? 'Erro.'); return; }
      showToast('🚧 Bloqueio registrado!');
      setBlockerTitle('');
      setBlockerObs('');
      setShowBlockerForm(false);
      load();
    } catch { setBlockerError('Falha de conexão.'); }
    finally { setBlockerSending(false); }
  }

  async function resolveBlocker(blockerId: string) {
    if (isDemo) { showToast('Modo demo — conecte a API.'); return; }
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/students/${studentId}/blockers/${blockerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'resolved' }),
      });
      showToast('✅ Bloqueio resolvido!');
      load();
    } catch { showToast('Falha ao resolver.'); }
  }

  async function submitGoal() {
    if (!goalTitle.trim()) { setGoalError('Informe o título da meta.'); return; }
    if (isDemo) { setGoalError('Modo demo — conecte a API.'); return; }
    const token = getToken();
    if (!token) return;
    setGoalError('');
    setGoalSending(true);
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: goalTitle.trim(), deadlineAt: goalDeadline || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setGoalError(data.message ?? 'Erro.'); return; }
      showToast('🎯 Meta adicionada!');
      setGoalTitle('');
      setGoalDeadline('');
      setShowGoalForm(false);
      load();
    } catch { setGoalError('Falha de conexão.'); }
    finally { setGoalSending(false); }
  }

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
                {/* VISÃO GERAL */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Skill bars */}
                    {summary && summary.skillBars.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Habilidades</h3>
                        <div className="space-y-2.5">
                          {summary.skillBars.map((sk) => (
                            <div key={sk.skillId}>
                              <div className="mb-1 flex justify-between text-xs">
                                <span style={{ color: sk.color ?? undefined }} className="font-medium">{sk.skillName}</span>
                                <span className="text-gray-500">Nível {sk.level} · {sk.currentXp} XP</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-orbitus-border">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, sk.currentXp % 100)}%`, backgroundColor: sk.color ?? '#8b5cf6' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last lessons */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Últimas aulas</h3>
                      {summary && summary.lastLessons.length > 0 ? (
                        <ul className="space-y-1.5">
                          {summary.lastLessons.map((l) => (
                            <li key={l.id} className="flex items-center justify-between rounded-lg border border-orbitus-border/60 bg-orbitus-surface px-3 py-2 text-sm">
                              <div>
                                <span className="text-gray-200">{l.topicName}</span>
                                <span className="ml-2 text-xs text-gray-500">{l.durationMinutes}min · {'★'.repeat(l.rating)}{'☆'.repeat(5 - l.rating)}</span>
                              </div>
                              <span className="badge-xp">+{l.xpEarned}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
                          <p className="text-sm text-gray-500">Nenhuma aula registrada ainda.</p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('lesson')}
                            className="mt-2 text-xs text-orbitus-accent-bright hover:underline"
                          >
                            Registrar primeira aula →
                          </button>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/students/${studentId}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orbitus-accent-bright transition"
                    >
                      Ver ficha completa →
                    </Link>
                  </div>
                )}

                {/* + AULA */}
                {activeTab === 'lesson' && (
                  <div className="space-y-4">
                    {isDemo && (
                      <div className="rounded-lg border border-orbitus-xp/30 bg-orbitus-xp/10 p-3 text-xs text-orbitus-xp">
                        🎮 Modo demo — conecte a API para registrar aulas de verdade.
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">Tópico</label>
                      <select
                        value={lessonTopic}
                        onChange={(e) => setLessonTopic(e.target.value)}
                        className="input-field w-full text-sm"
                      >
                        <option value="">Selecione o tópico…</option>
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-400">Data e hora</label>
                        <input
                          type="datetime-local"
                          value={lessonDate}
                          onChange={(e) => setLessonDate(e.target.value)}
                          className="input-field w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-400">Duração (min)</label>
                        <input
                          type="number"
                          min={1}
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(Number(e.target.value))}
                          className="input-field w-full text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">Avaliação</label>
                      <StarRating value={lessonRating} onChange={setLessonRating} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">Observações (opcional)</label>
                      <textarea
                        value={lessonNotes}
                        onChange={(e) => setLessonNotes(e.target.value)}
                        rows={2}
                        placeholder="Ex.: entendeu bem o conceito, ficou com dúvida em loops..."
                        className="input-field w-full text-sm resize-none"
                      />
                    </div>
                    {lessonError && <p className="text-xs text-red-400">{lessonError}</p>}
                    <button
                      type="button"
                      onClick={submitLesson}
                      disabled={lessonSending}
                      className="btn-primary w-full justify-center disabled:opacity-50"
                    >
                      {lessonSending ? 'Registrando…' : 'Registrar aula'}
                    </button>
                  </div>
                )}

                {/* BLOQUEIOS */}
                {activeTab === 'blockers' && (
                  <div className="space-y-3">
                    {blockers.filter((b) => b.status === 'active').length === 0 && (
                      <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
                        <p className="text-sm text-gray-500">Nenhum bloqueio ativo.</p>
                      </div>
                    )}
                    {blockers.filter((b) => b.status === 'active').map((b) => (
                      <div key={b.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-200 text-sm">{b.titleOrTopic}</p>
                            {b.observation && <p className="mt-0.5 text-xs text-gray-500">{b.observation}</p>}
                            <div className="mt-1 flex gap-1">
                              {b.tags.map((t) => (
                                <span key={t} className="rounded bg-orbitus-border/60 px-1.5 py-0.5 text-[10px] text-gray-400">{t}</span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => resolveBlocker(b.id)}
                            className="shrink-0 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs text-green-400 hover:bg-green-500/20 transition"
                          >
                            Resolver
                          </button>
                        </div>
                      </div>
                    ))}

                    {!showBlockerForm ? (
                      <button
                        type="button"
                        onClick={() => setShowBlockerForm(true)}
                        className="btn-secondary w-full justify-center"
                      >
                        + Marcar bloqueio
                      </button>
                    ) : (
                      <div className="rounded-lg border border-orbitus-border p-3 space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Novo bloqueio</h3>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">Tópico / descrição</label>
                          <input
                            type="text"
                            value={blockerTitle}
                            onChange={(e) => setBlockerTitle(e.target.value)}
                            placeholder="Ex.: Condicionais if/else"
                            className="input-field w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">Gravidade</label>
                          <SeverityPicker value={blockerSeverity} onChange={setBlockerSeverity} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">Observação (opcional)</label>
                          <textarea
                            value={blockerObs}
                            onChange={(e) => setBlockerObs(e.target.value)}
                            rows={2}
                            className="input-field w-full text-sm resize-none"
                          />
                        </div>
                        {blockerError && <p className="text-xs text-red-400">{blockerError}</p>}
                        <div className="flex gap-2">
                          <button type="button" onClick={submitBlocker} disabled={blockerSending} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
                            {blockerSending ? 'Salvando…' : 'Salvar'}
                          </button>
                          <button type="button" onClick={() => setShowBlockerForm(false)} className="btn-ghost px-3 text-sm">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* METAS */}
                {activeTab === 'goals' && (
                  <div className="space-y-3">
                    {goals.length === 0 && (
                      <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
                        <p className="text-sm text-gray-500">Nenhuma meta adicionada.</p>
                      </div>
                    )}
                    {goals.map((g) => {
                      const statusColor = g.status === 'completed' ? 'text-emerald-400' : g.status === 'in_progress' ? 'text-orbitus-accent-bright' : 'text-gray-400';
                      const statusLabel = g.status === 'completed' ? 'Concluída' : g.status === 'in_progress' ? 'Em andamento' : 'Pendente';
                      return (
                        <div key={g.id} className={`rounded-lg border px-3 py-2.5 ${g.status === 'completed' ? 'border-orbitus-border/40 opacity-60' : 'border-orbitus-border'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium text-sm ${g.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{g.title}</p>
                              {g.deadlineAt && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  Prazo: {new Date(g.deadlineAt).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                          </div>
                        </div>
                      );
                    })}

                    {!showGoalForm ? (
                      <button
                        type="button"
                        onClick={() => setShowGoalForm(true)}
                        className="btn-secondary w-full justify-center"
                      >
                        + Adicionar meta
                      </button>
                    ) : (
                      <div className="rounded-lg border border-orbitus-border p-3 space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Nova meta</h3>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">Título</label>
                          <input
                            type="text"
                            value={goalTitle}
                            onChange={(e) => setGoalTitle(e.target.value)}
                            placeholder="Ex.: Completar módulo de HTML"
                            className="input-field w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">Prazo (opcional)</label>
                          <input
                            type="date"
                            value={goalDeadline}
                            onChange={(e) => setGoalDeadline(e.target.value)}
                            className="input-field w-full text-sm"
                          />
                        </div>
                        {goalError && <p className="text-xs text-red-400">{goalError}</p>}
                        <div className="flex gap-2">
                          <button type="button" onClick={submitGoal} disabled={goalSending} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
                            {goalSending ? 'Salvando…' : 'Salvar'}
                          </button>
                          <button type="button" onClick={() => setShowGoalForm(false)} className="btn-ghost px-3 text-sm">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
