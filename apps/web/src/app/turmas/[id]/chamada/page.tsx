'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isDemoMode, MOCK_STUDENTS } from '@/lib/mock-data';
import { createTopic } from '@/lib/api/students';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('token'); }

type AttendanceStatus = 'present' | 'absent' | 'late' | 'makeup';

interface Student { id: string; displayName: string; avatarValue: string; avatarType: string; }
interface AttendanceEntry { studentId: string; status: AttendanceStatus; note: string; grade: string; }

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Presente', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
  { value: 'absent', label: 'Ausente', color: 'bg-red-500/20 text-red-400 ring-red-500/30' },
  { value: 'late', label: 'Atrasado', color: 'bg-amber-500/20 text-amber-400 ring-amber-500/30' },
  { value: 'makeup', label: 'Reposicao', color: 'bg-cyan-500/20 text-cyan-400 ring-cyan-500/30' },
];

const DURATION_PRESETS = [
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1h30', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
];

function hoursFromMinutes(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

function minutesFromHours(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.max(1, Math.min(480, Math.round(parsed * 60)));
}

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
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Chamada - Orbitus';
  }, []);

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }

    if (isDemoMode()) {
      setGroupName('Turma A (demo)');
      const list = MOCK_STUDENTS.slice(0, 3);
      setStudents(list);
      const init: Record<string, AttendanceEntry> = {};
      list.forEach((student) => { init[student.id] = { studentId: student.id, status: 'present', note: '', grade: '' }; });
      setAttendance(init);
      setTopics([{ id: 't1', name: 'Introducao ao HTML' }, { id: 't2', name: 'Logica de programacao' }]);
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/class-groups/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_URL}/students/topics`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []),
    ]).then(([group, topicList]) => {
      if (group) {
        setGroupName(group.name);
        setStudents(group.students ?? []);
        const init: Record<string, AttendanceEntry> = {};
        (group.students ?? []).forEach((student: Student) => {
          init[student.id] = { studentId: student.id, status: 'present', note: '', grade: '' };
        });
        setAttendance(init);
      }
      if (Array.isArray(topicList) && topicList.length > 0) setTopics(topicList);
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

  async function handleCreateTopic() {
    const name = newTopicName.trim();
    if (!name || creatingTopic) return;
    if (isDemoMode()) { setError('Modo demo: conecte a API para criar categorias.'); return; }
    setCreatingTopic(true);
    setError('');
    try {
      const topic = await createTopic(name);
      setTopics((prev) => [...prev, topic]);
      setTopicId(topic.id);
      setNewTopicName('');
      setShowNewTopic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setCreatingTopic(false);
    }
  }

  async function save() {
    if (isDemoMode()) { setError('Modo demo: conecte a API para salvar chamadas.'); return; }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/class-groups/${id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          heldAt: new Date(heldAt).toISOString(),
          durationMinutes: duration,
          topicId: topicId || undefined,
          notes: notes.trim() || undefined,
          attendances: Object.values(attendance).map((entry) => ({
            studentId: entry.studentId,
            status: entry.status,
            note: entry.note.trim() || undefined,
            grade: entry.grade ? parseFloat(entry.grade) : undefined,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Erro.');
        return;
      }
      router.push(`/turmas/${id}`);
    } catch {
      setError('Falha de conexao.');
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(attendance).filter((entry) => entry.status === 'present').length;
  const absentCount = Object.values(attendance).filter((entry) => entry.status === 'absent').length;

  if (loading) return <main className="page-shell"><div className="card-base h-40 animate-pulse" /></main>;

  return (
    <main id="main" className="page-shell mx-auto max-w-3xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/turmas" className="hover:text-orbitus-accent-bright">Turmas</Link>
        <span>/</span>
        <Link href={`/turmas/${id}`} className="hover:text-orbitus-accent-bright">{groupName}</Link>
        <span>/</span>
        <span className="text-white">Chamada</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Chamada - {groupName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {presentCount} presentes - {absentCount} ausentes - {students.length} total
        </p>
      </div>

      <div className="card-base mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Dados da aula</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Data e hora</label>
            <input type="datetime-local" value={heldAt} onChange={(e) => setHeldAt(e.target.value)} className="input-field w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Duracao (horas)</label>
            <input
              type="number"
              min={0.25}
              max={8}
              step={0.25}
              value={hoursFromMinutes(duration)}
              onChange={(e) => setDuration(minutesFromHours(e.target.value))}
              className="input-field w-full text-sm"
            />
            <p className="mt-1 text-[10px] text-gray-600">{duration} min</p>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-gray-400">Topico (opcional)</label>
              {!isDemoMode() && (
                <button type="button" onClick={() => setShowNewTopic((v) => !v)} className="text-xs font-medium text-orbitus-accent hover:underline">
                  {showNewTopic ? 'Cancelar' : '+ Nova categoria'}
                </button>
              )}
            </div>
            {showNewTopic ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateTopic(); } }}
                  placeholder="Nome da categoria"
                  className="input-field min-w-0 flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateTopic()}
                  disabled={creatingTopic || !newTopicName.trim()}
                  className="rounded-lg bg-orbitus-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {creatingTopic ? 'Criando...' : 'Criar'}
                </button>
              </div>
            ) : (
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input-field w-full text-sm">
                <option value="">Selecione...</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            )}
            <div className="mt-2 grid grid-cols-5 gap-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setDuration(preset.minutes)}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                    duration === preset.minutes
                      ? 'border-orbitus-accent bg-orbitus-accent/20 text-orbitus-accent-bright'
                      : 'border-orbitus-border text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-400">Observacao geral (opcional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: turma engajada, revisao do modulo 2" className="input-field w-full text-sm" />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Marcar todos:</span>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => students.forEach((student) => setStatus(student.id, option.value))}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${option.color}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mb-6 space-y-2">
        {students.map((student) => {
          const entry = attendance[student.id];
          if (!entry) return null;
          return (
            <div key={student.id} className="card-base p-3">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbitus-accent/20 text-base">
                  {student.avatarValue || 'Aluno'}
                </div>
                <span className="flex-1 font-medium text-gray-200">{student.displayName}</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(student.id, option.value)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition ${entry.status === option.value ? option.color : 'bg-orbitus-border/40 text-gray-600 ring-orbitus-border hover:text-gray-300'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {entry.status !== 'present' && (
                <div className="mt-1 flex gap-2">
                  <input type="text" value={entry.note} onChange={(e) => setNote(student.id, e.target.value)} placeholder="Observacao (opcional)" className="input-field flex-1 text-xs" />
                  <input type="number" min={0} max={10} step={0.5} value={entry.grade} onChange={(e) => setGrade(student.id, e.target.value)} placeholder="Nota" className="input-field w-20 text-xs" />
                </div>
              )}
            </div>
          );
        })}
        {students.length === 0 && <p className="py-8 text-center text-gray-500">Nenhum aluno ativo nesta turma.</p>}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={saving || students.length === 0} className="btn-primary flex-1 justify-center disabled:opacity-50">
          {saving ? 'Salvando...' : `Salvar chamada (${presentCount}/${students.length})`}
        </button>
        <Link href={`/turmas/${id}`} className="btn-ghost px-4">Cancelar</Link>
      </div>
    </main>
  );
}
