'use client';

import { useEffect, useState, useCallback } from 'react';
import type { StudentSummary, StudentListItem } from '@orbitus/shared';
import { isDemoMode, getMockSummary, MOCK_BLOCKERS, MOCK_GOALS, type BlockerItem, type GoalItem } from '@/lib/mock-data';
import { getToken, API_URL } from '@/lib/api/client';

const MOCK_TOPICS = [
  { id: 't1', name: 'Introdução ao HTML' },
  { id: 't2', name: 'Lógica de programação' },
  { id: 't3', name: 'Planilhas básicas' },
  { id: 't4', name: 'JavaScript fundamentals' },
  { id: 't5', name: 'CSS e layout' },
];

export type TopicOption = { id: string; name: string };

export interface UseStudentModalReturn {
  summary: StudentSummary | null;
  loading: boolean;
  topics: TopicOption[];
  blockers: BlockerItem[];
  goals: GoalItem[];
  toast: string;
  showToast: (msg: string) => void;
  reload: () => void;
}

export function useStudentModal(studentId: string, studentPreview: StudentListItem): UseStudentModalReturn {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicOption[]>(MOCK_TOPICS);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    if (isDemoMode()) {
      setSummary(getMockSummary(studentPreview));
      setBlockers(MOCK_BLOCKERS.filter((b) => b.studentId === studentId));
      setGoals(MOCK_GOALS.filter((g) => g.studentId === studentId));
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
      const [sumRes, blRes, goRes, topRes] = await Promise.allSettled([
        fetch(`${API_URL}/students/${studentId}/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/${studentId}/blockers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/${studentId}/goals`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/topics`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sumRes.status === 'fulfilled' && sumRes.value.ok) setSummary(await sumRes.value.json());
      else setSummary(getMockSummary(studentPreview));
      if (blRes.status === 'fulfilled' && blRes.value.ok) { const d = await blRes.value.json(); if (Array.isArray(d)) setBlockers(d); }
      if (goRes.status === 'fulfilled' && goRes.value.ok) { const d = await goRes.value.json(); if (Array.isArray(d)) setGoals(d); }
      if (topRes.status === 'fulfilled' && topRes.value.ok) { const d = await topRes.value.json(); if (Array.isArray(d) && d.length > 0) setTopics(d); }
    } catch {
      setSummary(getMockSummary(studentPreview));
    } finally {
      setLoading(false);
    }
  }, [studentId, studentPreview]);

  useEffect(() => { void load(); }, [load]);

  return { summary, loading, topics, blockers, goals, toast, showToast, reload: load };
}
