import { describe, it, expect } from 'vitest';
import { escapeCsvCell, buildRosterCsv, buildRosterReportCsv } from './csv-export';

describe('escapeCsvCell', () => {
  it('envolve em aspas e duplica aspas internas', () => {
    expect(escapeCsvCell('a')).toBe('"a"');
    expect(escapeCsvCell('diz "oi"')).toBe('"diz ""oi"""');
  });
});

describe('buildRosterCsv', () => {
  it('gera cabecalho e linhas com separador ;', () => {
    const csv = buildRosterCsv([
      {
        displayName: 'Joao',
        fullName: null,
        classGroupName: 'Turma A',
        level: 2,
        xp: 100,
        status: 'active',
      },
    ]);
    expect(csv).toContain('Nome;Nome completo;Turma');
    expect(csv).toContain('"Joao"');
    expect(csv).toContain('"Turma A"');
    expect(csv).toContain('"100"');
  });
});

describe('buildRosterReportCsv', () => {
  it('inclui metadados, filtros e colunas de triagem', () => {
    const csv = buildRosterReportCsv({
      generatedAt: new Date('2026-02-10T15:00:00.000Z'),
      filterDescription: 'turma=Turma A',
      rows: [
        {
          displayName: 'Ana',
          fullName: null,
          classGroupName: 'Turma A',
          level: 1,
          xp: 50,
          status: 'active',
          activeBlockersCount: 1,
          overdueGoalsCount: 0,
          daysSinceLastLesson: 10,
        },
      ],
    });
    expect(csv).toContain('Filtros aplicados');
    expect(csv).toContain('turma=Turma A');
    expect(csv).toContain('Bloqueios ativos');
    expect(csv).toContain('"Ana"');
    expect(csv).toContain('Bloqueio ativo');
  });
});
