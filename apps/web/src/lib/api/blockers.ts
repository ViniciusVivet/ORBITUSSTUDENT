import { isDemoMode, MOCK_BLOCKERS, type BlockerItem } from '@/lib/mock-data';
import { apiFetch, getToken, API_URL } from './client';

export type { BlockerItem };

export async function fetchBlockers(studentId: string, status?: string): Promise<BlockerItem[]> {
  if (isDemoMode()) {
    const list = MOCK_BLOCKERS.filter((b) => b.studentId === studentId);
    return status ? list.filter((b) => b.status === status) : list;
  }
  const token = getToken();
  if (!token) return [];
  const qs = status ? `?status=${status}` : '';
  try {
    const res = await fetch(`${API_URL}/students/${studentId}/blockers${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addBlocker(
  studentId: string,
  data: { titleOrTopic: string; severity: number; tags?: string[]; observation?: string },
): Promise<BlockerItem> {
  if (isDemoMode()) {
    const newBlocker: BlockerItem = {
      id: `b-${Date.now()}`,
      studentId,
      titleOrTopic: data.titleOrTopic,
      severity: data.severity,
      tags: data.tags ?? [],
      observation: data.observation ?? null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    return newBlocker;
  }
  return apiFetch<BlockerItem>(`/students/${studentId}/blockers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateBlocker(
  studentId: string,
  blockerId: string,
  data: Partial<{ status: 'active' | 'resolved'; observation: string | null; tags: string[] }>,
): Promise<BlockerItem> {
  if (isDemoMode()) {
    const existing = MOCK_BLOCKERS.find((b) => b.id === blockerId);
    if (!existing) throw new Error('Blocker not found');
    return { ...existing, ...data } as BlockerItem;
  }
  return apiFetch<BlockerItem>(`/students/${studentId}/blockers/${blockerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
