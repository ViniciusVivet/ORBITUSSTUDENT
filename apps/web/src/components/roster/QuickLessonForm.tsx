'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { registerLesson } from '@/lib/api/lessons';
import { fetchTopics } from '@/lib/api/students';
import type { TopicOption } from '@/lib/api/students';

interface Props {
  studentId: string;
  onClose: () => void;
}

type FormStatus = 'idle' | 'saving' | 'success' | 'error';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label="Avaliacao">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`text-xl transition-colors ${
            n <= (hovered || value) ? 'text-amber-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function QuickLessonForm({ studentId, onClose }: Props) {
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [rating, setRating] = useState(4);
  const [duration, setDuration] = useState(45);
  const [heldAt, setHeldAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [xpEarned, setXpEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'saving') return;
    setStatus('saving');
    setErrorMsg('');
    try {
      const result = await registerLesson(studentId, {
        topicId: topicId || undefined,
        heldAt: new Date(heldAt).toISOString(),
        durationMinutes: duration,
        rating,
      });
      setXpEarned(result.xpEarned);
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao registrar aula.');
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mt-3 rounded-xl border border-orbitus-accent/30 bg-orbitus-dark/60 p-4">
        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-green-400">
            <span>✓</span>
            <span>+{xpEarned} XP registrado!</span>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-orbitus-accent-bright">
              ⚡ Registrar aula
            </p>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Topico */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Tópico (opcional)</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="">Sem tópico</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">Avaliação</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Duracao */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">Duração (min)</label>
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="input-field w-full text-sm"
                />
              </div>

              {/* Data/hora */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Data e hora</label>
                <input
                  type="datetime-local"
                  value={heldAt}
                  onChange={(e) => setHeldAt(e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>
            </div>

            {status === 'error' && (
              <p className="mb-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === 'saving'}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
              >
                {status === 'saving' ? 'Salvando…' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="rounded-lg border border-orbitus-border px-3 py-2 text-sm text-gray-400 transition hover:text-white"
              >
                ×
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
