'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudentSummary, StudentListItem } from '@orbitus/shared';
import { isDemoMode, getMockSummary } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface StudentModalProps {
  studentId: string;
  studentPreview: StudentListItem;
  onClose: () => void;
}

export function StudentModal({ studentId, studentPreview, onClose }: StudentModalProps) {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (isDemoMode()) {
      setSummary(getMockSummary(studentPreview));
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setSummary(getMockSummary(studentPreview));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        setSummary(getMockSummary(studentPreview));
      }
    } catch {
      setSummary(getMockSummary(studentPreview));
    } finally {
      setLoading(false);
    }
  }, [studentId, studentPreview]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const s = summary?.student ?? studentPreview;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-[85vh] max-h-[600px] w-[95vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-orbitus-card shadow-2xl sm:h-[60vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="flex min-h-[120px] w-full flex-col items-center justify-center border-b border-gray-700 bg-orbitus-dark/50 p-4 sm:min-h-0 sm:w-[40%] sm:min-w-[200px] sm:border-b-0 sm:border-r sm:p-6">
              {loading ? (
                <div className="h-24 w-24 animate-pulse rounded-full bg-gray-700" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-orbitus-accent/30 text-5xl shadow-inner ring-2 ring-orbitus-accent/50">
                  {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-400 sm:mt-3 sm:text-sm">Avatar (3D em breve)</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{s.displayName}</h2>
                  <p className="text-sm text-gray-400">
                    {s.classGroup?.name ?? 'Sem turma'} · Nível {s.level} · XP {s.xp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {loading ? (
                <div className="h-24 animate-pulse rounded-lg bg-gray-700/50" />
              ) : summary && (
                <>
                  <div className="mb-4 flex gap-2 text-sm">
                    <span className="rounded bg-amber-500/20 px-2 py-1 text-amber-400">
                      {summary.activeBlockersCount} bloqueio(s)
                    </span>
                    <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-400">
                      {summary.activeGoalsCount} meta(s)
                    </span>
                  </div>

                  {summary.skillBars.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-300">Habilidades</h3>
                      <div className="space-y-2">
                        {summary.skillBars.map((sk) => (
                          <div key={sk.skillId}>
                            <div className="mb-0.5 flex justify-between text-xs">
                              <span style={{ color: sk.color ?? undefined }}>{sk.skillName}</span>
                              <span className="text-gray-500">Nível {sk.level}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (sk.currentXp % 100))}%`,
                                  backgroundColor: sk.color ?? '#8b5cf6',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-300">Últimas 5 aulas</h3>
                    {summary.lastLessons.length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhuma aula registrada.</p>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {summary.lastLessons.map((l) => (
                          <li key={l.id} className="flex justify-between rounded bg-orbitus-dark/50 px-2 py-1">
                            <span>{l.topicName}</span>
                            <span className="text-orbitus-xp">+{l.xpEarned} XP</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-700 pt-4">
                <Link
                  href={`/students/${studentId}#lesson`}
                  onClick={onClose}
                  className="rounded bg-orbitus-accent/20 px-3 py-2 text-sm font-medium text-orbitus-accent hover:bg-orbitus-accent/30"
                >
                  Registrar aula
                </Link>
                <Link
                  href={`/students/${studentId}#blocker`}
                  onClick={onClose}
                  className="rounded bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30"
                >
                  Marcar bloqueio
                </Link>
                <Link
                  href={`/students/${studentId}#goal`}
                  onClick={onClose}
                  className="rounded bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/30"
                >
                  Adicionar objetivo
                </Link>
                <Link
                  href={`/students/${studentId}`}
                  onClick={onClose}
                  className="rounded bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
                >
                  Ver histórico →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
