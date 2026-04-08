import { isDemoMode, MOCK_GOALS, type GoalItem } from '@/lib/mock-data';
import { apiFetch, getToken, API_URL } from './client';

export type { GoalItem };

export async function fetchGoals(studentId: string, status?: string): Promise<GoalItem[]> {
  if (isDemoMode()) {
    const list = MOCK_GOALS.filter((g) => g.studentId === studentId);
    return status ? list.filter((g) => g.status === status) : list;
  }
  const token = getToken();
  if (!token) return [];
  const qs = status ? `?status=${status}` : '';
  try {
    const res = await fetch(`${API_URL}/students/${studentId}/goals${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createGoal(
  studentId: string,
  data: { title: string; deadlineAt?: string },
): Promise<GoalItem> {
  if (isDemoMode()) {
    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      studentId,
      title: data.title,
      description: null,
      status: 'pending',
      deadlineAt: data.deadlineAt ?? null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    return newGoal;
  }
  return apiFetch<GoalItem>(`/students/${studentId}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateGoal(
  studentId: string,
  goalId: string,
  data: Partial<{ status: 'pending' | 'in_progress' | 'completed'; deadlineAt: string | null }>,
): Promise<GoalItem> {
  if (isDemoMode()) {
    const existing = MOCK_GOALS.find((g) => g.id === goalId);
    if (!existing) throw new Error('Goal not found');
    return {
      ...existing,
      ...data,
      completedAt: data.status === 'completed' ? new Date().toISOString() : existing.completedAt,
    } as GoalItem;
  }
  return apiFetch<GoalItem>(`/students/${studentId}/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
