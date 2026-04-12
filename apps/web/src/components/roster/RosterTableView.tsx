'use client';

import type { StudentListItem } from '@orbitus/shared';
import { AttentionHintsBadges, attentionHintsVisible } from '@/components/AttentionHintsBadges';

interface Props {
  students: StudentListItem[];
  focusedIndex: number;
  bulkMode: boolean;
  selectedIds: Set<string>;
  bulkFailedIds: Set<string>;
  attentionQueueIds: Set<string>;
  itemRefs: React.MutableRefObject<(HTMLDivElement | HTMLTableRowElement | null)[]>;
  onOpenPanel: (s: StudentListItem) => void;
  onToggleSelect: (id: string) => void;
  onSetFocusedIndex: (i: number) => void;
}

export function RosterTableView({
  students,
  focusedIndex,
  bulkMode,
  selectedIds,
  bulkFailedIds,
  attentionQueueIds,
  itemRefs,
  onOpenPanel,
  onToggleSelect,
  onSetFocusedIndex,
}: Props) {
  return (
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
          {students.map((s, i) => {
            const h = s.attentionHints;
            const inQueue = attentionQueueIds.has(s.id);
            return (
              <tr
                key={s.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                tabIndex={i === focusedIndex ? 0 : -1}
                aria-label={`Abrir painel de ${s.displayName}`}
                onClick={() => {
                  if (bulkMode) { onToggleSelect(s.id); return; }
                  onSetFocusedIndex(i);
                  onOpenPanel(s);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (bulkMode) onToggleSelect(s.id);
                    else onOpenPanel(s);
                  }
                }}
                className={`cursor-pointer border-b border-[#1a2040]/60 transition hover:bg-[#141832]/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orbitus-accent/40 ${i === focusedIndex ? 'bg-[#141832]/40' : ''} ${inQueue ? 'border-l-4 border-l-amber-500' : ''} ${selectedIds.has(s.id) ? 'bg-orbitus-accent/10' : ''} ${bulkFailedIds.has(s.id) ? 'bg-red-500/10' : ''}`}
              >
                <td className="px-4 py-3 font-medium text-gray-100">
                  {bulkMode && (
                    <input type="checkbox" readOnly checked={selectedIds.has(s.id)} className="mr-2 accent-orbitus-accent" />
                  )}
                  <span className="mr-2 inline-block w-6 text-center text-base" aria-hidden>
                    {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
                  </span>
                  {s.displayName}
                  {inQueue && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-label="Na fila de atenção" />
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
                  <span className={s.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}>
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
  );
}
