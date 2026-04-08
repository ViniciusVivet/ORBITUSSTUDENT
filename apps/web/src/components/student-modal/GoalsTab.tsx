'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import type { GoalItem } from '@/lib/mock-data';
import { apiFetch } from '@/lib/api/client';

interface Props {
  studentId: string;
  goals: GoalItem[];
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

export function GoalsTab({ studentId, goals, onUpdate, showToast }: Props) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalSending, setGoalSending] = useState(false);
  const [goalError, setGoalError] = useState('');
  const isDemo = isDemoMode();

  async function submitGoal() {
    if (!goalTitle.trim()) { setGoalError('Informe o título da meta.'); return; }
    if (isDemo) { setGoalError('Modo demo — conecte a API.'); return; }
    setGoalError('');
    setGoalSending(true);
    try {
      await apiFetch(`/students/${studentId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goalTitle.trim(), deadlineAt: goalDeadline || undefined }),
      });
      showToast('🎯 Meta adicionada!');
      setGoalTitle('');
      setGoalDeadline('');
      setShowGoalForm(false);
      onUpdate();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      setGoalSending(false);
    }
  }

  return (
    <div className="space-y-3">
      {goals.length === 0 && (
        <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
          <p className="text-sm text-gray-500">Nenhuma meta adicionada.</p>
        </div>
      )}
      {goals.map((g) => {
        const statusColor = g.status === 'completed' ? 'text-emerald-400' : g.status === 'in_progress' ? 'text-orbitus-accent-bright' : 'text-gray-400';
        const statusLabel = g.status === 'completed' ? 'Concluída' : g.status === 'in_progress' ? 'Em andamento' : 'Pendente';
        return (
          <div key={g.id} className={`rounded-lg border px-3 py-2.5 ${g.status === 'completed' ? 'border-orbitus-border/40 opacity-60' : 'border-orbitus-border'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-medium text-sm ${g.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{g.title}</p>
                {g.deadlineAt && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Prazo: {new Date(g.deadlineAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>
        );
      })}

      {!showGoalForm ? (
        <button
          type="button"
          onClick={() => setShowGoalForm(true)}
          className="btn-secondary w-full justify-center"
        >
          + Adicionar meta
        </button>
      ) : (
        <div className="rounded-lg border border-orbitus-border p-3 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Nova meta</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Título</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Ex.: Completar módulo de HTML"
              className="input-field w-full text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Prazo (opcional)</label>
            <input
              type="date"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              className="input-field w-full text-sm"
            />
          </div>
          {goalError && <p className="text-xs text-red-400">{goalError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submitGoal} disabled={goalSending} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {goalSending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setShowGoalForm(false)} className="btn-ghost px-3 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
