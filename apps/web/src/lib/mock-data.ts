import type { StudentListItem, StudentSummary } from '@orbitus/shared';

export const DEMO_TOKEN = 'demo';
const STORAGE_KEY = 'orbitus_mock_students';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('token') === DEMO_TOKEN;
}

const TOKEN_KEY = 'token';

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login';
}

export function getStoredMockStudents(): StudentListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addStoredMockStudent(student: StudentListItem): void {
  const list = getStoredMockStudents();
  list.push(student);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const MOCK_STUDENTS: StudentListItem[] = [
  {
    id: 'mock-1',
    displayName: 'João',
    fullName: 'João Silva',
    avatarType: 'emoji',
    avatarValue: '🧑‍🎓',
    photoUrl: null,
    level: 2,
    xp: 180,
    status: 'active',
    classGroup: { id: 'g1', name: 'Turma A' },
  },
  {
    id: 'mock-2',
    displayName: 'Maria',
    fullName: 'Maria Santos',
    avatarType: 'emoji',
    avatarValue: '👩‍🎓',
    photoUrl: null,
    level: 3,
    xp: 320,
    status: 'active',
    classGroup: { id: 'g1', name: 'Turma A' },
  },
  {
    id: 'mock-3',
    displayName: 'Pedro',
    fullName: null,
    avatarType: 'emoji',
    avatarValue: '🦊',
    photoUrl: null,
    level: 1,
    xp: 45,
    status: 'active',
    classGroup: { id: 'g1', name: 'Turma A' },
  },
  {
    id: 'mock-4',
    displayName: 'Ana',
    fullName: 'Ana Costa',
    avatarType: 'emoji',
    avatarValue: '🐱',
    photoUrl: null,
    level: 2,
    xp: 120,
    status: 'active',
    classGroup: { id: 'g2', name: 'Turma B' },
  },
];

const MOCK_LAST_LESSONS: Record<string, StudentSummary['lastLessons']> = {
  'mock-1': [
    { id: 'l1', heldAt: '2025-02-08T10:00:00Z', durationMinutes: 45, topicName: 'Introdução ao HTML', rating: 4, xpEarned: 36 },
    { id: 'l2', heldAt: '2025-02-05T14:00:00Z', durationMinutes: 30, topicName: 'Lógica de programação', rating: 5, xpEarned: 30 },
    { id: 'l3', heldAt: '2025-02-01T09:00:00Z', durationMinutes: 60, topicName: 'Introdução ao HTML', rating: 3, xpEarned: 36 },
  ],
  'mock-2': [
    { id: 'l4', heldAt: '2025-02-09T11:00:00Z', durationMinutes: 50, topicName: 'Planilhas básicas', rating: 5, xpEarned: 50 },
    { id: 'l5', heldAt: '2025-02-06T15:00:00Z', durationMinutes: 45, topicName: 'Lógica de programação', rating: 4, xpEarned: 36 },
  ],
  'mock-3': [],
  'mock-4': [
    { id: 'l6', heldAt: '2025-02-07T10:30:00Z', durationMinutes: 40, topicName: 'Introdução ao HTML', rating: 4, xpEarned: 32 },
  ],
};

const MOCK_SKILL_BARS: StudentSummary['skillBars'] = [
  { skillId: 's1', skillName: 'HTML', color: '#e34c26', currentXp: 65, level: 2 },
  { skillId: 's2', skillName: 'Lógica', color: '#6c5ce7', currentXp: 42, level: 1 },
  { skillId: 's3', skillName: 'Excel', color: '#00a651', currentXp: 20, level: 1 },
  { skillId: 's4', skillName: 'Robótica', color: '#0984e3', currentXp: 0, level: 1 },
];

const MOCK_SKILL_BARS_BY_ID: Record<string, StudentSummary['skillBars']> = {
  'mock-1': [
    { skillId: 's1', skillName: 'HTML', color: '#e34c26', currentXp: 72, level: 2 },
    { skillId: 's2', skillName: 'Lógica', color: '#6c5ce7', currentXp: 30, level: 1 },
    { skillId: 's3', skillName: 'Excel', color: '#00a651', currentXp: 0, level: 1 },
    { skillId: 's4', skillName: 'Robótica', color: '#0984e3', currentXp: 0, level: 1 },
  ],
  'mock-2': [
    { skillId: 's1', skillName: 'HTML', color: '#e34c26', currentXp: 15, level: 1 },
    { skillId: 's2', skillName: 'Lógica', color: '#6c5ce7', currentXp: 88, level: 3 },
    { skillId: 's3', skillName: 'Excel', color: '#00a651', currentXp: 55, level: 2 },
    { skillId: 's4', skillName: 'Robótica', color: '#0984e3', currentXp: 10, level: 1 },
  ],
  'mock-3': MOCK_SKILL_BARS,
  'mock-4': [
    { skillId: 's1', skillName: 'HTML', color: '#e34c26', currentXp: 32, level: 1 },
    { skillId: 's2', skillName: 'Lógica', color: '#6c5ce7', currentXp: 0, level: 1 },
    { skillId: 's3', skillName: 'Excel', color: '#00a651', currentXp: 0, level: 1 },
    { skillId: 's4', skillName: 'Robótica', color: '#0984e3', currentXp: 0, level: 1 },
  ],
};

export function getMockSummary(student: StudentListItem): StudentSummary {
  const id = student.id;
  const lastLessons = MOCK_LAST_LESSONS[id] ?? [];
  const skillBars = MOCK_SKILL_BARS_BY_ID[id] ?? MOCK_SKILL_BARS;
  const activeBlockersCount = id === 'mock-1' ? 1 : id === 'mock-2' ? 2 : 0;
  const activeGoalsCount = id === 'mock-1' ? 2 : id === 'mock-2' ? 1 : 0;
  return {
    student,
    lastLessons,
    skillBars,
    activeBlockersCount,
    activeGoalsCount,
  };
}

export function getAllMockStudents(): StudentListItem[] {
  return [...MOCK_STUDENTS, ...getStoredMockStudents()];
}

export interface BlockerItem {
  id: string;
  studentId: string;
  titleOrTopic: string;
  severity: number;
  tags: string[];
  observation: string | null;
  status: 'active' | 'resolved';
  createdAt: string;
}

export const MOCK_BLOCKERS: BlockerItem[] = [
  {
    id: 'b1',
    studentId: 'mock-1',
    titleOrTopic: 'Condicionais if/else',
    severity: 2,
    tags: ['lógica'],
    observation: 'Trava quando há else aninhado.',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    studentId: 'mock-2',
    titleOrTopic: 'Fórmulas no Excel',
    severity: 1,
    tags: ['excel'],
    observation: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export interface GoalItem {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  deadlineAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const MOCK_GOALS: GoalItem[] = [
  { id: 'g1', studentId: 'mock-1', title: 'Completar módulo HTML básico', description: null, status: 'in_progress', deadlineAt: '2025-03-01', completedAt: null, createdAt: new Date().toISOString() },
  { id: 'g2', studentId: 'mock-1', title: 'Fazer 5 exercícios de lógica', description: null, status: 'pending', deadlineAt: null, completedAt: null, createdAt: new Date().toISOString() },
  { id: 'g3', studentId: 'mock-2', title: 'Dominar fórmulas SOMA e MÉDIA', description: null, status: 'pending', deadlineAt: '2025-02-20', completedAt: null, createdAt: new Date().toISOString() },
];

export const MOCK_DASHBOARD_CARDS = [
  { title: 'Alunos sem aula há 7+ dias', value: '2', subtitle: 'Pedro e Ana' },
  { title: 'Top evolução (XP esta semana)', value: 'Maria', subtitle: '+80 XP' },
  { title: 'Top bloqueios por tópico', value: 'Lógica', subtitle: '4 ocorrências' },
  { title: 'Tempo médio por tema', value: '45 min', subtitle: 'últimas 2 semanas' },
];
