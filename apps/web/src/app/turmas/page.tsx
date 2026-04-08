'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isDemoMode, MOCK_CLASS_GROUPS } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('token'); }

interface Group { id: string; name: string; course?: string | null; academicPeriod?: string | null; _count?: { students: number } }

export default function TurmasPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [period, setPeriod] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Turmas — Orbitus';
  }, []);

  function load() {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    if (isDemoMode()) {
      setGroups(MOCK_CLASS_GROUPS.map((g) => ({ ...g, _count: { students: 3 } })));
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/class-groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => Array.isArray(d) && setGroups(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createGroup() {
    if (!name.trim()) { setError('Informe o nome da turma.'); return; }
    if (isDemoMode()) { setError('Modo demo — conecte a API.'); return; }
    const token = getToken();
    if (!token) return;
    setSaving(true); setError('');
    try {
      const r = await fetch(`${API_URL}/class-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), course: course.trim() || undefined, academicPeriod: period.trim() || undefined }),
      });
      if (!r.ok) { const d = await r.json(); setError(d.message ?? 'Erro.'); return; }
      setName(''); setCourse(''); setPeriod(''); setShowForm(false);
      load();
    } catch { setError('Falha de conexão.'); }
    finally { setSaving(false); }
  }

  return (
    <main id="main" className="page-shell max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Turmas</h1>
          <p className="text-sm text-gray-500">{groups.length} turma(s)</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nova turma'}
        </button>
      </div>

      {showForm && (
        <div className="card-base mb-6 p-4 space-y-3">
          <h2 className="font-semibold text-gray-200">Nova turma</h2>
          <input type="text" placeholder="Nome da turma *" value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Curso (opcional)" value={course} onChange={(e) => setCourse(e.target.value)} className="input-field w-full" />
            <input type="text" placeholder="Período/semestre (opcional)" value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field w-full" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="button" onClick={createGroup} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Criando…' : 'Criar turma'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="card-base h-20 animate-pulse" />)}</div>
      ) : groups.length === 0 ? (
        <div className="card-base p-10 text-center">
          <p className="text-gray-500">Nenhuma turma ainda.</p>
          <button type="button" onClick={() => setShowForm(true)} className="mt-3 text-sm text-orbitus-accent-bright hover:underline">Criar primeira turma →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/turmas/${g.id}`} className="card-interactive flex items-center justify-between p-4 block">
              <div>
                <h2 className="font-semibold text-gray-100">{g.name}</h2>
                <p className="text-xs text-gray-500">
                  {[g.course, g.academicPeriod].filter(Boolean).join(' · ') || 'Sem curso/período definido'}
                  {g._count?.students != null ? ` · ${g._count.students} aluno(s)` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/turmas/${g.id}/chamada`} onClick={(e) => e.stopPropagation()} className="btn-primary px-3 py-1.5 text-sm">
                  Chamada
                </Link>
                <span className="text-gray-600">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
