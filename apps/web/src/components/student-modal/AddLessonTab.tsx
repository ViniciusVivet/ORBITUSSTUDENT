'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import { apiFetch } from '@/lib/api/client';

interface Topic {
  id: string;
  name: string;
}

interface Props {
  studentId: string;
  topics: Topic[];
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition hover:scale-110 ${n <= value ? 'text-orbitus-xp' : 'text-orbitus-border'}`}
          aria-label={`${n} estrela${n !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function AddLessonTab({ studentId, topics, onSuccess, showToast }: Props) {
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [lessonDuration, setLessonDuration] = useState(60);
  const [lessonRating, setLessonRating] = useState(0);
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonSending, setLessonSending] = useState(false);
  const [lessonError, setLessonError] = useState('');

  const isDemo = isDemoMode();

  async function submitLesson() {
    if (!lessonTopic) { setLessonError('Selecione o tópico.'); return; }
    if (lessonRating === 0) { setLessonError('Selecione a avaliação.'); return; }
    if (isDemo) { setLessonError('Modo demo — conecte a API para registrar aulas.'); return; }
    setLessonError('');
    setLessonSending(true);
    try {
      const data = await apiFetch<{ xpEarned: number }>(`/students/${studentId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: lessonTopic,
          heldAt: new Date(lessonDate).toISOString(),
          durationMinutes: lessonDuration,
          rating: lessonRating,
          notes: lessonNotes || undefined,
        }),
      });
      showToast(`✅ Aula registrada! +${data.xpEarned ?? 0} XP`);
      setLessonTopic('');
      setLessonRating(0);
      setLessonNotes('');
      onSuccess();
    } catch (err) {
      setLessonError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      setLessonSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="rounded-lg border border-orbitus-xp/30 bg-orbitus-xp/10 p-3 text-xs text-orbitus-xp">
          🎮 Modo demo — conecte a API para registrar aulas de verdade.
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Tópico</label>
        <select
          value={lessonTopic}
          onChange={(e) => setLessonTopic(e.target.value)}
          className="input-field w-full text-sm"
        >
          <option value="">Selecione o tópico…</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Data e hora</label>
          <input
            type="datetime-local"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            className="input-field w-full text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Duração (min)</label>
          <input
            type="number"
            min={1}
            value={lessonDuration}
            onChange={(e) => setLessonDuration(Number(e.target.value))}
            className="input-field w-full text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Avaliação</label>
        <StarRating value={lessonRating} onChange={setLessonRating} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Observações (opcional)</label>
        <textarea
          value={lessonNotes}
          onChange={(e) => setLessonNotes(e.target.value)}
          rows={2}
          placeholder="Ex.: entendeu bem o conceito, ficou com dúvida em loops..."
          className="input-field w-full text-sm resize-none"
        />
      </div>
      {lessonError && <p className="text-xs text-red-400">{lessonError}</p>}
      <button
        type="button"
        onClick={submitLesson}
        disabled={lessonSending}
        className="btn-primary w-full justify-center disabled:opacity-50"
      >
        {lessonSending ? 'Registrando…' : 'Registrar aula'}
      </button>
    </div>
  );
}
