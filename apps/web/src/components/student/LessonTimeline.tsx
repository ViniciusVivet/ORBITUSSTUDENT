'use client';

import type { StudentSummary } from '@orbitus/shared';

interface Props {
  lessons: StudentSummary['lastLessons'];
}

export function LessonTimeline({ lessons }: Props) {
  return (
    <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <h2 className="mb-4 font-semibold text-white">Últimas aulas</h2>
      {lessons.length === 0 ? (
        <p className="print-sheet-muted text-gray-500">Nenhuma aula registrada ainda.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-600 print:bg-gray-400" aria-hidden />
          <ul className="space-y-0">
            {lessons.map((l) => (
              <li key={l.id} className="relative flex gap-4 pb-4 last:pb-0">
                <div className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 rounded-full bg-orbitus-accent ring-4 ring-orbitus-card print:ring-white" aria-hidden />
                <div className="print-sheet-row min-w-0 flex-1 rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
                  <p className="font-medium text-white">{l.topicName}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(l.heldAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 text-orbitus-xp">+{l.xpEarned} XP · {l.durationMinutes} min</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
