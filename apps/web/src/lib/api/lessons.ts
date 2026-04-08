import { isDemoMode } from '@/lib/mock-data';
import { apiFetch } from './client';

export interface RegisterLessonData {
  topicId?: string;
  heldAt: string;
  durationMinutes: number;
  rating: number;
  notes?: string;
}

export async function registerLesson(
  studentId: string,
  data: RegisterLessonData,
): Promise<{ xpEarned: number }> {
  if (isDemoMode()) {
    throw new Error('Conecte a API para registrar aulas.');
  }
  return apiFetch<{ xpEarned: number }>(`/students/${studentId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
