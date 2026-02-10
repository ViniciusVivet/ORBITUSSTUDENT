'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { StudentModal } from '@/components/StudentModal';
import { isDemoMode, getAllMockStudents } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 20;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export default function RosterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalStudent, setModalStudent] = useState<StudentListItem | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterTurma, setFilterTurma] = useState<string>(() => searchParams.get('classGroupId') ?? '');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterNoLessonDays, setFilterNoLessonDays] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'xp' | 'level'>('name');
  const [totalFromApi, setTotalFromApi] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE); // demo: quantos exibir
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const q = searchParams.get('classGroupId') ?? '';
    setFilterTurma((prev) => (prev !== q ? q : prev));
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (isDemoMode()) {
      setStudents(getAllMockStudents());
      setTotalFromApi(null);
      setError('');
      setLoading(false);
      setDisplayCount(PAGE_SIZE);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', '0');
    if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
    if (filterTurma) params.set('classGroupId', filterTurma);
    if (filterStatus) params.set('status', filterStatus);
    if (filterNoLessonDays !== '' && filterNoLessonDays > 0) params.set('noLessonSinceDays', String(filterNoLessonDays));
    fetch(`${API_URL}/students?${params.toString()}`, {
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
          setTotalFromApi(typeof data.total === 'number' ? data.total : data.items.length);
        } else if (data?.message) {
          setError(data.message);
        }
      })
      .catch(() => setError('Falha ao carregar. A API está rodando?'))
      .finally(() => setLoading(false));
  }, [searchDebounced, filterTurma, filterStatus, filterNoLessonDays, retryTrigger]);

  const classGroups = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.classGroup?.id) map.set(s.classGroup.id, s.classGroup.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const filteredList = useMemo(() => {
    const list = students.filter((s) => {
      const matchSearch = !search.trim() || s.displayName.toLowerCase().includes(search.toLowerCase()) || (s.fullName?.toLowerCase().includes(search.toLowerCase()));
      const matchTurma = !filterTurma || s.classGroup?.id === filterTurma;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchTurma && matchStatus;
    });
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.displayName ?? '').localeCompare(b.displayName ?? '', 'pt-BR');
      if (sortBy === 'xp') return (b.xp ?? 0) - (a.xp ?? 0);
      if (sortBy === 'level') return (b.level ?? 0) - (a.level ?? 0);
      return 0;
    });
    return sorted;
  }, [students, search, filterTurma, filterStatus, sortBy]);

  const displayedList = useMemo(() => {
    if (isDemoMode()) return filteredList.slice(0, displayCount);
    return filteredList;
  }, [filteredList, displayCount]);

  const hasMoreDemo = displayCount < filteredList.length;
  const hasMoreApi = totalFromApi != null && students.length < totalFromApi && !loadingMore;

  const loadMoreApi = useCallback(() => {
    const token = getToken();
    if (!token || isDemoMode() || loadingMore || totalFromApi == null || students.length >= totalFromApi) return;
    setLoadingMore(true);
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(students.length));
    if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
    if (filterTurma) params.set('classGroupId', filterTurma);
    if (filterStatus) params.set('status', filterStatus);
    if (filterNoLessonDays !== '' && filterNoLessonDays > 0) params.set('noLessonSinceDays', String(filterNoLessonDays));
    fetch(`${API_URL}/students?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items?.length) setStudents((prev) => [...prev, ...data.items]);
      })
      .finally(() => setLoadingMore(false));
  }, [searchDebounced, filterTurma, filterStatus, filterNoLessonDays, students.length, totalFromApi, loadingMore]);

  const openModal = useCallback((s: StudentListItem) => setModalStudent(s), []);
  const clampFocus = useCallback((i: number) => Math.max(0, Math.min(i, displayedList.length - 1)), [displayedList.length]);

  useEffect(() => {
    setFocusedIndex((prev) => clampFocus(prev));
  }, [displayedList.length, clampFocus]);

  useEffect(() => {
    const el = cardRefs.current[focusedIndex];
    if (el) el.focus();
  }, [focusedIndex]);

  const showDemoBanner = isDemoMode();

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Roster — Orbitus Classroom RPG';
  }, []);

  if (loading) {
    return (
      <main id="main" className="min-h-screen p-8">
        <div className="mb-6">
          <div className="mb-1 h-8 w-32 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-700/70" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando alunos">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-700 bg-orbitus-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-gray-600" />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-600" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-700" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-600" />
                <div className="h-5 w-14 animate-pulse rounded bg-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbitus-accent">Roster</h1>
          <p className="text-gray-400">
            Sua party de alunos · {displayedList.length}{isDemoMode() ? ` de ${filteredList.length}` : totalFromApi != null ? ` de ${totalFromApi}` : ''} aluno(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const headers = ['Nome', 'Nome completo', 'Turma', 'Nível', 'XP', 'Status'];
              const rows = displayedList.map((s) => [
                s.displayName ?? '',
                s.fullName ?? '',
                s.classGroup?.name ?? '',
                String(s.level ?? 0),
                String(s.xp ?? 0),
                s.status ?? '',
              ]);
              const csv = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
              const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card"
          >
            Exportar CSV
          </button>
          <Link href="/students/new" className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Cadastrar aluno</Link>
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
          onChange={(e) => {
              const v = e.target.value;
              setFilterTurma(v);
              const params = new URLSearchParams(searchParams.toString());
              if (v) params.set('classGroupId', v); else params.delete('classGroupId');
              const q = params.toString();
              router.replace(q ? `${pathname}?${q}` : pathname);
            }}
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
        {!isDemoMode() && (
          <select
            value={filterNoLessonDays === '' ? '' : filterNoLessonDays}
            onChange={(e) => { const v = e.target.value; setFilterNoLessonDays(v === '' ? '' : Number(v)); }}
            className="rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
            aria-label="Filtro sem aula"
          >
            <option value="">Todos</option>
            <option value="7">Sem aula há 7+ dias</option>
            <option value="14">Sem aula há 14+ dias</option>
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'xp' | 'level')}
          className="rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
          aria-label="Ordenar por"
        >
          <option value="name">Nome (A–Z)</option>
          <option value="xp">XP (maior primeiro)</option>
          <option value="level">Nível (maior primeiro)</option>
        </select>
        {(search.trim() || filterTurma || filterStatus || filterNoLessonDays !== '') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterTurma(''); setFilterStatus(''); setFilterNoLessonDays(''); }}
            className="rounded-lg border border-gray-500 px-3 py-2 text-sm text-gray-400 hover:bg-orbitus-card hover:text-white"
          >
            Limpar filtros
          </button>
        )}
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
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); setRetryTrigger((t) => t + 1); }}
            className="mt-3 rounded bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/30"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {displayedList.length === 0 && !error && (
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
          if (displayedList.length === 0) return;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i - 1)); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i + 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); const student = displayedList[focusedIndex]; if (student) openModal(student); }
        }}
      >
        {displayedList.map((s, i) => (
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

      {(hasMoreDemo || hasMoreApi) && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => isDemoMode() ? setDisplayCount((c) => c + PAGE_SIZE) : loadMoreApi()}
            disabled={loadingMore}
            className="rounded-lg border border-orbitus-accent/50 bg-orbitus-accent/10 px-6 py-2 text-orbitus-accent hover:bg-orbitus-accent/20 disabled:opacity-50"
          >
            {loadingMore ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}

      {modalStudent && (
        <StudentModal studentId={modalStudent.id} studentPreview={modalStudent} onClose={() => setModalStudent(null)} />
      )}
    </main>
  );
}
