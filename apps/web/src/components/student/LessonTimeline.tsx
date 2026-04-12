'use client';

import { useState } from 'react';
import type { StudentSummary } from '@orbitus/shared';
import { updateLesson } from '@/lib/api/lessons';

type Lesson = StudentSummary['lastLessons'][number];

interface Props {
  studentId: string;
  lessons: StudentSummary['lastLessons'];
  onLessonUpdate?: () => void;
}

function mediaLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'Abrir PDF';
  if (/\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(lower)) return 'Abrir imagem';
  if (/\.(mp4|mov|webm)(\?|$)/.test(lower) || lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'Abrir video';
  }
  return 'Abrir material';
}

export function LessonTimeline({ studentId, lessons, onLessonUpdate }: Props) {
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [notes, setNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openLesson(lesson: Lesson) {
    setSelected(lesson);
    setNotes(lesson.notes ?? '');
    setMediaUrl(lesson.mediaUrl ?? '');
    setError('');
  }

  async function saveLesson() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await updateLesson(studentId, selected.id, {
        notes: notes.trim() || null,
        mediaUrl: mediaUrl.trim() || null,
      });
      setSelected(null);
      onLessonUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar aula.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <h2 className="mb-4 font-semibold text-white">Ultimas aulas</h2>
      {lessons.length === 0 ? (
        <p className="print-sheet-muted text-gray-500">Nenhuma aula registrada ainda.</p>
      ) : (
        <div className="relative">
          <div className="absolute bottom-2 left-3 top-2 w-0.5 bg-gray-600 print:bg-gray-400" aria-hidden />
          <ul className="space-y-0">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="relative flex gap-4 pb-4 last:pb-0">
                <div className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 rounded-full bg-orbitus-accent ring-4 ring-orbitus-card print:ring-white" aria-hidden />
                <button
                  type="button"
                  onClick={() => openLesson(lesson)}
                  className="print-sheet-row min-w-0 flex-1 rounded-lg bg-orbitus-dark/50 px-3 py-2 text-left text-sm transition hover:bg-orbitus-dark focus:outline-none focus:ring-2 focus:ring-orbitus-accent"
                >
                  <span className="block font-medium text-white">{lesson.topicName}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {new Date(lesson.heldAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="mt-1 block text-orbitus-xp">+{lesson.xpEarned} XP - {lesson.durationMinutes} min</span>
                  {(lesson.notes || lesson.mediaUrl) && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {lesson.notes ? 'Com descricao' : ''}
                      {lesson.notes && lesson.mediaUrl ? ' - ' : ''}
                      {lesson.mediaUrl ? 'Com material' : ''}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 print:hidden" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-detail-title"
            className="w-full max-w-lg rounded-t-xl border border-gray-700 bg-orbitus-card p-5 shadow-2xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 id="lesson-detail-title" className="font-semibold text-white">{selected.topicName}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(selected.heldAt).toLocaleString('pt-BR')} - {selected.durationMinutes} min - +{selected.xpEarned} XP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-orbitus-dark hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Descricao da aula</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="O que foi feito, dificuldades, proximos passos..."
                  className="w-full resize-none rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">PDF, foto ou video</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white focus:border-orbitus-accent focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Cole um link do Drive, YouTube, PDF, imagem ou video.</p>
              </div>

              {mediaUrl.trim() && (
                <a
                  href={mediaUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-orbitus-accent/40 px-3 py-2 text-sm text-orbitus-accent hover:bg-orbitus-accent/10"
                >
                  {mediaLabel(mediaUrl.trim())}
                </a>
              )}

              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-dark"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveLesson()}
                  disabled={saving}
                  className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar aula'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
