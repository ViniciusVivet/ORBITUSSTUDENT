'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import { createGoal, updateGoal, type GoalItem } from '@/lib/api/goals';

interface Props {
  studentId: string;
  goals: GoalItem[];
  onUpdate: () => void;
}

export function GoalsList({ studentId, goals: initialGoals, onUpdate }: Props) {
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState('');

  async function handleAddGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('goalTitle') as HTMLInputElement)?.value?.trim();
    const deadline = (form.elements.namedItem('goalDeadline') as HTMLInputElement)?.value || null;

    setGoalError('');
    if (!title) { setGoalError('Preencha o título da meta.'); return; }

    setGoalSubmitting(true);
    try {
      const newGoal = await createGoal(studentId, {
        title,
        deadlineAt: deadline || undefined,
      });
      setGoals((prev) => [...prev, {
        id: newGoal.id,
        studentId,
        title,
        description: newGoal.description ?? null,
        status: newGoal.status ?? 'pending',
        deadlineAt: newGoal.deadlineAt ?? deadline,
        completedAt: newGoal.completedAt ?? null,
        createdAt: newGoal.createdAt ?? new Date().toISOString(),
      }]);
      setShowGoalForm(false);
      form.reset();
      onUpdate();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      setGoalSubmitting(false);
    }
  }

  async function handleUpdateGoalStatus(goalId: string, status: 'in_progress' | 'completed') {
    if (isDemoMode() || !goalId) {
      setGoals((prev) => prev.map((x) => (x.id === goalId ? {
        ...x,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : x.completedAt,
      } : x)));
      onUpdate();
      return;
    }
    try {
      await updateGoal(studentId, goalId, { status });
      setGoals((prev) => prev.map((x) => (x.id === goalId ? {
        ...x,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : x.completedAt,
      } : x)));
      onUpdate();
    } catch {
      // silently fail
    }
  }

  return (
    <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Metas</h2>
        <button
          type="button"
          onClick={() => setShowGoalForm((v) => !v)}
          className="rounded bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 print:hidden"
        >
          {showGoalForm ? 'Fechar' : 'Adicionar meta'}
        </button>
      </div>

      {showGoalForm && (
        <form onSubmit={handleAddGoal} className="mb-4 space-y-3 print:hidden">
          <input
            name="goalTitle"
            placeholder="Título da meta"
            required
            className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
            aria-invalid={!!goalError}
            aria-describedby={goalError ? 'goal-error' : undefined}
          />
          <input
            name="goalDeadline"
            type="date"
            className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
          />
          {goalError && <p id="goal-error" className="text-sm text-red-400" role="alert">{goalError}</p>}
          <button
            type="submit"
            disabled={goalSubmitting}
            className="rounded bg-blue-500/20 px-4 py-2 text-sm text-blue-400 disabled:opacity-50"
          >
            Salvar
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-gray-500">Nenhuma meta cadastrada.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => (
            <li key={g.id} className="print-sheet-row flex items-center justify-between rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
              <div>
                <span className={g.status === 'completed' ? 'text-gray-500 line-through print:text-gray-500' : 'font-medium text-white'}>
                  {g.title}
                </span>
                {g.deadlineAt && (
                  <>
                    <span className="ml-2 text-gray-500">até {new Date(g.deadlineAt).toLocaleDateString('pt-BR')}</span>
                    {g.status !== 'completed' && (() => {
                      const deadline = new Date(g.deadlineAt!);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      deadline.setHours(0, 0, 0, 0);
                      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      if (daysLeft < 0) return <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">Atrasado</span>;
                      if (daysLeft === 0) return <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">Prazo hoje</span>;
                      if (daysLeft <= 3) return <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">Prazo em {daysLeft} dia(s)</span>;
                      return null;
                    })()}
                  </>
                )}
                <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${g.status === 'completed' ? 'bg-green-500/20 text-green-400' : g.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {g.status === 'completed' ? 'concluída' : g.status === 'in_progress' ? 'em andamento' : 'pendente'}
                </span>
              </div>
              {g.status !== 'completed' && (
                <div className="flex gap-1 print:hidden">
                  {g.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateGoalStatus(g.id, 'in_progress')}
                      className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/30"
                    >
                      Em andamento
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && !window.confirm('Marcar esta meta como concluída?')) return;
                      void handleUpdateGoalStatus(g.id, 'completed');
                    }}
                    className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30"
                  >
                    Concluir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
