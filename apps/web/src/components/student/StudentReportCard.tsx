'use client';

import type { StudentSummary } from '@orbitus/shared';
import type { BlockerItem } from '@/lib/api/blockers';
import type { GoalItem } from '@/lib/api/goals';

interface Props {
  summary: StudentSummary;
  blockers: BlockerItem[];
  goals: GoalItem[];
  generatedAtLabel: string;
}

function uniqueRecentTopics(summary: StudentSummary): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const lesson of summary.lastLessons) {
    const name = lesson.topicName || 'Aula Livre';
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(name);
    if (topics.length >= 4) break;
  }
  return topics;
}

function strongestSkills(summary: StudentSummary): string[] {
  return [...summary.skillBars]
    .sort((a, b) => b.currentXp - a.currentXp)
    .slice(0, 3)
    .map((skill) => `${skill.skillName} (nivel ${skill.level}, ${skill.currentXp} XP)`);
}

function nextSteps(blockers: BlockerItem[], goals: GoalItem[], summary: StudentSummary): string[] {
  const activeBlockers = blockers.filter((b) => b.status === 'active');
  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const out: string[] = [];

  if (activeBlockers[0]) {
    out.push(`Revisar ${activeBlockers[0].titleOrTopic} com exercicios guiados.`);
  }
  if (activeGoals[0]) {
    out.push(`Priorizar a meta: ${activeGoals[0].title}.`);
  }
  if (summary.lastLessons.length > 0) {
    out.push(`Continuar a partir de ${summary.lastLessons[0].topicName}.`);
  }
  if (out.length === 0) {
    out.push('Definir uma nova meta curta para a proxima aula.');
  }
  return out.slice(0, 3);
}

export function StudentReportCard({ summary, blockers, goals, generatedAtLabel }: Props) {
  const { student } = summary;
  const activeBlockers = blockers.filter((b) => b.status === 'active');
  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const recentTopics = uniqueRecentTopics(summary);
  const skills = strongestSkills(summary);
  const steps = nextSteps(blockers, goals, summary);

  return (
    <section className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orbitus-accent-bright">Relatorio pedagogico</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Resumo de acompanhamento</h2>
        </div>
        <p className="print-sheet-muted text-xs text-gray-500">Gerado em {generatedAtLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="print-sheet-row rounded-lg bg-orbitus-dark/50 p-3">
          <p className="text-xs text-gray-500">Progresso</p>
          <p className="mt-1 font-semibold text-white">Nivel {student.level} - {student.xp} XP</p>
        </div>
        <div className="print-sheet-row rounded-lg bg-orbitus-dark/50 p-3">
          <p className="text-xs text-gray-500">Aulas recentes</p>
          <p className="mt-1 font-semibold text-white">{summary.lastLessons.length}</p>
        </div>
        <div className="print-sheet-row rounded-lg bg-orbitus-dark/50 p-3">
          <p className="text-xs text-gray-500">Pontos de atencao</p>
          <p className="mt-1 font-semibold text-white">{activeBlockers.length} bloqueio(s)</p>
        </div>
      </div>

      <div className="mt-5 space-y-4 text-sm">
        <div>
          <h3 className="mb-1 font-semibold text-white">Conteudos trabalhados</h3>
          {recentTopics.length > 0 ? (
            <p className="print-sheet-muted text-gray-400">{recentTopics.join(', ')}.</p>
          ) : (
            <p className="print-sheet-muted text-gray-500">Ainda nao ha aulas registradas.</p>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-semibold text-white">Habilidades em destaque</h3>
          {skills.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-gray-400 print:text-gray-700">
              {skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          ) : (
            <p className="print-sheet-muted text-gray-500">Sem dados de habilidades ainda.</p>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-semibold text-white">Dificuldades e metas</h3>
          {activeBlockers.length === 0 && activeGoals.length === 0 ? (
            <p className="print-sheet-muted text-gray-500">Nenhum bloqueio ou meta ativa no momento.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-gray-400 print:text-gray-700">
              {activeBlockers.slice(0, 3).map((b) => (
                <li key={b.id}>Bloqueio: {b.titleOrTopic} (severidade {b.severity}).</li>
              ))}
              {activeGoals.slice(0, 3).map((g) => (
                <li key={g.id}>Meta: {g.title} ({g.status}).</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-semibold text-white">Proximos passos sugeridos</h3>
          <ol className="list-decimal space-y-1 pl-5 text-gray-400 print:text-gray-700">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      </div>
    </section>
  );
}
