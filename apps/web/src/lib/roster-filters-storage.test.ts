import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ROSTER_FILTERS_STORAGE_KEY,
  loadRosterFiltersSnapshot,
  saveRosterFiltersSnapshot,
} from './roster-filters-storage';

const mem: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mem).forEach((k) => delete mem[k]);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v;
    },
    removeItem: (k: string) => {
      delete mem[k];
    },
    clear: () => {
      Object.keys(mem).forEach((k) => delete mem[k]);
    },
    length: 0,
    key: () => null,
  } as Storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadRosterFiltersSnapshot', () => {
  it('retorna null quando nao ha dados', () => {
    expect(loadRosterFiltersSnapshot()).toBeNull();
  });

  it('ignora JSON invalido', () => {
    localStorage.setItem(ROSTER_FILTERS_STORAGE_KEY, '{');
    expect(loadRosterFiltersSnapshot()).toBeNull();
  });

  it('ignora versao diferente de 1', () => {
    localStorage.setItem(ROSTER_FILTERS_STORAGE_KEY, JSON.stringify({ v: 2, search: 'x' }));
    expect(loadRosterFiltersSnapshot()).toBeNull();
  });
});

describe('saveRosterFiltersSnapshot / load', () => {
  it('round-trip com valores validos', () => {
    saveRosterFiltersSnapshot({
      search: 'ana',
      filterTurma: 'cg-1',
      filterStatus: 'active',
      filterNoLessonDays: 7,
      sortBy: 'xp',
    });
    expect(loadRosterFiltersSnapshot()).toEqual({
      v: 1,
      search: 'ana',
      filterTurma: 'cg-1',
      filterStatus: 'active',
      filterNoLessonDays: 7,
      sortBy: 'xp',
    });
  });

  it('normaliza sortBy invalido para name', () => {
    localStorage.setItem(
      ROSTER_FILTERS_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        search: '',
        filterTurma: '',
        filterStatus: '',
        filterNoLessonDays: '',
        sortBy: 'invalid',
      }),
    );
    expect(loadRosterFiltersSnapshot()?.sortBy).toBe('name');
  });
});
