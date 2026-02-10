'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { StudentModal } from '@/components/StudentModal';
import { isDemoMode, getAllMockStudents, logout } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export default function RosterPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalStudent, setModalStudent] = useState<StudentListItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterTurma, setFilterTurma] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (isDemoMode()) {
      setStudents(getAllMockStudents());
      setError('');
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/students`, {
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
        if (data?.items) {
          setStudents(data.items);
        } else if (data?.message) {
          setError(data.message);
        }
      })
      .catch(() => setError('Falha ao carregar. A API está rodando?'))
      .finally(() => setLoading(false));
  }, []);

  const classGroups = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.classGroup?.id) map.set(s.classGroup.id, s.classGroup.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const filteredList = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = !search.trim() || s.displayName.toLowerCase().includes(search.toLowerCase()) || (s.fullName?.toLowerCase().includes(search.toLowerCase()));
      const matchTurma = !filterTurma || s.classGroup?.id === filterTurma;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchTurma && matchStatus;
    });
  }, [students, search, filterTurma, filterStatus]);

  const openModal = useCallback((s: StudentListItem) => setModalStudent(s), []);
  const clampFocus = useCallback((i: number) => Math.max(0, Math.min(i, filteredList.length - 1)), [filteredList.length]);

  useEffect(() => {
    setFocusedIndex((prev) => clampFocus(prev));
  }, [filteredList.length, clampFocus]);

  useEffect(() => {
    const el = cardRefs.current[focusedIndex];
    if (el) el.focus();
  }, [focusedIndex]);

  const showDemoBanner = isDemoMode();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-400">Carregando alunos…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbitus-accent">Roster</h1>
          <p className="text-gray-400">Sua party de alunos · {filteredList.length} de {students.length} aluno(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/students/new" className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Cadastrar aluno</Link>
          <Link href="/dashboard" className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card">Dashboard</Link>
          <Link href="/" className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card">Início</Link>
          <button type="button" onClick={logout} className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Sair</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
        />
        <select
          value={filterTurma}
          onChange={(e) => setFilterTurma(e.target.value)}
          className="rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
        >
          <option value="">Todas as turmas</option>
          {classGroups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="archived">Arquivado</option>
        </select>
        {filteredList.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { const nextIndex = clampFocus(focusedIndex - 1); setFocusedIndex(nextIndex); const student = filteredList[nextIndex]; if (student) openModal(student); }}
              className="rounded border border-gray-600 px-2 py-1 text-gray-400 hover:bg-orbitus-card"
              aria-label="Anterior"
            >
              ←
            </button>
            <span className="px-2 text-sm text-gray-500">{focusedIndex + 1} / {filteredList.length}</span>
            <button
              type="button"
              onClick={() => { const nextIndex = clampFocus(focusedIndex + 1); setFocusedIndex(nextIndex); const student = filteredList[nextIndex]; if (student) openModal(student); }}
              className="rounded border border-gray-600 px-2 py-1 text-gray-400 hover:bg-orbitus-card"
              aria-label="Próximo"
            >
              →
            </button>
          </div>
        )}
      </div>

      {filteredList.length > 0 && (
        <p className="mb-4 text-center text-xs text-gray-500">
          Dica: use ← → para navegar entre os cards e Enter para abrir a ficha.
        </p>
      )}

      {showDemoBanner && (
        <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
          Modo demo — dados de exemplo. Nada é salvo no servidor. Clique num aluno ou use as setas para abrir o modal.
        </div>
      )}

      {error && !showDemoBanner && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {filteredList.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-gray-600 bg-orbitus-card/50 p-12 text-center text-gray-400">
          {students.length === 0 ? (
            <>Nenhum aluno ainda. <Link href="/students/new" className="text-orbitus-accent underline">Cadastre o primeiro</Link> ou crie pela API em <a href={`${API_URL}/api/docs`} target="_blank" rel="noopener noreferrer" className="text-orbitus-accent underline">Swagger</a>.</>
          ) : (
            <>Nenhum aluno corresponde aos filtros. Tente outra busca ou turma.</>
          )}
        </div>
      )}

      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        onKeyDown={(e) => {
          if (filteredList.length === 0) return;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i - 1)); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i + 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); const student = filteredList[focusedIndex]; if (student) openModal(student); }
        }}
      >
        {filteredList.map((s, i) => (
          <motion.div
            key={s.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            role="button"
            tabIndex={i === focusedIndex ? 0 : -1}
            onClick={() => { setFocusedIndex(i); openModal(s); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); openModal(s); } }}
            className="cursor-pointer rounded-xl border border-gray-700 bg-orbitus-card p-5 transition hover:border-orbitus-accent/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orbitus-accent/50"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orbitus-accent/20 text-2xl">
                {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
              </div>
              <div>
                <h2 className="font-semibold text-white">{s.displayName}</h2>
                <p className="text-xs text-gray-500">{s.classGroup?.name ?? 'Sem turma'} · Nível {s.level}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orbitus-xp">XP {s.xp}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{s.status}</span>
            </div>
            <p className="mt-3 text-center text-sm text-orbitus-accent">Clique ou Enter para abrir ficha →</p>
          </motion.div>
        ))}
      </div>

      {modalStudent && (
        <StudentModal studentId={modalStudent.id} studentPreview={modalStudent} onClose={() => setModalStudent(null)} />
      )}
    </main>
  );
}
