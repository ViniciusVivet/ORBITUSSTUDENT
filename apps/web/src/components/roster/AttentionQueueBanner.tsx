'use client';

import Link from 'next/link';
import type { AttentionQueueItem } from '@orbitus/shared';

interface Props {
  items: AttentionQueueItem[];
}

export function AttentionQueueBanner({ items }: Props) {
  if (items.length === 0) return null;

  const displayed = items.slice(0, 6);

  return (
    <section
      className="mb-6 card-base border-amber-500/25 bg-amber-500/5 p-4"
      aria-labelledby="attention-queue-heading"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <h2 id="attention-queue-heading" className="text-sm font-semibold text-amber-300">
          Fila de atenção
        </h2>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
          {items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {displayed.map((row) => (
          <li
            key={row.studentId}
            className="flex flex-col gap-2 rounded-lg border border-orbitus-border/60 bg-orbitus-dark/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href={`/students/${row.studentId}`}
              className="font-medium text-gray-200 hover:text-orbitus-accent-bright transition"
            >
              {row.displayName}
              {row.classGroup?.name ? (
                <span className="ml-2 text-xs font-normal text-gray-500">· {row.classGroup.name}</span>
              ) : null}
            </Link>
            <div className="flex flex-wrap gap-1">
              {row.reasons.map((r, i) => (
                <span
                  key={`${row.studentId}-${i}`}
                  className="rounded-full bg-orbitus-border px-2.5 py-0.5 text-xs text-gray-300"
                >
                  {r}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
