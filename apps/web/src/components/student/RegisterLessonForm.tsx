'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import { registerLesson } from '@/lib/api/lessons';
import type { TopicOption } from '@/lib/api/students';

interface Props {
  studentId: string;
  topics: TopicOption[];
  onSuccess: (xpEarned: number) => void;
}

export function RegisterLessonForm({ studentId, topics, onSuccess }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const topicId = (form.elements.namedItem('topicId') as HTMLSelectElement)?.value?.trim();
    const heldAt = (form.elements.namedItem('heldAt') as HTMLInputElement)?.value;
    const durationMinutes = parseInt((form.elements.namedItem('durationMinutes') as HTMLInputElement)?.value || '0', 10);
    const rating = parseInt((form.elements.namedItem('rating') as HTMLSelectElement)?.value || '0', 10);
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement)?.value?.trim() || undefined;

    setError('');
    if (!heldAt) { setError('Informe a data e hora da aula.'); return; }
    if (durationMinutes < 1) { setError('Duração deve ser de pelo menos 1 minuto.'); return; }
    if (rating < 1) { setError('Selecione a avaliação (1 a 5 estrelas).'); return; }

    if (isDemoMode()) {
      setError('Conecte a API para registrar aulas.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await registerLesson(studentId, {
        topicId: topicId || undefined,
        heldAt: new Date(heldAt).toISOString(),
        durationMinutes,
        rating,
        notes,
      });
      setSuccess(`Aula registrada! +${data.xpEarned ?? 0} XP`);
      form.reset();
      setShowForm(false);
      onSuccess(data.xpEarned ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6 print:hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Registrar aula</h2>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-orbitus-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Nova aula
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm text-gray-400 hover:text-white"
          >
            Fechar
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Tópico (opcional)</label>
            <select
              name="topicId"
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
            >
              <option value="">— Aula Livre —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Data e hora</label>
              <input
                type="datetime-local"
                name="heldAt"
                required
                className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Duração (min)</label>
              <input
                type="number"
                name="durationMinutes"
                min={1}
                max={480}
                defaultValue={45}
                required
                className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Avaliação (1-5)</label>
            <select
              name="rating"
              required
              defaultValue="4"
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} estrela(s)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Observação (opcional)</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
            />
          </div>
          {success && <p className="text-sm text-green-400">{success}</p>}
          {error && <p id="lesson-error" className="text-sm text-red-400" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Registrar'}
          </button>
        </form>
      )}
      {isDemoMode() && showForm && (
        <p className="mt-2 text-xs text-amber-400">Modo demo: conecte a API para registrar aulas de verdade.</p>
      )}
    </div>
  );
}
