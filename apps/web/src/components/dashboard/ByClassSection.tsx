'use client';

import Link from 'next/link';
import type { ByClassRow } from '@/lib/api/dashboard';

interface Props {
  byClass: ByClassRow[];
}

export function ByClassSection({ byClass }: Props) {
  if (byClass.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="section-title mb-5 flex items-center gap-2">
        <span className="text-lg">🏫</span> Por turma
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {byClass.map((row) => (
          <div key={row.classGroupName} className="card-base p-4 group">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-semibold text-white">{row.classGroupName}</h3>
              {row.activeBlockers > 0 && (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400 ring-1 ring-red-500/30">
                  {row.activeBlockers} bloqueio{row.activeBlockers !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{row.studentCount} aluno{row.studentCount !== 1 ? 's' : ''}</span>
              <span className="text-orbitus-border">·</span>
              <span className="badge-xp">{row.totalXp} XP</span>
            </div>
            {row.classGroupId !== '_sem_turma' && (
              <Link href={`/roster?classGroupId=${row.classGroupId}`} className="mt-3 inline-flex items-center gap-1 text-xs text-orbitus-accent-bright hover:underline">
                Ver alunos →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
