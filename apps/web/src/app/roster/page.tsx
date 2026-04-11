'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { isDemoMode } from '@/lib/mock-data';
import { StudentModal } from '@/components/StudentModal';
import { AttentionHintsBadges, attentionHintsVisible } from '@/components/AttentionHintsBadges';
import { buildRosterCsv, buildRosterReportCsv } from '@/lib/csv-export';
import { AttentionQueueBanner } from '@/components/roster/AttentionQueueBanner';
import { StudentCard } from '@/components/roster/StudentCard';
import { RosterFilters } from '@/components/roster/RosterFilters';
import { BulkLessonBar } from '@/components/roster/BulkLessonBar';
import { useRosterData } from '@/hooks/useRosterData';
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
  } = useRosterData();

  const [modalStudent, setModalStudent] = useState<StudentListItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFailedIds, setBulkFailedIds] = useState<Set<string>>(new Set());

  // Set of studentIds in the attention queue for O(1) lookup
  const attentionQueueIds = new Set(attentionQueue.map((q) => q.studentId));

  const openModal = useCallback((s: StudentListItem) => setModalStudent(s), []);
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

  // Keyboard shortcuts: / = focus search, Escape = clear/exit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't interfere with inputs/textareas
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
        if (modalStudent) {
          setModalStudent(null);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bulkMode, filters.search, modalStudent, setFilters]);

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

  if (loading) {
    return (
      <main id="main" className="page-shell">
        <div className="mb-6">
          <div className="mb-1 h-7 w-28 animate-pulse rounded bg-orbitus-border" />
          <div className="h-4 w-40 animate-pulse rounded bg-orbitus-border/70" />
        </div>
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Carregando alunos"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card-base p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-orbitus-border" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-orbitus-border" />
                  <div className="h-3 w-16 animate-pulse rounded bg-orbitus-border/70" />
                </div>
              </div>
              <div className="h-1.5 w-full animate-pulse rounded-full bg-orbitus-border" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="page-shell">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Roster</h1>
          <p className="text-gray-500 text-sm">
            {displayedList.length}
            {isDemoMode()
              ? ` de ${filteredList.length}`
              : totalFromApi != null
                ? ` de ${totalFromApi}`
                : ''}{' '}
            aluno(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 touch-manipulation">
          {/* Bulk mode toggle */}
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
            className={`min-h-11 px-4 py-2 text-sm sm:min-h-0 rounded-lg font-semibold transition ${
              bulkMode
                ? 'bg-orbitus-accent text-white'
                : 'border border-orbitus-border text-gray-400 hover:border-orbitus-accent/50 hover:text-orbitus-accent-bright'
            }`}
          >
            {bulkMode ? '⚡ Sair do lote' : '⚡ Aula em lote'}
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            className="btn-ghost min-h-11 px-4 py-2 text-sm sm:min-h-0"
          >
            CSV
          </button>
          <button
            type="button"
            title="Inclui data, filtros aplicados e colunas de triagem (bloqueios, metas, última aula)"
            onClick={downloadReportCsv}
            className="btn-secondary min-h-11 px-4 py-2 text-sm sm:min-h-0"
          >
            Relatório CSV
          </button>
          <Link href="/students/new" className="btn-primary min-h-11 px-4 py-2 text-sm sm:min-h-0">
            + Aluno
          </Link>
        </div>
      </div>

      <AttentionQueueBanner items={attentionQueue} />

      {/* RosterFilters — injeta ref no input de busca para atalho / */}
      <div className="mb-6 flex flex-col gap-2.5 touch-manipulation sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-auto">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Buscar por nome..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="input-field min-h-11 w-full min-w-0 sm:min-h-0 sm:min-w-[180px] sm:w-auto"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-orbitus-border px-1 py-0.5 text-[10px] text-gray-600 sm:block">
            /
          </span>
        </div>
        {/* Remaining filters delegated to RosterFilters (minus search input) */}
        <RosterFilters
          filters={filters}
          classGroups={classGroups}
          onChange={setFilters}
          onClear={clearFilters}
          hideSearch
        />
      </div>

      {/* Nav arrows */}
      {displayedList.length > 1 && !bulkMode && (
        <div className="mb-4 flex items-center gap-1 ml-auto w-fit">
          <button
            type="button"
            onClick={() => {
              const nextIndex = clampFocus(focusedIndex - 1);
              setFocusedIndex(nextIndex);
              const student = displayedList[nextIndex];
              if (student) openModal(student);
            }}
            className="rounded border border-orbitus-border px-2 py-1.5 text-xs text-gray-500 transition hover:bg-orbitus-card hover:text-white"
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
              if (student) openModal(student);
            }}
            className="rounded border border-orbitus-border px-2 py-1.5 text-xs text-gray-500 transition hover:bg-orbitus-card hover:text-white"
            aria-label="Próximo"
          >
            →
          </button>
        </div>
      )}

      {showDemoBanner && (
        <div className="mb-4 rounded-lg border border-orbitus-xp/30 bg-orbitus-xp/8 px-4 py-3 text-sm text-orbitus-xp">
          🎮 Modo demo — dados de exemplo. Clique num aluno para abrir a ficha.
        </div>
      )}

      {error && !showDemoBanner && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/8 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              retry();
            }}
            className="mt-2 rounded bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {displayedList.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-orbitus-border bg-orbitus-card/30 p-12 text-center">
          {filteredList.length === 0 ? (
            <div>
              <p className="mb-4 text-4xl">🧑‍🎓</p>
              <p className="mb-4 text-gray-400">Nenhum aluno ainda.</p>
              <Link href="/students/new" className="btn-primary inline-flex">
                + Cadastrar primeiro aluno
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum aluno corresponde aos filtros.</p>
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
            if (student) openModal(student);
          }
        }}
      >
        {filters.rosterView === 'cards' ? (
          <div
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${bulkMode ? 'pb-24' : ''}`}
            role="list"
          >
            {displayedList.map((s, i) => (
              <StudentCard
                key={s.id}
                student={s}
                index={i}
                focused={i === focusedIndex}
                itemRef={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => {
                  setFocusedIndex(i);
                  openModal(s);
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
          <div className={`overflow-x-auto rounded-xl border border-orbitus-border ${bulkMode ? 'pb-24' : ''}`}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-orbitus-border bg-orbitus-surface text-xs uppercase tracking-wider text-gray-500">
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
                      aria-label={`Abrir ficha de ${s.displayName}`}
                      onClick={() => {
                        if (bulkMode) {
                          toggleSelect(s.id);
                          return;
                        }
                        setFocusedIndex(i);
                        openModal(s);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (bulkMode) toggleSelect(s.id);
                          else openModal(s);
                        }
                      }}
                      className={`cursor-pointer border-b border-orbitus-border/60 transition hover:bg-orbitus-card/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orbitus-accent/40 ${i === focusedIndex ? 'bg-orbitus-card/40' : ''} ${inQueue ? 'border-l-4 border-l-amber-500' : ''} ${selectedIds.has(s.id) ? 'bg-orbitus-accent/10' : ''} ${bulkFailedIds.has(s.id) ? 'bg-red-500/10' : ''}`}
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

      {modalStudent && !bulkMode && (
        <StudentModal
          studentId={modalStudent.id}
          studentPreview={modalStudent}
          onClose={() => setModalStudent(null)}
        />
      )}

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
              exitBulkMode();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
