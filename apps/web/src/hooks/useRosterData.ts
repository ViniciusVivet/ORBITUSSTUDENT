'use client';

import { useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { AttentionQueueItem, StudentListItem } from '@orbitus/shared';
import { isDemoMode } from '@/lib/mock-data';
import { fetchStudents, fetchAttentionQueue } from '@/lib/api/students';
import { getToken } from '@/lib/api/client';
import { loadRosterFiltersSnapshot, saveRosterFiltersSnapshot } from '@/lib/roster-filters-storage';

const PAGE_SIZE = 20;

function attentionScore(s: StudentListItem): number {
  const h = s.attentionHints;
  if (!h) return 0;
  return (h.activeBlockersCount ?? 0) * 3 +
    (h.overdueGoalsCount ?? 0) * 2 +
    (h.daysSinceLastLesson === null ? 5 : h.daysSinceLastLesson >= 7 ? 3 : 0);
}

export interface RosterFiltersState {
  search: string;
  filterTurma: string;
  filterStatus: string;
  filterNoLessonDays: number | '';
  sortBy: 'name' | 'xp' | 'level' | 'attention';
  rosterView: 'cards' | 'table';
}

export interface UseRosterDataReturn {
  students: StudentListItem[];
  loading: boolean;
  error: string;
  attentionQueue: AttentionQueueItem[];
  filters: RosterFiltersState;
  displayedList: StudentListItem[];
  filteredList: StudentListItem[];
  classGroups: { id: string; name: string }[];
  totalFromApi: number | null;
  loadingMore: boolean;
  hasMore: boolean;
  displayCount: number;
  rosterFilterDescription: string;
  attentionQueueExpanded: boolean;
  toggleAttentionQueueExpanded: () => void;
  setFilters: (partial: Partial<RosterFiltersState>) => void;
  clearFilters: () => void;
  loadMore: () => void;
  retry: () => void;
  setError: (e: string) => void;
}

export function useRosterData(): UseRosterDataReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attentionQueue, setAttentionQueue] = useState<AttentionQueueItem[]>([]);
  const [totalFromApi, setTotalFromApi] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [attentionQueueExpanded, setAttentionQueueExpanded] = useState(false);
  const [rosterFiltersReady, setRosterFiltersReady] = useState(false);
  const rosterFiltersHydratedRef = useRef(false);

  const [filters, setFiltersState] = useState<RosterFiltersState>({
    search: '',
    filterTurma: searchParams.get('classGroupId') ?? '',
    filterStatus: '',
    filterNoLessonDays: '',
    sortBy: 'name',
    rosterView: 'cards',
  });

  const setFilters = useCallback((partial: Partial<RosterFiltersState>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...partial };
      // Sync turma change to URL
      if ('filterTurma' in partial) {
        const params = new URLSearchParams(searchParams.toString());
        if (partial.filterTurma) params.set('classGroupId', partial.filterTurma);
        else params.delete('classGroupId');
        const q = params.toString();
        router.replace(q ? `${pathname}?${q}` : pathname);
      }
      // Persist view toggle
      if ('rosterView' in partial && partial.rosterView) {
        window.localStorage.setItem('orbitus-roster-view', partial.rosterView);
      }
      return next;
    });
  }, [searchParams, router, pathname]);

  const clearFilters = useCallback(() => {
    setFiltersState((prev) => ({
      ...prev,
      search: '',
      filterTurma: '',
      filterStatus: '',
      filterNoLessonDays: '',
    }));
    router.replace(pathname);
  }, [router, pathname]);

  // Hydrate filters from localStorage (before paint)
  useLayoutEffect(() => {
    if (rosterFiltersHydratedRef.current) return;
    rosterFiltersHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const urlTurma = searchParams.get('classGroupId')?.trim() ?? '';
    const snap = loadRosterFiltersSnapshot();
    if (snap) {
      setFiltersState((prev) => ({
        ...prev,
        filterTurma: urlTurma || snap.filterTurma,
        search: snap.search,
        filterStatus: snap.filterStatus,
        filterNoLessonDays: snap.filterNoLessonDays,
        sortBy: snap.sortBy,
      }));
    }
    // Restore persisted view
    const savedView = window.localStorage.getItem('orbitus-roster-view');
    if (savedView === 'table' || savedView === 'cards') {
      setFiltersState((prev) => ({ ...prev, rosterView: savedView }));
    }
    setRosterFiltersReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL classGroupId param change (e.g. Dashboard link)
  useEffect(() => {
    if (!rosterFiltersReady) return;
    const q = searchParams.get('classGroupId')?.trim() ?? '';
    if (q) setFiltersState((prev) => ({ ...prev, filterTurma: q }));
  }, [searchParams, rosterFiltersReady]);

  // Persist filters to localStorage
  useEffect(() => {
    if (!rosterFiltersReady) return;
    saveRosterFiltersSnapshot({
      search: filters.search,
      filterTurma: filters.filterTurma,
      filterStatus: filters.filterStatus,
      filterNoLessonDays: filters.filterNoLessonDays,
      sortBy: filters.sortBy,
    });
  }, [rosterFiltersReady, filters.search, filters.filterTurma, filters.filterStatus, filters.filterNoLessonDays, filters.sortBy]);

  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(filters.search), 400);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  // Fetch students
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (!rosterFiltersReady) return;

    setLoading(true);
    fetchStudents({
      search: searchDebounced,
      classGroupId: filters.filterTurma,
      status: filters.filterStatus,
      noLessonSinceDays: filters.filterNoLessonDays,
      sortBy: filters.sortBy === 'attention' ? 'name' : filters.sortBy,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((data) => {
        setStudents(data.items);
        setTotalFromApi(data.total || null);
        setError('');
        setDisplayCount(PAGE_SIZE);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('401')) setError('Sessão expirada — faça login novamente.');
        else if (msg.includes('500') || msg.includes('503')) setError(`Erro interno na API: ${msg}`);
        else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) setError('Sem conexão com a API. Verifique se está online.');
        else setError(msg || 'Falha ao carregar alunos.');
      })
      .finally(() => setLoading(false));
  }, [rosterFiltersReady, searchDebounced, filters.filterTurma, filters.filterStatus, filters.filterNoLessonDays, filters.sortBy, retryTrigger]);

  // Fetch attention queue (12 normal, 30 expanded)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchAttentionQueue(attentionQueueExpanded ? 30 : 12).then(setAttentionQueue).catch(() => setAttentionQueue([]));
  }, [retryTrigger, attentionQueueExpanded]);

  const classGroups = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.classGroup?.id) map.set(s.classGroup.id, s.classGroup.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const filteredList = useMemo(() => {
    if (!isDemoMode()) {
      if (filters.sortBy === 'attention') return [...students].sort((a, b) => attentionScore(b) - attentionScore(a));
      return students;
    }
    const list = students.filter((s) => {
      const matchSearch = !filters.search.trim() || s.displayName.toLowerCase().includes(filters.search.toLowerCase()) || (s.fullName?.toLowerCase().includes(filters.search.toLowerCase()));
      const matchTurma = !filters.filterTurma || s.classGroup?.id === filters.filterTurma;
      const matchStatus = !filters.filterStatus || s.status === filters.filterStatus;
      return matchSearch && matchTurma && matchStatus;
    });
    return [...list].sort((a, b) => {
      if (filters.sortBy === 'name') return (a.displayName ?? '').localeCompare(b.displayName ?? '', 'pt-BR');
      if (filters.sortBy === 'xp') return (b.xp ?? 0) - (a.xp ?? 0);
      if (filters.sortBy === 'level') return (b.level ?? 0) - (a.level ?? 0);
      if (filters.sortBy === 'attention') return attentionScore(b) - attentionScore(a);
      return 0;
    });
  }, [students, filters.search, filters.filterTurma, filters.filterStatus, filters.sortBy]);

  const displayedList = useMemo(() => {
    if (isDemoMode()) return filteredList.slice(0, displayCount);
    return filteredList;
  }, [filteredList, displayCount]);

  const hasMore = isDemoMode()
    ? displayCount < filteredList.length
    : totalFromApi != null && students.length < totalFromApi && !loadingMore;

  const loadMore = useCallback(() => {
    if (isDemoMode()) {
      setDisplayCount((c) => c + PAGE_SIZE);
      return;
    }
    const token = getToken();
    if (!token || loadingMore || totalFromApi == null || students.length >= totalFromApi) return;
    setLoadingMore(true);
    fetchStudents({
      search: searchDebounced,
      classGroupId: filters.filterTurma,
      status: filters.filterStatus,
      noLessonSinceDays: filters.filterNoLessonDays,
      sortBy: filters.sortBy === 'attention' ? 'name' : filters.sortBy,
      limit: PAGE_SIZE,
      offset: students.length,
    })
      .then((data) => {
        if (data.items.length) setStudents((prev) => [...prev, ...data.items]);
      })
      .finally(() => setLoadingMore(false));
  }, [searchDebounced, filters.filterTurma, filters.filterStatus, filters.filterNoLessonDays, filters.sortBy, students.length, totalFromApi, loadingMore]);

  const retry = useCallback(() => {
    setError('');
    setRetryTrigger((t) => t + 1);
  }, []);

  const toggleAttentionQueueExpanded = useCallback(() => {
    setAttentionQueueExpanded((v) => !v);
  }, []);

  const rosterFilterDescription = useMemo(() => {
    const parts: string[] = [];
    const q = isDemoMode() ? filters.search.trim() : searchDebounced.trim();
    if (q) parts.push(`busca="${q}"`);
    if (filters.filterTurma) {
      const name = classGroups.find((g) => g.id === filters.filterTurma)?.name ?? filters.filterTurma;
      parts.push(`turma=${name}`);
    } else parts.push('turma=Todas');
    if (filters.filterStatus) parts.push(`status=${filters.filterStatus}`);
    else parts.push('status=Todos');
    if (filters.filterNoLessonDays !== '' && filters.filterNoLessonDays > 0) {
      parts.push(`sem aula ha ${filters.filterNoLessonDays}+ dias`);
    } else parts.push('filtro sem aula=off');
    parts.push(
      `ordenacao=${filters.sortBy === 'name' ? 'nome A-Z' : filters.sortBy === 'xp' ? 'XP maior' : filters.sortBy === 'level' ? 'nivel maior' : 'maior atenção primeiro'}`,
    );
    if (!isDemoMode() && totalFromApi != null && students.length < totalFromApi) {
      parts.push(`NOTA: lista na tela ${students.length}/${totalFromApi} alunos (exporta so a pagina carregada)`);
    }
    if (isDemoMode() && displayCount < filteredList.length) {
      parts.push(`NOTA: modo demo mostra ${displayCount}/${filteredList.length} (Carregar mais para incluir)`);
    }
    return parts.join(' | ');
  }, [filters, searchDebounced, classGroups, totalFromApi, students.length, displayCount, filteredList.length]);

  return {
    students,
    loading,
    error,
    attentionQueue,
    filters,
    displayedList,
    filteredList,
    classGroups,
    totalFromApi,
    loadingMore,
    hasMore,
    displayCount,
    rosterFilterDescription,
    setFilters,
    clearFilters,
    loadMore,
    retry,
    setError,
    attentionQueueExpanded,
    toggleAttentionQueueExpanded,
  };
}
