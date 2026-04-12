import type { StudentListItem, StudentSummary, AttentionQueueItem } from '@orbitus/shared';
import {
  isDemoMode,
  getAllMockStudents,
  getMockSummary,
  enrichStudentsWithAttentionHints,
  getMockAttentionQueue,
  MOCK_CLASS_GROUPS,
} from '@/lib/mock-data';
import { apiFetch } from './client';

const MOCK_TOPICS = [
  { id: 't1', name: 'Introdução ao HTML', slug: 'intro-html', xpWeight: 1 },
  { id: 't2', name: 'Lógica de programação', slug: 'logica-prog', xpWeight: 1.2 },
  { id: 't3', name: 'Planilhas básicas', slug: 'excel-basico', xpWeight: 1 },
];

export interface TopicOption {
  id: string;
  name: string;
  slug: string;
  xpWeight?: number;
}

export interface FetchStudentsParams {
  search?: string;
  classGroupId?: string;
  status?: string;
  noLessonSinceDays?: number | '';
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'xp' | 'level';
}

export interface StudentListResponse {
  items: StudentListItem[];
  total: number;
}

export async function fetchStudents(params: FetchStudentsParams): Promise<StudentListResponse> {
  if (isDemoMode()) {
    return { items: enrichStudentsWithAttentionHints(getAllMockStudents()), total: 0 };
  }
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? 20));
  qs.set('offset', String(params.offset ?? 0));
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.classGroupId) qs.set('classGroupId', params.classGroupId);
  if (params.status) qs.set('status', params.status);
  if (params.noLessonSinceDays !== '' && params.noLessonSinceDays && params.noLessonSinceDays > 0) {
    qs.set('noLessonSinceDays', String(params.noLessonSinceDays));
  }
  if (params.sortBy) qs.set('sortBy', params.sortBy);

  const data = await apiFetch<{ items: StudentListItem[]; total: number; message?: string }>(`/students?${qs.toString()}`);
  return { items: data.items ?? [], total: typeof data.total === 'number' ? data.total : (data.items?.length ?? 0) };
}

export async function fetchStudentSummary(id: string): Promise<StudentSummary> {
  if (isDemoMode()) {
    const all = getAllMockStudents();
    const student = all.find((s) => s.id === id);
    if (!student) throw new Error('Aluno não encontrado.');
    return getMockSummary(student);
  }
  return apiFetch<StudentSummary>(`/students/${id}/summary`);
}

export async function createStudent(data: Record<string, unknown>): Promise<StudentListItem> {
  if (isDemoMode()) throw new Error('Modo demo — conecte a API para cadastrar alunos.');
  return apiFetch<StudentListItem>('/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateStudent(id: string, data: Record<string, unknown>): Promise<StudentListItem> {
  if (isDemoMode()) throw new Error('Modo demo — conecte a API para editar alunos.');
  return apiFetch<StudentListItem>(`/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchClassGroupsForStudents(): Promise<{ id: string; name: string }[]> {
  if (isDemoMode()) {
    return MOCK_CLASS_GROUPS.map((g) => ({ id: g.id, name: g.name }));
  }
  try {
    const list = await apiFetch<{ id: string; name: string }[]>('/students/class-groups');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function fetchTopics(): Promise<TopicOption[]> {
  if (isDemoMode()) return MOCK_TOPICS;
  try {
    const list = await apiFetch<TopicOption[]>('/students/topics');
    return Array.isArray(list) && list.length > 0 ? list : [];
  } catch {
    return [];
  }
}

export async function createTopic(name: string): Promise<TopicOption> {
  if (isDemoMode()) throw new Error('Modo demo — conecte a API para criar tópicos.');
  return apiFetch<TopicOption>('/students/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function fetchAttentionQueue(limit = 12): Promise<AttentionQueueItem[]> {
  if (isDemoMode()) return getMockAttentionQueue(limit);
  try {
    const data = await apiFetch<AttentionQueueItem[]>(`/students/attention-queue?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
