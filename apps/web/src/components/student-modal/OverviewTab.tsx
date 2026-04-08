'use client';

import type { StudentSummary } from '@orbitus/shared';

interface Props {
  summary: StudentSummary;
  studentId: string;
  onNavigateToLesson: () => void;
  onClose: () => void;
}

export function OverviewTab({ summary, studentId, onNavigateToLesson, onClose }: Props) {
  return (
    <div className="space-y-4">
      {/* Skill bars */}
      {summary.skillBars.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Habilidades</h3>
          <div className="space-y-2.5">
            {summary.skillBars.map((sk) => (
              <div key={sk.skillId}>
                <div className="mb-1 flex justify-between text-xs">
                  <span style={{ color: sk.color ?? undefined }} className="font-medium">{sk.skillName}</span>
                  <span className="text-gray-500">Nível {sk.level} · {sk.currentXp} XP</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-orbitus-border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, sk.currentXp % 100)}%`, backgroundColor: sk.color ?? '#8b5cf6' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last lessons */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Últimas aulas</h3>
        {summary.lastLessons.length > 0 ? (
          <ul className="space-y-1.5">
            {summary.lastLessons.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-lg border border-orbitus-border/60 bg-orbitus-surface px-3 py-2 text-sm">
                <div>
                  <span className="text-gray-200">{l.topicName}</span>
                  <span className="ml-2 text-xs text-gray-500">{l.durationMinutes}min · {'★'.repeat(l.rating)}{'☆'.repeat(5 - l.rating)}</span>
                </div>
                <span className="badge-xp">+{l.xpEarned}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
            <p className="text-sm text-gray-500">Nenhuma aula registrada ainda.</p>
            <button
              type="button"
              onClick={onNavigateToLesson}
              className="mt-2 text-xs text-orbitus-accent-bright hover:underline"
            >
              Registrar primeira aula →
            </button>
          </div>
        )}
      </div>

      <a
        href={`/students/${studentId}`}
        onClick={onClose}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orbitus-accent-bright transition"
      >
        Ver ficha completa →
      </a>
    </div>
  );
}
