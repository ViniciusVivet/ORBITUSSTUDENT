'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { registerLesson } from '@/lib/api/lessons';
import { createTopic, fetchTopics } from '@/lib/api/students';
import type { TopicOption } from '@/lib/api/students';

interface Props {
  studentId: string;
  onClose: () => void;
}

type FormStatus = 'idle' | 'saving' | 'success' | 'error';
const DURATION_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1h30', minutes: 90 },
  { label: '2h', minutes: 120 },
];

function hoursFromMinutes(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

function minutesFromHours(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.max(1, Math.min(480, Math.round(parsed * 60)));
}

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
          *
        </button>
      ))}
    </div>
  );
}

export function QuickLessonForm({ studentId, onClose }: Props) {
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [rating, setRating] = useState(4);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
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

  async function handleCreateTopic() {
    const name = newTopicName.trim();
    if (!name || creatingTopic) return;
    setCreatingTopic(true);
    setErrorMsg('');
    try {
      const topic = await createTopic(name);
      setTopics((prev) => [...prev, topic]);
      setTopicId(topic.id);
      setNewTopicName('');
      setShowNewTopic(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar categoria.');
      setStatus('error');
    } finally {
      setCreatingTopic(false);
    }
  }

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
        notes: notes.trim() || undefined,
        mediaUrl: mediaUrl.trim() || undefined,
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
            <span>OK</span>
            <span>+{xpEarned} XP registrado!</span>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-orbitus-accent-bright">
              Registrar aula
            </p>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-500">Topico (opcional)</label>
                  <button
                    type="button"
                    onClick={() => setShowNewTopic((v) => !v)}
                    className="text-[10px] font-semibold text-orbitus-accent-bright hover:underline"
                  >
                    {showNewTopic ? 'Cancelar' : '+ Nova categoria'}
                  </button>
                </div>
                {showNewTopic ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleCreateTopic();
                        }
                      }}
                      placeholder="Nome da categoria"
                      className="input-field min-w-0 flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateTopic()}
                      disabled={creatingTopic || !newTopicName.trim()}
                      className="rounded-lg bg-orbitus-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {creatingTopic ? '...' : 'Criar'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="input-field w-full text-sm"
                  >
                    <option value="">Sem topico</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Avaliacao</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Duracao (horas)</label>
                <input
                  type="number"
                  min={0.25}
                  max={8}
                  step={0.25}
                  value={hoursFromMinutes(duration)}
                  onChange={(e) => setDuration(minutesFromHours(e.target.value))}
                  className="input-field w-full text-sm"
                />
                <p className="mt-1 text-[10px] text-gray-600">{duration} min</p>
              </div>

              <div className="sm:col-span-2">
                <div className="grid grid-cols-5 gap-1">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => setDuration(preset.minutes)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                        duration === preset.minutes
                          ? 'border-orbitus-accent bg-orbitus-accent/20 text-orbitus-accent-bright'
                          : 'border-orbitus-border text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Data e hora</label>
                <input
                  type="datetime-local"
                  value={heldAt}
                  onChange={(e) => setHeldAt(e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Observacao (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Resumo rapido da aula..."
                  className="input-field w-full resize-none text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Material (opcional)</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Link de PDF, foto, video ou Drive"
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
                {status === 'saving' ? 'Salvando...' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="rounded-lg border border-orbitus-border px-3 py-2 text-sm text-gray-400 transition hover:text-white"
              >
                x
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
