export const ROSTER_FILTERS_STORAGE_KEY = 'orbitus-roster-filters';

export type RosterFiltersSnapshotV1 = {
  v: 1;
  search: string;
  filterTurma: string;
  filterStatus: string;
  filterNoLessonDays: number | '';
  sortBy: 'name' | 'xp' | 'level' | 'attention';
};

function isSortBy(v: unknown): v is RosterFiltersSnapshotV1['sortBy'] {
  return v === 'name' || v === 'xp' || v === 'level' || v === 'attention';
}

export function loadRosterFiltersSnapshot(): RosterFiltersSnapshotV1 | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROSTER_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== 'object') return null;
    const o = p as Record<string, unknown>;
    if (o.v !== 1) return null;
    const search = typeof o.search === 'string' ? o.search : '';
    const filterTurma = typeof o.filterTurma === 'string' ? o.filterTurma : '';
    const filterStatus = typeof o.filterStatus === 'string' ? o.filterStatus : '';
    let filterNoLessonDays: number | '' = '';
    if (o.filterNoLessonDays === '' || o.filterNoLessonDays === 7 || o.filterNoLessonDays === 14) {
      filterNoLessonDays = o.filterNoLessonDays;
    }
    const sortBy = isSortBy(o.sortBy) ? o.sortBy : 'name';
    return { v: 1, search, filterTurma, filterStatus, filterNoLessonDays, sortBy };
  } catch {
    return null;
  }
}

export function saveRosterFiltersSnapshot(s: Omit<RosterFiltersSnapshotV1, 'v'>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const payload: RosterFiltersSnapshotV1 = { v: 1, ...s };
    localStorage.setItem(ROSTER_FILTERS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
