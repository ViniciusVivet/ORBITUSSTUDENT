import { isDemoMode, MOCK_CLASS_GROUPS, MOCK_SESSIONS } from '@/lib/mock-data';
import type { ClassGroupDetail, ClassSessionItem } from '@orbitus/shared';
import { apiFetch } from './client';

export interface Group {
  id: string;
  name: string;
  course?: string | null;
  academicPeriod?: string | null;
  studentCount?: number;
}

export async function fetchClassGroups(): Promise<Group[]> {
  if (isDemoMode()) {
    return MOCK_CLASS_GROUPS.map((g) => ({ id: g.id, name: g.name, course: g.course }));
  }
  return apiFetch<Group[]>('/class-groups');
}

export async function createClassGroup(data: { name: string; course?: string; academicPeriod?: string }): Promise<Group> {
  if (isDemoMode()) throw new Error('Modo demo — conecte a API para criar turmas.');
  return apiFetch<Group>('/class-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchClassGroupDetail(id: string): Promise<ClassGroupDetail> {
  if (isDemoMode()) {
    const group = MOCK_CLASS_GROUPS.find((g) => g.id === id);
    if (!group) throw new Error('Turma não encontrada.');
    return {
      id: group.id,
      name: group.name,
      course: group.course,
      academicPeriod: null,
      studentCount: 0,
      students: [],
      sessions: MOCK_SESSIONS.filter((s) => s.classGroupId === id) as ClassSessionItem[],
    };
  }
  return apiFetch<ClassGroupDetail>(`/class-groups/${id}`);
}

export async function createClassSession(
  classGroupId: string,
  data: { heldAt: string; durationMinutes: number; topicName?: string; notes?: string },
): Promise<ClassSessionItem> {
  if (isDemoMode()) throw new Error('Modo demo — conecte a API para registrar sessões.');
  return apiFetch<ClassSessionItem>(`/class-groups/${classGroupId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
