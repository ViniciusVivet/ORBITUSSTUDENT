import type { StudentAttentionHints } from '@orbitus/shared';

export function attentionHintsVisible(h?: StudentAttentionHints): boolean {
  if (!h) return false;
  return (
    h.activeBlockersCount > 0 ||
    h.overdueGoalsCount > 0 ||
    h.daysSinceLastLesson === null ||
    h.daysSinceLastLesson >= 7
  );
}

type AttentionHintsBadgesProps = {
  hints?: StudentAttentionHints;
  /** Ex.: mt-2 no card do Roster */
  className?: string;
  /** `card`: uppercase; `table`: compacto na tabela */
  variant?: 'card' | 'table';
};

export function AttentionHintsBadges({ hints, className = '', variant = 'card' }: AttentionHintsBadgesProps) {
  if (!attentionHintsVisible(hints)) return null;
  const h = hints!;
  const upper = variant === 'card' ? 'uppercase tracking-wide' : '';
  const base = 'rounded px-1.5 py-0.5 text-[10px] font-medium';

  return (
    <div className={`flex flex-wrap gap-1 ${className}`.trim()} aria-label="Sinais de atenção">
      {h.activeBlockersCount > 0 && (
        <span className={`${base} bg-amber-500/25 text-amber-300 ${upper}`}>
          Bloqueio{h.activeBlockersCount > 1 ? ` ×${h.activeBlockersCount}` : ''}
        </span>
      )}
      {h.overdueGoalsCount > 0 && (
        <span className={`${base} bg-red-500/25 text-red-300 ${upper}`}>
          Meta atrasada{h.overdueGoalsCount > 1 ? ` ×${h.overdueGoalsCount}` : ''}
        </span>
      )}
      {(h.daysSinceLastLesson === null || h.daysSinceLastLesson >= 7) && (
        <span
          className={`${base} bg-slate-600/50 text-slate-300 ${variant === 'card' ? upper : ''}`.trim()}
        >
          {variant === 'table' ? 'Sem aula' : 'Sem aula recente'}
        </span>
      )}
    </div>
  );
}
