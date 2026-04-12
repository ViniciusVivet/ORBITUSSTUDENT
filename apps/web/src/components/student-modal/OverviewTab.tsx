'use client';

import { useState } from 'react';
import type { StudentSummary } from '@orbitus/shared';
import { updateLesson } from '@/lib/api/lessons';

interface Props {
  summary: StudentSummary;
  studentId: string;
  onNavigateToLesson: () => void;
  onClose: () => void;
  onLessonUpdate?: () => void;
}

type Lesson = StudentSummary['lastLessons'][number];

function mediaLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'Abrir PDF';
  if (/\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(lower)) return 'Abrir imagem';
  if (/\.(mp4|mov|webm)(\?|$)/.test(lower) || lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'Abrir video';
  }
  return 'Abrir material';
}

export function OverviewTab({ summary, studentId, onNavigateToLesson, onClose, onLessonUpdate }: Props) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [notes, setNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setNotes(lesson.notes ?? '');
    setMediaUrl(lesson.mediaUrl ?? '');
    setError('');
  }

  async function saveLesson() {
    if (!selectedLesson) return;
    setSaving(true);
    setError('');
    try {
      await updateLesson(studentId, selectedLesson.id, {
        notes: notes.trim() || null,
        mediaUrl: mediaUrl.trim() || null,
      });
      setSelectedLesson(null);
      onLessonUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar aula.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {summary.skillBars.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Habilidades</h3>
          <div className="space-y-2.5">
            {summary.skillBars.map((sk) => (
              <div key={sk.skillId}>
                <div className="mb-1 flex justify-between text-xs">
                  <span style={{ color: sk.color ?? undefined }} className="font-medium">{sk.skillName}</span>
                  <span className="text-gray-500">Nivel {sk.level} - {sk.currentXp} XP</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-orbitus-border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, sk.currentXp % 100)}%`, backgroundColor: sk.color ?? '#8b5cf6' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Ultimas aulas</h3>
        {summary.lastLessons.length > 0 ? (
          <ul className="space-y-1.5">
            {summary.lastLessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => openLesson(lesson)}
                  className="flex w-full items-center justify-between rounded-lg border border-orbitus-border/60 bg-orbitus-surface px-3 py-2 text-left text-sm transition hover:border-orbitus-accent/50 hover:bg-orbitus-border/40 focus:outline-none focus:ring-2 focus:ring-orbitus-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-gray-200">{lesson.topicName}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {lesson.durationMinutes}min - {'*'.repeat(lesson.rating)}
                      {(lesson.notes || lesson.mediaUrl) ? ' - com detalhes' : ''}
                    </span>
                  </span>
                  <span className="badge-xp ml-3 shrink-0">+{lesson.xpEarned}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
            <p className="text-sm text-gray-500">Nenhuma aula registrada ainda.</p>
            <button
              type="button"
              onClick={onNavigateToLesson}
              className="mt-2 text-xs text-orbitus-accent-bright hover:underline"
            >
              Registrar primeira aula
            </button>
          </div>
        )}
      </div>

      <a
        href={`/students/${studentId}`}
        onClick={onClose}
        className="inline-flex items-center gap-1 text-xs text-gray-500 transition hover:text-orbitus-accent-bright"
      >
        Ver ficha completa
      </a>

      {selectedLesson && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setSelectedLesson(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-lesson-detail-title"
            className="w-full max-w-lg rounded-t-xl border border-orbitus-border bg-orbitus-card p-5 shadow-2xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 id="modal-lesson-detail-title" className="font-semibold text-white">{selectedLesson.topicName}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(selectedLesson.heldAt).toLocaleString('pt-BR')} - {selectedLesson.durationMinutes} min - +{selectedLesson.xpEarned} XP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-orbitus-dark hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Texto da aula</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="O que foi feito, dificuldades, proximos passos..."
                  className="input-field w-full resize-none text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Foto, video ou PDF</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-field w-full text-sm"
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
                  onClick={() => setSelectedLesson(null)}
                  className="rounded-lg border border-orbitus-border px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-dark"
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
