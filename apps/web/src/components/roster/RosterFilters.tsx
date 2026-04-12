'use client';

import { isDemoMode } from '@/lib/mock-data';

export interface RosterFiltersState {
  search: string;
  filterTurma: string;
  filterStatus: string;
  filterNoLessonDays: number | '';
  sortBy: 'name' | 'xp' | 'level' | 'attention';
  rosterView: 'cards' | 'table';
}

interface Props {
  filters: RosterFiltersState;
  classGroups: { id: string; name: string }[];
  onChange: (filters: Partial<RosterFiltersState>) => void;
  onClear: () => void;
  /** Quando true, omite o input de busca (o pai renderiza o proprio com ref) */
  hideSearch?: boolean;
}

export function RosterFilters({ filters, classGroups, onChange, onClear, hideSearch = false }: Props) {
  const { search, filterTurma, filterStatus, filterNoLessonDays, sortBy, rosterView } = filters;
  const hasActiveFilters = !!(search.trim() || filterTurma || filterStatus || filterNoLessonDays !== '');

  return (
    <>
      {!hideSearch && (
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="input-field min-h-11 w-full min-w-0 sm:min-h-0 sm:min-w-[180px] sm:w-auto"
        />
      )}
      <select
        value={filterTurma}
        onChange={(e) => onChange({ filterTurma: e.target.value })}
        className="input-field min-h-11 w-full sm:min-h-0 sm:w-auto"
      >
        <option value="">Todas as turmas</option>
        {classGroups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select
        value={filterStatus}
        onChange={(e) => onChange({ filterStatus: e.target.value })}
        className="input-field min-h-11 w-full sm:min-h-0 sm:w-auto"
      >
        <option value="">Todos os status</option>
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
        <option value="archived">Arquivado</option>
      </select>
      {!isDemoMode() && (
        <select
          value={filterNoLessonDays === '' ? '' : filterNoLessonDays}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ filterNoLessonDays: v === '' ? '' : Number(v) });
          }}
          className="input-field min-h-11 w-full text-sm sm:min-h-0 sm:w-auto"
          aria-label="Filtro sem aula"
        >
          <option value="">Sem filtro de aula</option>
          <option value="7">Sem aula há 7+ dias</option>
          <option value="14">Sem aula há 14+ dias</option>
        </select>
      )}
      <select
        value={sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value as 'name' | 'xp' | 'level' | 'attention' })}
        className="input-field min-h-11 w-full text-sm sm:min-h-0 sm:w-auto"
        aria-label="Ordenar por"
      >
        <option value="name">Nome A–Z</option>
        <option value="xp">XP ↓</option>
        <option value="level">Nível ↓</option>
        <option value="attention">⚠ Atenção</option>
      </select>
      <div
        className="inline-flex overflow-hidden rounded-lg border border-orbitus-border sm:w-auto"
        role="group"
        aria-label="Visualização da lista"
      >
        <button
          type="button"
          aria-pressed={rosterView === 'cards'}
          onClick={() => onChange({ rosterView: 'cards' })}
          className={`min-h-11 flex-1 px-3 py-2 text-sm transition sm:min-h-0 sm:flex-none ${rosterView === 'cards' ? 'bg-orbitus-accent/20 text-orbitus-accent-bright' : 'bg-orbitus-surface text-gray-400 hover:text-white'}`}
        >
          Cards
        </button>
        <button
          type="button"
          aria-pressed={rosterView === 'table'}
          onClick={() => onChange({ rosterView: 'table' })}
          className={`min-h-11 flex-1 border-l border-orbitus-border px-3 py-2 text-sm transition sm:min-h-0 sm:flex-none ${rosterView === 'table' ? 'bg-orbitus-accent/20 text-orbitus-accent-bright' : 'bg-orbitus-surface text-gray-400 hover:text-white'}`}
        >
          Tabela
        </button>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 rounded-lg border border-orbitus-border px-3 py-2 text-sm text-gray-500 transition hover:border-red-500/40 hover:text-red-400 sm:min-h-0"
        >
          ✕ Limpar
        </button>
      )}
    </>
  );
}
