'use client';

import { useEffect, useLayoutEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { AttentionQueueItem, StudentListItem } from '@orbitus/shared';
import { StudentModal } from '@/components/StudentModal';
import { AttentionHintsBadges, attentionHintsVisible } from '@/components/AttentionHintsBadges';
import {
  isDemoMode,
  getAllMockStudents,
  enrichStudentsWithAttentionHints,
  getMockAttentionQueue,
} from '@/lib/mock-data';
import { buildRosterCsv, buildRosterReportCsv } from '@/lib/csv-export';
import { loadRosterFiltersSnapshot, saveRosterFiltersSnapshot } from '@/lib/roster-filters-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 20;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export default function RosterPageWrapper() {
  return (
    <Suspense>
      <RosterPage />
    </Suspense>
  );
}

function RosterPage() {
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
  const [attentionQueue, setAttentionQueue] = useState<AttentionQueueItem[]>([]);
  const [rosterView, setRosterView] = useState<'cards' | 'table'>('cards');
  const itemRefs = useRef<(HTMLDivElement | HTMLTableRowElement | null)[]>([]);
  const rosterFiltersHydratedRef = useRef(false);
  const [rosterFiltersReady, setRosterFiltersReady] = useState(false);

  /** Antes da pintura: restaura filtros; turma na URL tem prioridade (link “Ver alunos”). Evita 1ª busca na API com filtros errados. */
  useLayoutEffect(() => {
    if (rosterFiltersHydratedRef.current) return;
    rosterFiltersHydratedRef.current = true;
    const urlTurma = searchParams.get('classGroupId')?.trim() ?? '';
    const snap = loadRosterFiltersSnapshot();
    if (snap) {
      if (!urlTurma) setFilterTurma(snap.filterTurma);
      setSearch(snap.search);
      setSearchDebounced(snap.search);
      setFilterStatus(snap.filterStatus);
      setFilterNoLessonDays(snap.filterNoLessonDays);
      setSortBy(snap.sortBy);
    }
    setRosterFiltersReady(true);
  }, [searchParams]);

  /** Navegação client-side com ?classGroupId= força a turma (ex.: “Ver alunos” no Dashboard). */
  useEffect(() => {
    if (!rosterFiltersReady) return;
    const q = searchParams.get('classGroupId')?.trim() ?? '';
    if (q) setFilterTurma(q);
  }, [searchParams, rosterFiltersReady]);

  useEffect(() => {
    if (!rosterFiltersReady) return;
    saveRosterFiltersSnapshot({
      search,
      filterTurma,
      filterStatus,
      filterNoLessonDays,
      sortBy,
    });
  }, [rosterFiltersReady, search, filterTurma, filterStatus, filterNoLessonDays, sortBy]);

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
    if (!rosterFiltersReady) return;
    if (isDemoMode()) {
      setStudents(enrichStudentsWithAttentionHints(getAllMockStudents()));
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
    params.set('sortBy', sortBy);
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
  }, [rosterFiltersReady, searchDebounced, filterTurma, filterStatus, filterNoLessonDays, sortBy, retryTrigger]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (isDemoMode()) {
      setAttentionQueue(getMockAttentionQueue(12));
      return;
    }
    fetch(`${API_URL}/students/attention-queue?limit=12`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAttentionQueue(data);
      })
      .catch(() => setAttentionQueue([]));
  }, [retryTrigger]);

  const classGroups = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.classGroup?.id) map.set(s.classGroup.id, s.classGroup.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  /** Modo API: filtros e ordenacao vêm do servidor (paginacao consistente). Demo: filtro/ordem no cliente. */
  const filteredList = useMemo(() => {
    if (!isDemoMode()) return students;
    const list = students.filter((s) => {
      const matchSearch = !search.trim() || s.displayName.toLowerCase().includes(search.toLowerCase()) || (s.fullName?.toLowerCase().includes(search.toLowerCase()));
      const matchTurma = !filterTurma || s.classGroup?.id === filterTurma;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchTurma && matchStatus;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.displayName ?? '').localeCompare(b.displayName ?? '', 'pt-BR');
      if (sortBy === 'xp') return (b.xp ?? 0) - (a.xp ?? 0);
      if (sortBy === 'level') return (b.level ?? 0) - (a.level ?? 0);
      return 0;
    });
  }, [students, search, filterTurma, filterStatus, sortBy]);

  const displayedList = useMemo(() => {
    if (isDemoMode()) return filteredList.slice(0, displayCount);
    return filteredList;
  }, [filteredList, displayCount]);

  const hasMoreDemo = displayCount < filteredList.length;
  const hasMoreApi = totalFromApi != null && students.length < totalFromApi && !loadingMore;

  const rosterFilterDescription = useMemo(() => {
    const parts: string[] = [];
    const q = isDemoMode() ? search.trim() : searchDebounced.trim();
    if (q) parts.push(`busca="${q}"`);
    if (filterTurma) {
      const name = classGroups.find((g) => g.id === filterTurma)?.name ?? filterTurma;
      parts.push(`turma=${name}`);
    } else parts.push('turma=Todas');
    if (filterStatus) parts.push(`status=${filterStatus}`);
    else parts.push('status=Todos');
    if (filterNoLessonDays !== '' && filterNoLessonDays > 0) {
      parts.push(`sem aula ha ${filterNoLessonDays}+ dias`);
    } else parts.push('filtro sem aula=off');
    parts.push(
      `ordenacao=${sortBy === 'name' ? 'nome A-Z' : sortBy === 'xp' ? 'XP (maior primeiro)' : 'nivel (maior primeiro)'}`,
    );
    if (!isDemoMode() && totalFromApi != null && students.length < totalFromApi) {
      parts.push(`NOTA: lista na tela ${students.length}/${totalFromApi} alunos (exporta so a pagina carregada)`);
    }
    if (isDemoMode() && displayCount < filteredList.length) {
      parts.push(`NOTA: modo demo mostra ${displayCount}/${filteredList.length} (Carregar mais para incluir)`);
    }
    return parts.join(' | ');
  }, [
    search,
    searchDebounced,
    filterTurma,
    filterStatus,
    filterNoLessonDays,
    sortBy,
    classGroups,
    totalFromApi,
    students.length,
    displayCount,
    filteredList.length,
  ]);

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
    params.set('sortBy', sortBy);
    fetch(`${API_URL}/students?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items?.length) setStudents((prev) => [...prev, ...data.items]);
      })
      .finally(() => setLoadingMore(false));
  }, [searchDebounced, filterTurma, filterStatus, filterNoLessonDays, sortBy, students.length, totalFromApi, loadingMore]);

  const openModal = useCallback((s: StudentListItem) => setModalStudent(s), []);
  const clampFocus = useCallback((i: number) => Math.max(0, Math.min(i, displayedList.length - 1)), [displayedList.length]);

  useEffect(() => {
    setFocusedIndex((prev) => clampFocus(prev));
  }, [displayedList.length, clampFocus]);

  useEffect(() => {
    const el = itemRefs.current[focusedIndex];
    if (el) el.focus();
  }, [focusedIndex, rosterView]);

  useEffect(() => {
    const v = window.localStorage.getItem('orbitus-roster-view');
    if (v === 'table' || v === 'cards') setRosterView(v);
  }, []);

  const setRosterViewPersist = useCallback((v: 'cards' | 'table') => {
    setRosterView(v);
    window.localStorage.setItem('orbitus-roster-view', v);
  }, []);

  const showDemoBanner = isDemoMode();

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Roster — Orbitus Classroom RPG';
  }, []);

  if (loading) {
    return (
      <main id="main" className="page-shell">
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
    <main id="main" className="page-shell">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-orbitus-accent">Roster</h1>
          <p className="text-gray-400">
            Sua party de alunos · {displayedList.length}{isDemoMode() ? ` de ${filteredList.length}` : totalFromApi != null ? ` de ${totalFromApi}` : ''} aluno(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 touch-manipulation">
          <button
            type="button"
            onClick={() => {
              const csv = buildRosterCsv(
                displayedList.map((s) => ({
                  displayName: s.displayName ?? '',
                  fullName: s.fullName,
                  classGroupName: s.classGroup?.name ?? '',
                  level: s.level ?? 0,
                  xp: s.xp ?? 0,
                  status: s.status ?? '',
                })),
              );
              const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="min-h-11 rounded-lg border border-gray-600 px-4 py-2.5 text-sm text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-2"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            title="Inclui data, filtros aplicados e colunas de triagem (bloqueios, metas, última aula)"
            onClick={() => {
              const csv = buildRosterReportCsv({
                generatedAt: new Date(),
                filterDescription: rosterFilterDescription,
                rows: displayedList.map((s) => ({
                  displayName: s.displayName ?? '',
                  fullName: s.fullName,
                  classGroupName: s.classGroup?.name ?? '',
                  level: s.level ?? 0,
                  xp: s.xp ?? 0,
                  status: s.status ?? '',
                  activeBlockersCount: s.attentionHints?.activeBlockersCount,
                  overdueGoalsCount: s.attentionHints?.overdueGoalsCount,
                  daysSinceLastLesson: s.attentionHints?.daysSinceLastLesson,
                })),
              });
              const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `relatorio-roster-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="min-h-11 rounded-lg border border-orbitus-accent/40 bg-orbitus-accent/10 px-4 py-2.5 text-sm text-orbitus-accent hover:bg-orbitus-accent/20 sm:min-h-0 sm:py-2"
          >
            Relatório (CSV)
          </button>
          <Link href="/students/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orbitus-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 sm:min-h-0 sm:py-2">
            Cadastrar aluno
          </Link>
        </div>
      </div>

      {attentionQueue.length > 0 && (
        <section
          className="mb-6 rounded-xl border border-amber-500/35 bg-orbitus-card/90 p-4"
          aria-labelledby="attention-queue-heading"
        >
          <h2 id="attention-queue-heading" className="mb-3 text-sm font-semibold text-amber-200">
            Fila de atenção
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Prioridade por bloqueios ativos, metas atrasadas e falta de aula recente (7 dias).
          </p>
          <ul className="space-y-2">
            {attentionQueue.map((row) => (
              <li
                key={row.studentId}
                className="flex flex-col gap-2 rounded-lg border border-gray-700/60 bg-orbitus-dark/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/students/${row.studentId}`}
                  className="font-medium text-orbitus-accent hover:underline"
                >
                  {row.displayName}
                  {row.classGroup?.name ? (
                    <span className="ml-2 text-xs font-normal text-gray-500">· {row.classGroup.name}</span>
                  ) : null}
                </Link>
                <div className="flex flex-wrap gap-1">
                  {row.reasons.map((r, i) => (
                    <span
                      key={`${row.studentId}-${i}`}
                      className="rounded bg-gray-700/90 px-2 py-0.5 text-xs text-gray-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-6 flex flex-col gap-3 touch-manipulation sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 w-full min-w-0 rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none sm:min-h-0 sm:min-w-[200px] sm:w-auto"
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
          className="min-h-11 w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none sm:min-h-0 sm:w-auto"
        >
          <option value="">Todas as turmas</option>
          {classGroups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none sm:min-h-0 sm:w-auto"
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
            className="min-h-11 w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none sm:min-h-0 sm:w-auto"
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
          className="min-h-11 w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none sm:min-h-0 sm:w-auto"
          aria-label="Ordenar por"
        >
          <option value="name">Nome (A–Z)</option>
          <option value="xp">XP (maior primeiro)</option>
          <option value="level">Nível (maior primeiro)</option>
        </select>
        <div
          className="inline-flex w-full max-w-xs overflow-hidden rounded-lg border border-gray-600 sm:w-auto sm:max-w-none"
          role="group"
          aria-label="Visualização da lista"
        >
          <button
            type="button"
            aria-pressed={rosterView === 'cards'}
            onClick={() => setRosterViewPersist('cards')}
            className={`min-h-11 flex-1 px-3 py-2.5 text-sm sm:min-h-0 sm:flex-none sm:py-2 ${rosterView === 'cards' ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'bg-orbitus-dark text-gray-400 hover:text-white'}`}
          >
            Cards
          </button>
          <button
            type="button"
            aria-pressed={rosterView === 'table'}
            onClick={() => setRosterViewPersist('table')}
            className={`min-h-11 flex-1 border-l border-gray-600 px-3 py-2.5 text-sm sm:min-h-0 sm:flex-none sm:py-2 ${rosterView === 'table' ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'bg-orbitus-dark text-gray-400 hover:text-white'}`}
          >
            Tabela
          </button>
        </div>
        {(search.trim() || filterTurma || filterStatus || filterNoLessonDays !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSearchDebounced('');
              setFilterTurma('');
              setFilterStatus('');
              setFilterNoLessonDays('');
              router.replace(pathname);
            }}
            className="min-h-11 rounded-lg border border-gray-500 px-3 py-2.5 text-sm text-gray-400 hover:bg-orbitus-card hover:text-white sm:min-h-0 sm:py-2"
          >
            Limpar filtros
          </button>
        )}
        {displayedList.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { const nextIndex = clampFocus(focusedIndex - 1); setFocusedIndex(nextIndex); const student = displayedList[nextIndex]; if (student) openModal(student); }}
              className="rounded border border-gray-600 px-2 py-1 text-gray-400 hover:bg-orbitus-card"
              aria-label="Anterior"
            >
              ←
            </button>
            <span className="px-2 text-sm text-gray-500">{focusedIndex + 1} / {displayedList.length}</span>
            <button
              type="button"
              onClick={() => { const nextIndex = clampFocus(focusedIndex + 1); setFocusedIndex(nextIndex); const student = displayedList[nextIndex]; if (student) openModal(student); }}
              className="rounded border border-gray-600 px-2 py-1 text-gray-400 hover:bg-orbitus-card"
              aria-label="Próximo"
            >
              →
            </button>
          </div>
        )}
      </div>

      {rosterFiltersReady && (
        <p className="mb-3 text-xs text-gray-600">
          Busca, turma, status, filtro “sem aula” (modo API) e ordenação ficam salvos neste navegador. O atalho “Ver alunos”
          no Dashboard prioriza a turma do link e substitui a turma salva.
        </p>
      )}

      {displayedList.length > 0 && (
        <p className="mb-4 text-center text-xs text-gray-500">
          Dica: use ← → para navegar entre {rosterView === 'cards' ? 'os cards' : 'as linhas'} e Enter para abrir a ficha.
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
        onKeyDown={(e) => {
          if (displayedList.length === 0) return;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i - 1)); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); setFocusedIndex((i) => clampFocus(i + 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); const student = displayedList[focusedIndex]; if (student) openModal(student); }
        }}
      >
        {rosterView === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {displayedList.map((s, i) => (
              <motion.div
                key={s.id}
                ref={(el) => { itemRefs.current[i] = el; }}
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
                <AttentionHintsBadges hints={s.attentionHints} className="mt-2" variant="card" />
                <p className="mt-3 text-center text-sm text-orbitus-accent">Clique ou Enter para abrir ficha →</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-orbitus-card/80 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Aluno</th>
                  <th className="px-4 py-3 font-medium">Turma</th>
                  <th className="px-4 py-3 font-medium">Nível</th>
                  <th className="px-4 py-3 font-medium">XP</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Triagem</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.map((s, i) => {
                  const h = s.attentionHints;
                  return (
                    <tr
                      key={s.id}
                      ref={(el) => { itemRefs.current[i] = el; }}
                      tabIndex={i === focusedIndex ? 0 : -1}
                      aria-label={`Abrir ficha de ${s.displayName}`}
                      onClick={() => { setFocusedIndex(i); openModal(s); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); openModal(s); } }}
                      className={`cursor-pointer border-b border-gray-800 transition hover:bg-orbitus-card/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orbitus-accent/40 ${i === focusedIndex ? 'bg-orbitus-card/40' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="mr-2 inline-block w-6 text-center text-base" aria-hidden>
                          {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
                        </span>
                        {s.displayName}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{s.classGroup?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-300">{s.level ?? '—'}</td>
                      <td className="px-4 py-3 text-orbitus-xp">{s.xp ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {attentionHintsVisible(h) ? (
                          <AttentionHintsBadges hints={h} variant="table" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
