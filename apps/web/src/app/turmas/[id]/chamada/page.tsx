'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isDemoMode, MOCK_STUDENTS } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('token'); }

type AttendanceStatus = 'present' | 'absent' | 'late' | 'makeup';

interface Student { id: string; displayName: string; avatarValue: string; avatarType: string; }
interface AttendanceEntry { studentId: string; status: AttendanceStatus; note: string; grade: string; }

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Presente', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
  { value: 'absent', label: 'Ausente', color: 'bg-red-500/20 text-red-400 ring-red-500/30' },
  { value: 'late', label: 'Atrasado', color: 'bg-amber-500/20 text-amber-400 ring-amber-500/30' },
  { value: 'makeup', label: 'Reposição', color: 'bg-cyan-500/20 text-cyan-400 ring-cyan-500/30' },
];

export default function ChamadaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry>>({});
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [topicId, setTopicId] = useState('');
  const [duration, setDuration] = useState(90);
  const [notes, setNotes] = useState('');
  const [heldAt, setHeldAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Chamada — Orbitus';
  }, []);

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }

    if (isDemoMode()) {
      setGroupName('Turma A (demo)');
      const s = MOCK_STUDENTS.slice(0, 3);
      setStudents(s);
      const init: Record<string, AttendanceEntry> = {};
      s.forEach((st) => { init[st.id] = { studentId: st.id, status: 'present', note: '', grade: '' }; });
      setAttendance(init);
      setTopics([{ id: 't1', name: 'Introdução ao HTML' }, { id: 't2', name: 'Lógica de programação' }]);
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/class-groups/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_URL}/students/topics`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []),
    ]).then(([group, tops]) => {
      if (group) {
        setGroupName(group.name);
        setStudents(group.students ?? []);
        const init: Record<string, AttendanceEntry> = {};
        (group.students ?? []).forEach((st: Student) => { init[st.id] = { studentId: st.id, status: 'present', note: '', grade: '' }; });
        setAttendance(init);
      }
      if (Array.isArray(tops) && tops.length > 0) setTopics(tops);
    }).finally(() => setLoading(false));
  }, [id]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }

  function setNote(studentId: string, note: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], note } }));
  }

  function setGrade(studentId: string, grade: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], grade } }));
  }

  async function save() {
    if (isDemoMode()) { setError('Modo demo — conecte a API para salvar chamadas.'); return; }
    const token = getToken();
    if (!token) return;
    setSaving(true); setError('');
    try {
      const r = await fetch(`${API_URL}/class-groups/${id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          heldAt: new Date(heldAt).toISOString(),
          durationMinutes: duration,
          topicId: topicId || undefined,
          notes: notes.trim() || undefined,
          attendances: Object.values(attendance).map((a) => ({
            studentId: a.studentId,
            status: a.status,
            note: a.note.trim() || undefined,
            grade: a.grade ? parseFloat(a.grade) : undefined,
          })),
        }),
      });
      if (!r.ok) { const d = await r.json(); setError(d.message ?? 'Erro.'); return; }
      router.push(`/turmas/${id}`);
    } catch { setError('Falha de conexão.'); }
    finally { setSaving(false); }
  }

  const presentCount = Object.values(attendance).filter((a) => a.status === 'present').length;
  const absentCount = Object.values(attendance).filter((a) => a.status === 'absent').length;

  if (loading) return <main className="page-shell"><div className="card-base h-40 animate-pulse" /></main>;

  return (
    <main id="main" className="page-shell max-w-3xl mx-auto">
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/turmas" className="hover:text-orbitus-accent-bright">Turmas</Link>
        <span>›</span>
        <Link href={`/turmas/${id}`} className="hover:text-orbitus-accent-bright">{groupName}</Link>
        <span>›</span>
        <span className="text-white">Chamada</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Chamada — {groupName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {presentCount} presentes · {absentCount} ausentes · {students.length} total
        </p>
      </div>

      {/* Session info */}
      <div className="card-base mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Dados da sessão</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Data e hora</label>
            <input type="datetime-local" value={heldAt} onChange={(e) => setHeldAt(e.target.value)} className="input-field w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Duração (min)</label>
            <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-field w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Tópico (opcional)</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input-field w-full text-sm">
              <option value="">Selecione…</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Observação geral (opcional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: turma engajada, revisão do módulo 2" className="input-field w-full text-sm" />
          </div>
        </div>
      </div>

      {/* Mark all buttons */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Marcar todos:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button key={opt.value} type="button"
            onClick={() => students.forEach((s) => setStatus(s.id, opt.value))}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${opt.color}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Student list */}
      <div className="space-y-2 mb-6">
        {students.map((s) => {
          const entry = attendance[s.id];
          if (!entry) return null;
          return (
            <div key={s.id} className="card-base p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbitus-accent/20 text-base">
                  {s.avatarValue || '🧑‍🎓'}
                </div>
                <span className="flex-1 font-medium text-gray-200">{s.displayName}</span>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => setStatus(s.id, opt.value)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition ${entry.status === opt.value ? opt.color : 'bg-orbitus-border/40 text-gray-600 ring-orbitus-border hover:text-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {entry.status !== 'present' && (
                <div className="mt-1 flex gap-2">
                  <input type="text" value={entry.note} onChange={(e) => setNote(s.id, e.target.value)}
                    placeholder="Observação (opcional)" className="input-field flex-1 text-xs" />
                  <input type="number" min={0} max={10} step={0.5} value={entry.grade} onChange={(e) => setGrade(s.id, e.target.value)}
                    placeholder="Nota" className="input-field w-20 text-xs" />
                </div>
              )}
            </div>
          );
        })}
        {students.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum aluno ativo nesta turma.</p>}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={saving || students.length === 0} className="btn-primary flex-1 justify-center disabled:opacity-50">
          {saving ? 'Salvando…' : `Salvar chamada (${presentCount}/${students.length})`}
        </button>
        <Link href={`/turmas/${id}`} className="btn-ghost px-4">Cancelar</Link>
      </div>
    </main>
  );
}
