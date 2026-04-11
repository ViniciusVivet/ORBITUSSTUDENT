'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { registerLesson } from '@/lib/api/lessons';
import { fetchTopics } from '@/lib/api/students';
import type { TopicOption } from '@/lib/api/students';
import type { StudentListItem } from '@orbitus/shared';

interface Props {
  selectedStudents: StudentListItem[];
  allStudents: StudentListItem[];
  onSelectAll: () => void;
  onCancel: () => void;
  onDone: (failedIds: Set<string>) => void;
}

type BulkStatus = 'idle' | 'saving' | 'done';

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
          className={`text-lg transition-colors ${
            n <= (hovered || value) ? 'text-amber-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function BulkLessonBar({ selectedStudents, allStudents, onSelectAll, onCancel, onDone }: Props) {
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [rating, setRating] = useState(4);
  const [duration, setDuration] = useState(45);
  const [heldAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [status, setBulkStatus] = useState<BulkStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [doneMessage, setDoneMessage] = useState('');

  useEffect(() => {
    fetchTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  async function handleRegister() {
    if (selectedStudents.length === 0 || status === 'saving') return;
    setBulkStatus('saving');
    setProgress(0);
    setTotal(selectedStudents.length);
    const failedIds = new Set<string>();
    const lessonData = {
      topicId: topicId || undefined,
      heldAt: new Date(heldAt).toISOString(),
      durationMinutes: duration,
      rating,
    };

    let done = 0;
    const results = await Promise.allSettled(
      selectedStudents.map(async (s) => {
        try {
          await registerLesson(s.id, lessonData);
        } catch {
          failedIds.add(s.id);
          throw s.id;
        } finally {
          done += 1;
          setProgress(done);
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    setSuccessCount(succeeded);
    setDoneMessage(
      failedIds.size === 0
        ? `${succeeded} aula(s) registrada(s) com sucesso!`
        : `${succeeded} registrada(s), ${failedIds.size} com falha.`,
    );
    setBulkStatus('done');
    setTimeout(() => {
      onDone(failedIds);
    }, 2000);
  }

  const count = selectedStudents.length;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-orbitus-border bg-orbitus-surface p-4"
    >
      {status === 'done' ? (
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-400">
          <span>✓</span>
          <span>{doneMessage}</span>
        </div>
      ) : status === 'saving' ? (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
          <span className="animate-spin">⚡</span>
          <span>
            Registrando {progress}/{total}…
          </span>
        </div>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Contagem + selecionar todos */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-white">
              {count === 0 ? 'Nenhum aluno selecionado' : `${count} aluno(s) selecionado(s)`}
            </span>
            <button
              type="button"
              onClick={onSelectAll}
              className="text-orbitus-accent-bright underline hover:no-underline text-xs"
            >
              Selecionar todos ({allStudents.length})
            </button>
          </div>

          {/* Topico */}
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="input-field text-sm sm:w-auto"
          >
            <option value="">Sem tópico</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Rating */}
          <StarRating value={rating} onChange={setRating} />

          {/* Duracao */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">min</label>
            <input
              type="number"
              min={1}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="input-field w-20 text-sm"
            />
          </div>

          {/* Acoes */}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleRegister}
              disabled={count === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              ⚡ Registrar para todos
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-orbitus-border px-3 py-2 text-sm text-gray-400 transition hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
