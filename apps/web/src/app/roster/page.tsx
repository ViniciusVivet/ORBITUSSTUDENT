'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { isDemoMode } from '@/lib/mock-data';
import { DetailPanel } from '@/components/DetailPanel';
import { AttentionHintsBadges, attentionHintsVisible } from '@/components/AttentionHintsBadges';
import { buildRosterCsv, buildRosterReportCsv } from '@/lib/csv-export';
import { AttentionQueueBanner } from '@/components/roster/AttentionQueueBanner';
import { StudentCard } from '@/components/roster/StudentCard';
import { RosterFilters } from '@/components/roster/RosterFilters';
import { BulkLessonBar } from '@/components/roster/BulkLessonBar';
import { SpaceSidebar } from '@/components/SpaceSidebar';
import { useRosterData } from '@/hooks/useRosterData';
import { getPlanetColors } from '@/lib/planetColors';
import type { StudentListItem } from '@orbitus/shared';

export default function RosterPageWrapper() {
  return (
    <Suspense>
      <RosterPage />
    </Suspense>
  );
}

function RosterPage() {
  const {
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
    rosterFilterDescription,
    setFilters,
    clearFilters,
    loadMore,
    retry,
    setError,
    attentionQueueExpanded,
    toggleAttentionQueueExpanded,
  } = useRosterData();

  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFailedIds, setBulkFailedIds] = useState<Set<string>>(new Set());

  // Set of studentIds in the attention queue for O(1) lookup
  const attentionQueueIds = new Set(attentionQueue.map((q) => q.studentId));

  // Build a map of groupId -> index for planet color cycling
  const groupIndexMap = new Map(classGroups.map((g, i) => [g.id, i]));

  const openPanel = useCallback((s: StudentListItem) => setSelectedStudent(s), []);
  const clampFocus = useCallback(
    (i: number) => Math.max(0, Math.min(i, displayedList.length - 1)),
    [displayedList.length],
  );

  useEffect(() => {
    setFocusedIndex((prev) => clampFocus(prev));
  }, [displayedList.length, clampFocus]);

  useEffect(() => {
    const el = itemRefs.current[focusedIndex];
    if (el) el.focus();
  }, [focusedIndex, filters.rosterView]);

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Roster — Orbitus Classroom RPG';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'Escape') {
        if (bulkMode) {
          setBulkMode(false);
          setSelectedIds(new Set());
          setBulkFailedIds(new Set());
          return;
        }
        if (filters.search) {
          setFilters({ search: '' });
          return;
        }
        if (selectedStudent) {
          setSelectedStudent(null);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bulkMode, filters.search, selectedStudent, setFilters]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(displayedList.map((s) => s.id)));
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds(new Set());
    setBulkFailedIds(new Set());
  }

  const selectedStudents = displayedList.filter((s) => selectedIds.has(s.id));
  const showDemoBanner = isDemoMode();

  function downloadCsv() {
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
  }

  function downloadReportCsv() {
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
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
        <SpaceSidebar
          classGroups={[]}
          selectedGroupId=""
          onSelect={() => undefined}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[#1a2040] px-4 py-3 shrink-0">
            <div className="h-8 w-48 animate-pulse rounded bg-[#1a2040]" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div
              className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              aria-busy="true"
              aria-label="Carregando alunos"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[#1a2040] bg-[#141832] p-4">
                  <div className="mx-auto mb-3 h-16 w-16 animate-pulse rounded-full bg-[#1a2040]" />
                  <div className="mb-2 h-3 w-3/4 mx-auto animate-pulse rounded bg-[#1a2040]" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-[#1a2040]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Left: SpaceSidebar (hidden on mobile) */}
      <SpaceSidebar
        classGroups={classGroups}
        selectedGroupId={filters.filterTurma}
        onSelect={(id) => setFilters({ filterTurma: id })}
      />

      {/* Center: main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 border-b border-[#1a2040] px-3 py-2.5 shrink-0 flex-wrap">
          {/* Title */}
          <div className="mr-2 min-w-0 hidden sm:block">
            <h1 className="text-sm font-bold text-white">Roster</h1>
            <p className="text-[10px] text-gray-600">
              {displayedList.length}
              {isDemoMode()
                ? ` de ${filteredList.length}`
                : totalFromApi != null
                ? ` de ${totalFromApi}`
                : ''}{' '}
              aluno(s)
            </p>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="input-field w-full text-sm py-1.5 pr-6"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-orbitus-border px-1 py-0.5 text-[9px] text-gray-700 sm:block">
              /
            </span>
          </div>

          {/* Filters */}
          <RosterFilters
            filters={filters}
            classGroups={classGroups}
            onChange={setFilters}
            onClear={clearFilters}
            hideSearch
          />

          {/* Bulk mode */}
          <button
            type="button"
            onClick={() => {
              if (bulkMode) {
                exitBulkMode();
              } else {
                setBulkMode(true);
                setSelectedIds(new Set());
                setBulkFailedIds(new Set());
              }
            }}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              bulkMode
                ? 'bg-orbitus-accent text-white'
                : 'border border-orbitus-border text-gray-400 hover:border-orbitus-accent/50 hover:text-orbitus-accent-bright'
            }`}
          >
            {bulkMode ? '⚡ Sair' : '⚡ Lote'}
          </button>

          {/* CSV buttons */}
          <button
            type="button"
            onClick={downloadCsv}
            className="shrink-0 btn-ghost py-1.5 px-3 text-xs"
          >
            CSV
          </button>
          <button
            type="button"
            title="Inclui data, filtros aplicados e colunas de triagem"
            onClick={downloadReportCsv}
            className="shrink-0 btn-secondary py-1.5 px-3 text-xs"
          >
            Relatório
          </button>

          {/* + Aluno */}
          <Link href="/students/new" className="shrink-0 btn-primary py-1.5 px-3 text-xs">
            + Aluno
          </Link>
        </header>

        {/* Mobile planet nav pills */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 px-3 pt-2 shrink-0 border-b border-[#1a2040]">
          <button
            type="button"
            onClick={() => setFilters({ filterTurma: '' })}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
              filters.filterTurma === ''
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'border border-[#1a2040] text-gray-500 hover:text-gray-300'
            }`}
          >
            ✦ Todas
          </button>
          {classGroups.map((g, i) => {
            const color = getPlanetColors(g.name, i);
            const isSelected = filters.filterTurma === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilters({ filterTurma: g.id })}
                className="rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition"
                style={{
                  background: isSelected ? color.bg : undefined,
                  borderColor: isSelected ? color.ring : '#1a2040',
                  color: isSelected ? color.primary : '#6b7280',
                }}
              >
                ● {g.name}
              </button>
            );
          })}
        </div>

        {/* Scrollable grid area */}
        <div id="main" className="flex-1 overflow-y-auto px-3 py-3">
          <AttentionQueueBanner
            items={attentionQueue}
            expanded={attentionQueueExpanded}
            onToggleExpand={toggleAttentionQueueExpanded}
          />

          {showDemoBanner && (
            <div className="mb-3 rounded-lg border border-orbitus-xp/30 bg-orbitus-xp/8 px-3 py-2 text-xs text-orbitus-xp">
              🎮 Modo demo — dados de exemplo. Clique num aluno para abrir o painel.
            </div>
          )}

          {error && !showDemoBanner && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  retry();
                }}
                className="mt-1.5 rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {displayedList.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-[#1a2040] bg-[#141832]/30 p-12 text-center">
              {filteredList.length === 0 ? (
                <div>
                  <p className="mb-4 text-4xl">🧑‍🎓</p>
                  <p className="mb-4 text-gray-400 text-sm">Nenhum aluno ainda.</p>
                  <Link href="/students/new" className="btn-primary inline-flex">
                    + Cadastrar primeiro aluno
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum aluno corresponde aos filtros.</p>
              )}
            </div>
          )}

          <div
            onKeyDown={(e) => {
              if (displayedList.length === 0 || bulkMode) return;
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setFocusedIndex((i) => clampFocus(i - 1));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setFocusedIndex((i) => clampFocus(i + 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const student = displayedList[focusedIndex];
                if (student) openPanel(student);
              }
            }}
          >
            {filters.rosterView === 'cards' ? (
              <div
                className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${bulkMode ? 'pb-24' : ''}`}
                role="list"
              >
                {displayedList.map((s, i) => (
                  <StudentCard
                    key={s.id}
                    student={s}
                    index={i}
                    focused={i === focusedIndex}
                    groupIndex={s.classGroup?.id ? (groupIndexMap.get(s.classGroup.id) ?? 0) : 0}
                    itemRef={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    onClick={() => {
                      setFocusedIndex(i);
                      openPanel(s);
                    }}
                    isInAttentionQueue={attentionQueueIds.has(s.id)}
                    selectionMode={bulkMode}
                    selected={selectedIds.has(s.id)}
                    onSelect={() => toggleSelect(s.id)}
                    bulkError={bulkFailedIds.has(s.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={`overflow-x-auto rounded-xl border border-[#1a2040] ${bulkMode ? 'pb-24' : ''}`}>
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1a2040] bg-[#111527] text-xs uppercase tracking-wider text-gray-500">
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
                      const inQueue = attentionQueueIds.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          ref={(el) => {
                            itemRefs.current[i] = el;
                          }}
                          tabIndex={i === focusedIndex ? 0 : -1}
                          aria-label={`Abrir painel de ${s.displayName}`}
                          onClick={() => {
                            if (bulkMode) {
                              toggleSelect(s.id);
                              return;
                            }
                            setFocusedIndex(i);
                            openPanel(s);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (bulkMode) toggleSelect(s.id);
                              else openPanel(s);
                            }
                          }}
                          className={`cursor-pointer border-b border-[#1a2040]/60 transition hover:bg-[#141832]/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orbitus-accent/40 ${i === focusedIndex ? 'bg-[#141832]/40' : ''} ${inQueue ? 'border-l-4 border-l-amber-500' : ''} ${selectedIds.has(s.id) ? 'bg-orbitus-accent/10' : ''} ${bulkFailedIds.has(s.id) ? 'bg-red-500/10' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-100">
                            {bulkMode && (
                              <input
                                type="checkbox"
                                readOnly
                                checked={selectedIds.has(s.id)}
                                className="mr-2 accent-orbitus-accent"
                              />
                            )}
                            <span className="mr-2 inline-block w-6 text-center text-base" aria-hidden>
                              {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
                            </span>
                            {s.displayName}
                            {inQueue && (
                              <span
                                className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                                aria-label="Na fila de atenção"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.classGroup?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="badge-level">{s.level ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge-xp">{s.xp ?? 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                s.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'
                              }
                            >
                              {s.status === 'active' ? 'ativo' : s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {attentionHintsVisible(h) ? (
                              <AttentionHintsBadges hints={h} variant="table" />
                            ) : (
                              <span className="text-gray-700">—</span>
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

          {/* Nav arrows */}
          {displayedList.length > 1 && !bulkMode && (
            <div className="mt-3 flex items-center gap-1 ml-auto w-fit">
              <button
                type="button"
                onClick={() => {
                  const nextIndex = clampFocus(focusedIndex - 1);
                  setFocusedIndex(nextIndex);
                  const student = displayedList[nextIndex];
                  if (student) openPanel(student);
                }}
                className="rounded border border-[#1a2040] px-2 py-1.5 text-xs text-gray-500 transition hover:bg-[#141832] hover:text-white"
                aria-label="Anterior"
              >
                ←
              </button>
              <span className="px-1.5 text-xs text-gray-600">
                {focusedIndex + 1}/{displayedList.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextIndex = clampFocus(focusedIndex + 1);
                  setFocusedIndex(nextIndex);
                  const student = displayedList[nextIndex];
                  if (student) openPanel(student);
                }}
                className="rounded border border-[#1a2040] px-2 py-1.5 text-xs text-gray-500 transition hover:bg-[#141832] hover:text-white"
                aria-label="Próximo"
              >
                →
              </button>
            </div>
          )}

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary px-8 disabled:opacity-50"
              >
                {loadingMore ? 'Carregando…' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>

        {/* Bulk lesson bar */}
        <AnimatePresence>
          {bulkMode && (
            <BulkLessonBar
              selectedStudents={selectedStudents}
              allStudents={displayedList}
              onSelectAll={selectAll}
              onCancel={exitBulkMode}
              onDone={(failedIds) => {
                setBulkFailedIds(failedIds);
                if (failedIds.size === 0) exitBulkMode();
              }}
              onRetryFailed={(ids) => {
                setSelectedIds(ids);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Right: DetailPanel */}
      <AnimatePresence>
        {selectedStudent && !bulkMode && (
          <DetailPanel
            studentId={selectedStudent.id}
            studentPreview={selectedStudent}
            planetColor={getPlanetColors(
              selectedStudent.classGroup?.name ?? '',
              selectedStudent.classGroup?.id
                ? (groupIndexMap.get(selectedStudent.classGroup.id) ?? 0)
                : 0,
            )}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
