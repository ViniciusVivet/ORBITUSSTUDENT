'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isDemoMode, MOCK_STUDENTS, MOCK_SESSIONS } from '@/lib/mock-data';
import type { ClassSessionItem } from '@orbitus/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('token'); }

interface Student { id: string; displayName: string; avatarType: string; avatarValue: string; level: number; xp: number; }
interface GroupDetail { id: string; name: string; course?: string | null; students: Student[]; sessions: ClassSessionItem[]; }

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    if (isDemoMode()) {
      setGroup({ id, name: 'Turma A', course: 'Programação', students: MOCK_STUDENTS.slice(0, 3), sessions: MOCK_SESSIONS });
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/class-groups/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) { setError('Turma não encontrada.'); return null; } return r.json(); })
      .then((d) => d && setGroup(d))
      .catch(() => setError('Falha ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (group && typeof document !== 'undefined') document.title = `${group.name} — Orbitus`;
  }, [group?.name]);

  if (loading) return <main className="page-shell"><div className="card-base h-32 animate-pulse" /></main>;
  if (error || !group) return <main className="page-shell flex items-center justify-center"><p className="text-red-400">{error || 'Turma não encontrada.'}</p></main>;

  return (
    <main id="main" className="page-shell max-w-4xl mx-auto">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/turmas" className="hover:text-orbitus-accent-bright transition">Turmas</Link>
        <span>›</span>
        <span className="text-white">{group.name}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          {group.course && <p className="text-sm text-gray-500">{group.course}</p>}
        </div>
        <Link href={`/turmas/${id}/chamada`} className="btn-primary">Fazer chamada</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{group.students.length} Aluno(s)</h2>
          <div className="space-y-2">
            {group.students.map((s) => (
              <Link key={s.id} href={`/students/${s.id}`} className="card-interactive flex items-center gap-3 p-3 block">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbitus-accent/20 text-lg">
                  {s.avatarValue || '🧑‍🎓'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-200">{s.displayName}</p>
                  <p className="text-xs text-gray-500">Nv {s.level} · {s.xp} XP</p>
                </div>
              </Link>
            ))}
            {group.students.length === 0 && <p className="text-sm text-gray-600">Nenhum aluno ativo nesta turma.</p>}
          </div>
        </section>

        {/* Sessions */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Últimas sessões</h2>
          <div className="space-y-2">
            {group.sessions.map((s) => (
              <div key={s.id} className="card-base p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{s.topicName ?? 'Aula'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.heldAt).toLocaleDateString('pt-BR')} · {s.durationMinutes}min
                    </p>
                  </div>
                  <span className="badge-xp">{s.attendanceCount} pres.</span>
                </div>
                {s.notes && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.notes}</p>}
              </div>
            ))}
            {group.sessions.length === 0 && <p className="text-sm text-gray-600">Nenhuma sessão registrada.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
