/** Escapa celula CSV com separador ; e aspas duplas (RFC-style). */
export function escapeCsvCell(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export type RosterCsvRow = {
  displayName: string;
  fullName: string | null | undefined;
  classGroupName: string;
  level: number;
  xp: number;
  status: string;
};

/** Linha do relatório completo (filtro atual + triagem). */
export type RosterReportRow = RosterCsvRow & {
  activeBlockersCount?: number;
  overdueGoalsCount?: number;
  daysSinceLastLesson?: number | null;
};

function formatDaysSinceLesson(v: number | null | undefined): string {
  if (v === undefined) return '';
  if (v === null) return 'nunca teve aula registrada';
  return String(v);
}

function triageSummary(row: RosterReportRow): string {
  const parts: string[] = [];
  if ((row.activeBlockersCount ?? 0) > 0) {
    parts.push(row.activeBlockersCount === 1 ? 'Bloqueio ativo' : `${row.activeBlockersCount} bloqueios ativos`);
  }
  if ((row.overdueGoalsCount ?? 0) > 0) {
    parts.push(row.overdueGoalsCount === 1 ? 'Meta atrasada' : `${row.overdueGoalsCount} metas atrasadas`);
  }
  if (row.daysSinceLastLesson === undefined) {
    /* sem hint */
  } else if (row.daysSinceLastLesson === null) {
    parts.push('Sem aula registrada');
  } else if (row.daysSinceLastLesson >= 7) {
    parts.push('Sem aula recente (7+ dias)');
  }
  return parts.length > 0 ? parts.join(' | ') : '—';
}

/**
 * CSV com metadados do filtro atual e colunas de triagem (para auditoria / planilha).
 * Separador `;` — prefixar BOM UTF-8 no download.
 */
export function buildRosterReportCsv(opts: {
  generatedAt: Date;
  filterDescription: string;
  rows: RosterReportRow[];
}): string {
  const iso = opts.generatedAt.toISOString();
  const meta = [
    `Relatorio;Roster - Orbitus Classroom RPG`,
    `Gerado em;${escapeCsvCell(iso)}`,
    `Filtros aplicados;${escapeCsvCell(opts.filterDescription)}`,
    `Total de alunos nesta exportacao;${String(opts.rows.length)}`,
    '',
  ];
  const headers = [
    'Nome',
    'Nome completo',
    'Turma',
    'Nivel',
    'XP',
    'Status',
    'Bloqueios ativos',
    'Metas atrasadas',
    'Dias desde ultima aula',
    'Resumo triagem',
  ];
  const dataLines = opts.rows.map((s) =>
    [
      escapeCsvCell(s.displayName ?? ''),
      escapeCsvCell(s.fullName ?? ''),
      escapeCsvCell(s.classGroupName ?? ''),
      escapeCsvCell(String(s.level ?? 0)),
      escapeCsvCell(String(s.xp ?? 0)),
      escapeCsvCell(s.status ?? ''),
      escapeCsvCell(String(s.activeBlockersCount ?? '')),
      escapeCsvCell(String(s.overdueGoalsCount ?? '')),
      escapeCsvCell(formatDaysSinceLesson(s.daysSinceLastLesson)),
      escapeCsvCell(triageSummary(s)),
    ].join(';'),
  );
  return [...meta, headers.join(';'), ...dataLines].join('\r\n');
}

/** Monta conteudo CSV do roster (separador ;, BOM deve ser prefixado pelo chamador se quiser Excel). */
export function buildRosterCsv(rows: RosterCsvRow[]): string {
  const headers = ['Nome', 'Nome completo', 'Turma', 'Nível', 'XP', 'Status'];
  const lines = [
    headers.join(';'),
    ...rows.map((s) =>
      [
        escapeCsvCell(s.displayName ?? ''),
        escapeCsvCell(s.fullName ?? ''),
        escapeCsvCell(s.classGroupName ?? ''),
        escapeCsvCell(String(s.level ?? 0)),
        escapeCsvCell(String(s.xp ?? 0)),
        escapeCsvCell(s.status ?? ''),
      ].join(';'),
    ),
  ];
  return lines.join('\r\n');
}
