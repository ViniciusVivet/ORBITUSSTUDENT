'use client';

import { useState } from 'react';
import type { StudentSummary } from '@orbitus/shared';
import type { BlockerItem } from '@/lib/api/blockers';
import type { GoalItem } from '@/lib/api/goals';
import { sendAiChat } from '@/lib/api/dashboard';

interface Props {
  summary: StudentSummary;
  blockers: BlockerItem[];
  goals: GoalItem[];
}

const ACTIONS = [
  { id: 'summary', label: 'Resumir evolucao' },
  { id: 'nextLesson', label: 'Sugerir proxima aula' },
  { id: 'observation', label: 'Gerar observacao' },
] as const;

function buildStudentContext(summary: StudentSummary, blockers: BlockerItem[], goals: GoalItem[]): string {
  const { student } = summary;
  const lessons = summary.lastLessons
    .map((l) => `- ${l.topicName}, ${l.durationMinutes}min, nota ${l.rating}, ${l.xpEarned} XP${l.notes ? `, nota: ${l.notes}` : ''}`)
    .join('\n') || '- Nenhuma aula registrada';
  const activeBlockers = blockers
    .filter((b) => b.status === 'active')
    .map((b) => `- ${b.titleOrTopic}, severidade ${b.severity}${b.observation ? `, obs: ${b.observation}` : ''}`)
    .join('\n') || '- Nenhum bloqueio ativo';
  const activeGoals = goals
    .filter((g) => g.status !== 'completed')
    .map((g) => `- ${g.title}, status ${g.status}${g.deadlineAt ? `, prazo ${g.deadlineAt}` : ''}`)
    .join('\n') || '- Nenhuma meta ativa';
  const skills = summary.skillBars
    .map((s) => `- ${s.skillName}: nivel ${s.level}, ${s.currentXp} XP`)
    .join('\n') || '- Sem habilidades registradas';

  return [
    `Aluno: ${student.displayName}`,
    `Turma: ${student.classGroup?.name ?? 'Sem turma'}`,
    `Nivel: ${student.level}`,
    `XP: ${student.xp}`,
    '',
    'Ultimas aulas:',
    lessons,
    '',
    'Habilidades:',
    skills,
    '',
    'Bloqueios ativos:',
    activeBlockers,
    '',
    'Metas ativas:',
    activeGoals,
  ].join('\n');
}

function promptForAction(action: typeof ACTIONS[number]['id'], context: string): string {
  if (action === 'summary') {
    return `${context}\n\nEscreva um resumo pedagogico objetivo desse aluno em ate 6 linhas, com linguagem de professor de programacao/informatica.`;
  }
  if (action === 'nextLesson') {
    return `${context}\n\nSugira a proxima aula para esse aluno. Responda com objetivo, conteudo, atividade pratica e criterio de sucesso.`;
  }
  return `${context}\n\nCrie uma observacao profissional curta para registrar na ficha do aluno, mencionando progresso, dificuldade e proximo passo.`;
}

export function StudentAiAssistant({ summary, blockers, goals }: Props) {
  const [reply, setReply] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function runAction(action: typeof ACTIONS[number]['id']) {
    setLoadingAction(action);
    setError('');
    const context = buildStudentContext(summary, blockers, goals);
    try {
      const data = await sendAiChat(promptForAction(action, context));
      setReply(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar assistente.');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="print:hidden rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-orbitus-accent-bright">Assistente IA</p>
        <h2 className="mt-1 font-semibold text-white">Ajuda contextual do aluno</h2>
        <p className="mt-1 text-sm text-gray-500">Use para preparar a proxima aula ou transformar dados em texto pedagogico.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => void runAction(action.id)}
            disabled={loadingAction !== null}
            className="rounded-lg border border-orbitus-accent/40 bg-orbitus-accent/10 px-3 py-2 text-sm font-medium text-orbitus-accent-bright hover:bg-orbitus-accent/20 disabled:opacity-50"
          >
            {loadingAction === action.id ? 'Gerando...' : action.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}

      {reply && (
        <div className="mt-4 rounded-lg border border-orbitus-border bg-orbitus-surface p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{reply}</p>
        </div>
      )}
    </section>
  );
}
