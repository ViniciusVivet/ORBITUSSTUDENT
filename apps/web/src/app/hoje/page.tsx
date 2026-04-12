'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { isDemoMode, getMockAttentionQueue, MOCK_GOALS, MOCK_STUDENTS } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface NoLessonStudent { id: string; displayName: string; classGroup?: { name: string } | null; daysSinceLastLesson: number | null; }
interface OverdueGoal { id: string; title: string; deadlineAt: string | null; student: { id: string; displayName: string; classGroup?: { name: string } | null }; }
interface TodaySession { id: string; classGroup?: { id: string; name: string } | null; topicName?: string | null; durationMinutes: number; heldAt: string; attendanceCount: number; }

export default function HojePage() {
  const [noLesson, setNoLesson] = useState<NoLessonStudent[]>([]);
  const [overdue, setOverdue] = useState<OverdueGoal[]>([]);
  const [sessions, setSessions] = useState<TodaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Hoje — Orbitus';
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }

    if (isDemoMode()) {
      const q = getMockAttentionQueue(10);
      setNoLesson(q.map((s) => ({ id: s.studentId, displayName: s.displayName, classGroup: s.classGroup, daysSinceLastLesson: null })));
      setOverdue(MOCK_GOALS.filter((g) => g.status !== 'completed' && g.deadlineAt && new Date(g.deadlineAt) < new Date()).map((g) => {
        const st = MOCK_STUDENTS.find((s) => s.id === g.studentId);
        return { id: g.id, title: g.title, deadlineAt: g.deadlineAt, student: { id: g.studentId, displayName: st?.displayName ?? 'Aluno', classGroup: st?.classGroup ?? null } };
      }));
      setSessions([]);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/dashboard/today`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (r.status === 401) { window.location.href = '/login'; return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        setNoLesson(d.noLessonStudents ?? []);
        setOverdue(d.overdueGoals ?? []);
        setSessions(d.todaySessions ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar dados de hoje.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main id="main" className="page-shell max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Hoje</h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="card-base h-24 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/8 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); window.location.reload(); }}
            className="mt-2 rounded bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/turmas" className="btn-primary">Fazer chamada</Link>
            <Link href="/roster" className="btn-secondary">Ver roster</Link>
            <Link href="/students/new" className="btn-ghost">+ Aluno</Link>
          </div>

          {/* Today sessions */}
          {sessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Sessões de hoje</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="card-base flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-100">{s.classGroup?.name ?? 'Turma'}</p>
                      {s.topicName && <p className="text-xs text-gray-500">{s.topicName} · {s.durationMinutes}min</p>}
                    </div>
                    <span className="badge-xp">{s.attendanceCount} presentes</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No lesson */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Sem aula há 7+ dias
              {noLesson.length > 0 && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">{noLesson.length}</span>}
            </h2>
            {noLesson.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum aluno sem aula.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {noLesson.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/students/${s.id}`} className="card-interactive flex items-center gap-3 p-3 block">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-lg">👤</div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-200">{s.displayName}</p>
                        <p className="text-xs text-gray-500">
                          {s.classGroup?.name ?? 'Sem turma'}{s.daysSinceLastLesson != null ? ` · ${s.daysSinceLastLesson}d` : ''}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Overdue goals */}
          {overdue.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Metas atrasadas
                <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">{overdue.length}</span>
              </h2>
              <div className="space-y-2">
                {overdue.map((g) => (
                  <Link key={g.id} href={`/students/${g.student.id}`} className="card-interactive flex items-center justify-between p-3 block">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{g.title}</p>
                      <p className="text-xs text-gray-500">{g.student.displayName}{g.student.classGroup ? ` · ${g.student.classGroup.name}` : ''}</p>
                    </div>
                    {g.deadlineAt && (
                      <span className="text-xs text-red-400">{new Date(g.deadlineAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
