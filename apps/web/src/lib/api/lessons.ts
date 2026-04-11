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
    // Simula registro em modo demo: XP baseado na duracao e rating
    await new Promise((r) => setTimeout(r, 400));
    const xpEarned = Math.round((data.durationMinutes / 45) * data.rating * 10);
    return { xpEarned };
  }
  return apiFetch<{ xpEarned: number }>(`/students/${studentId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
