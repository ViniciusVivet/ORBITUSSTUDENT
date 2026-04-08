import { isDemoMode, MOCK_DASHBOARD_CARDS, getAllMockStudents } from '@/lib/mock-data';
import { apiFetch, getToken, API_URL } from './client';

export interface OverviewCard {
  title: string;
  value: string | number;
  subtitle?: string;
}

export interface ByClassRow {
  classGroupId: string;
  classGroupName: string;
  studentCount: number;
  totalXp: number;
  activeBlockers: number;
}

export interface TodayOverview {
  lessonsToday: number;
  studentsWithLessonToday: number;
}

export async function fetchDashboardOverview(): Promise<{ cards: OverviewCard[]; byClass: ByClassRow[] }> {
  if (isDemoMode()) {
    const all = getAllMockStudents();
    const byGroup = new Map<string, ByClassRow>();
    all.forEach((s) => {
      const gid = s.classGroup?.id ?? '_sem_turma';
      const name = s.classGroup?.name ?? 'Sem turma';
      const cur = byGroup.get(gid) ?? { classGroupId: gid, classGroupName: name, studentCount: 0, totalXp: 0, activeBlockers: 0 };
      cur.studentCount += 1;
      cur.totalXp += s.xp ?? 0;
      byGroup.set(gid, cur);
    });
    const byClass = Array.from(byGroup.values()).sort((a, b) => a.classGroupName.localeCompare(b.classGroupName));
    return { cards: [...MOCK_DASHBOARD_CARDS], byClass };
  }

  const token = getToken();
  if (!token) throw new Error('Sem autenticação');

  // Fetch overview and by-class in parallel
  const [overviewRes, byClassRes] = await Promise.allSettled([
    fetch(`${API_URL}/dashboard/overview`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API_URL}/dashboard/by-class`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  let cards: OverviewCard[] = [];
  if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
    const data = await overviewRes.value.json();
    if (data?.cards) {
      cards = data.cards;
    } else if (data?.alunosSemAulaHaXDias !== undefined) {
      cards = [
        { title: 'Alunos sem aula há 7+ dias', value: data.alunosSemAulaHaXDias ?? '—', subtitle: 'MVP' },
        { title: 'Top evolução (XP esta semana)', value: data.topEvolucao ?? '—', subtitle: 'MVP' },
        { title: 'Top bloqueios por tópico', value: data.topBloqueios ?? '—', subtitle: 'MVP' },
        { title: 'Tempo médio por tema', value: data.tempoMedioPorTema ?? '—', subtitle: 'MVP' },
      ];
    } else if (data?.message && typeof data.statusCode === 'number' && data.statusCode >= 400) {
      throw new Error(data.message);
    }
  } else if (overviewRes.status === 'fulfilled' && overviewRes.value.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  let byClass: ByClassRow[] = [];
  if (byClassRes.status === 'fulfilled' && byClassRes.value.ok) {
    const list = await byClassRes.value.json();
    if (Array.isArray(list)) byClass = list;
  }

  return { cards, byClass };
}

export async function fetchTodayOverview(): Promise<TodayOverview> {
  if (isDemoMode()) {
    return { lessonsToday: 0, studentsWithLessonToday: 0 };
  }
  return apiFetch<TodayOverview>('/dashboard/today');
}

export async function fetchAiStatus(): Promise<{ available: boolean }> {
  if (isDemoMode()) return { available: false };
  const token = getToken();
  if (!token) return { available: false };
  try {
    const res = await fetch(`${API_URL}/ai/status`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { available: false };
    return res.json();
  } catch {
    return { available: false };
  }
}

export async function fetchAiInsights(): Promise<{ insights: string }> {
  if (isDemoMode()) return { insights: '' };
  const token = getToken();
  if (!token) return { insights: '' };
  const res = await fetch(`${API_URL}/ai/insights`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { insights: '' };
  return res.json();
}

export async function sendAiChat(message: string): Promise<{ reply: string }> {
  if (isDemoMode()) {
    return { reply: 'Conecte a API (não use modo demo) e configure GEMINI_API_KEY no backend para usar o assistente.' };
  }
  const token = getToken();
  if (!token) return { reply: 'Sem autenticação.' };
  try {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return { reply: data?.reply ?? 'Sem resposta.' };
  } catch {
    return { reply: 'Erro de conexão com a API.' };
  }
}
