'use client';

import Link from 'next/link';
import type { AttentionQueueItem } from '@orbitus/shared';

interface Props {
  items: AttentionQueueItem[];
}

export function AttentionQueueBanner({ items }: Props) {
  if (items.length === 0) return null;

  const displayed = items.slice(0, 4);

  return (
    <section
      className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
      aria-labelledby="attention-queue-heading"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <h2 id="attention-queue-heading" className="text-xs font-semibold text-amber-300">
          Fila de atenção
        </h2>
        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
          {items.length}
        </span>
      </div>

      {/* Horizontal scroll of compact cards */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="list">
        {displayed.map((row) => (
          <Link
            key={row.studentId}
            href={`/students/${row.studentId}`}
            role="listitem"
            className="shrink-0 flex items-center gap-2 rounded-lg border border-amber-500/15 bg-[#141832] px-2.5 py-1.5 transition hover:border-amber-500/40 hover:bg-[#1a2040]"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate max-w-[120px]">{row.displayName}</p>
              {row.classGroup?.name && (
                <p className="text-[10px] text-gray-600 truncate">{row.classGroup.name}</p>
              )}
            </div>
          </Link>
        ))}
        {items.length > 4 && (
          <div className="shrink-0 flex items-center px-2 text-xs text-gray-600">
            +{items.length - 4} mais
          </div>
        )}
      </div>
    </section>
  );
}
