'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { isDemoMode, MOCK_DASHBOARD_CARDS, getAllMockStudents } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface OverviewCard {
  title: string;
  value: string | number;
  subtitle?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CARD_ICONS: Record<string, { icon: string; color: string; bar: string }> = {
  'Alunos sem aula há 7+ dias': { icon: '📅', color: 'from-amber-500/20 to-transparent', bar: 'bg-amber-500' },
  'Top evolução (XP esta semana)': { icon: '⚡', color: 'from-orbitus-accent/20 to-transparent', bar: 'bg-orbitus-accent' },
  'Top bloqueios por tópico': { icon: '🚧', color: 'from-red-500/20 to-transparent', bar: 'bg-red-500' },
  'Tempo médio por tema': { icon: '⏱', color: 'from-cyan-500/20 to-transparent', bar: 'bg-cyan-500' },
};

function MetricCard({ card, index }: { card: OverviewCard; index: number }) {
  const meta = Object.entries(CARD_ICONS).find(([key]) => card.title.includes(key.split(' ')[1]))
    ?? Object.entries(CARD_ICONS)[index % 4];
  const { icon, color, bar } = meta[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card-base relative overflow-hidden p-5"
    >
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${bar}`} />
      {/* BG gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${color} pointer-events-none`} />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{card.title}</p>
          <span className="text-xl" aria-hidden>{icon}</span>
        </div>
        <p className="text-3xl font-bold text-white">{card.value}</p>
        {card.subtitle && (
          <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
        )}
        {card.title.includes('sem aula') && (
          <Link href="/roster" className="mt-3 inline-flex items-center gap-1 text-xs text-orbitus-accent-bright hover:underline">
            Ver no Roster →
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [cards, setCards] = useState<OverviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoBanner, setDemoBanner] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [byClass, setByClass] = useState<{ classGroupId: string; classGroupName: string; studentCount: number; totalXp: number; activeBlockers: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    if (isDemoMode()) {
      setCards(MOCK_DASHBOARD_CARDS);
      setDemoBanner(true);
      const all = getAllMockStudents();
      const byGroup = new Map<string, { classGroupId: string; classGroupName: string; studentCount: number; totalXp: number; activeBlockers: number }>();
      all.forEach((s) => {
        const gid = s.classGroup?.id ?? '_sem_turma';
        const name = s.classGroup?.name ?? 'Sem turma';
        const cur = byGroup.get(gid) ?? { classGroupId: gid, classGroupName: name, studentCount: 0, totalXp: 0, activeBlockers: 0 };
        cur.studentCount += 1;
        cur.totalXp += s.xp ?? 0;
        byGroup.set(gid, cur);
      });
      setByClass(Array.from(byGroup.values()).sort((a, b) => a.classGroupName.localeCompare(b.classGroupName)));
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/dashboard/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.status === 401) { window.location.href = '/login'; return null; } return res.json(); })
      .then((data) => {
        if (data?.cards) { setCards(data.cards); }
        else if (data?.alunosSemAulaHaXDias !== undefined) {
          setCards([
            { title: 'Alunos sem aula há 7+ dias', value: data.alunosSemAulaHaXDias ?? '—', subtitle: 'MVP' },
            { title: 'Top evolução (XP esta semana)', value: data.topEvolucao ?? '—', subtitle: 'MVP' },
            { title: 'Top bloqueios por tópico', value: data.topBloqueios ?? '—', subtitle: 'MVP' },
            { title: 'Tempo médio por tema', value: data.tempoMedioPorTema ?? '—', subtitle: 'MVP' },
          ]);
        } else if (data?.message && data.statusCode >= 400) { setError(data.message); setCards(MOCK_DASHBOARD_CARDS); }
      })
      .catch(() => { setError('API offline'); setCards(MOCK_DASHBOARD_CARDS); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Dashboard — Orbitus Classroom RPG';
  }, []);

  useEffect(() => {
    if (isDemoMode() || !getToken()) return;
    fetch(`${API_URL}/dashboard/by-class`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => Array.isArray(list) && setByClass(list));
  }, []);

  useEffect(() => {
    if (isDemoMode() || !getToken()) return;
    fetch(`${API_URL}/ai/status`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.available === true) {
          setAiAvailable(true);
          setInsightsLoading(true);
          return fetch(`${API_URL}/ai/insights`, { headers: { Authorization: `Bearer ${getToken()}` } });
        }
        setAiAvailable(false);
        return null;
      })
      .then((res) => (res?.ok ? res.json() : null))
      .then((data) => { if (data?.insights) setInsights(data.insights); })
      .catch(() => setAiAvailable(false))
      .finally(() => setInsightsLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function handleSendChat() {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    const token = getToken();
    if (isDemoMode() || !token) {
      setChatMessages((prev) => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: 'Conecte a API (não use modo demo) e configure GEMINI_API_KEY no backend para usar o assistente.' }]);
      setChatInput('');
      return;
    }
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatSending(true);
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data?.reply ?? 'Sem resposta.' }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Erro de conexão com a API.' }]);
    } finally {
      setChatSending(false);
    }
  }

  const allZero = cards.length > 0 && cards.every((c) => c.value === 0 || c.value === '0' || c.value === '—');

  return (
    <main id="main" className="page-shell max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {demoBanner && (
            <span className="rounded-full border border-orbitus-xp/30 bg-orbitus-xp/10 px-3 py-0.5 text-xs font-medium text-orbitus-xp">
              Demo
            </span>
          )}
          {error && !demoBanner && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs text-amber-400">
              {error} — exemplo
            </span>
          )}
        </div>
        <p className="text-gray-500">Visão geral da sua turma</p>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <MetricCard key={card.title} card={card} index={i} />
          ))}
        </div>
      )}

      {!loading && allZero && (
        <div className="mt-6 rounded-xl border border-dashed border-orbitus-border bg-orbitus-card/30 p-8 text-center">
          <p className="mb-4 text-gray-400">Ainda sem dados. Cadastre alunos e registre aulas para ver métricas aqui.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/students/new" className="btn-primary">
              + Cadastrar aluno
            </Link>
            <Link href="/roster" className="btn-ghost">
              Ver Roster
            </Link>
          </div>
        </div>
      )}

      {/* Por turma */}
      {!loading && byClass.length > 0 && (
        <div className="mt-10">
          <h2 className="section-title mb-5 flex items-center gap-2">
            <span className="text-lg">🏫</span> Por turma
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byClass.map((row) => (
              <div key={row.classGroupName} className="card-base p-4 group">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-white">{row.classGroupName}</h3>
                  {row.activeBlockers > 0 && (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400 ring-1 ring-red-500/30">
                      {row.activeBlockers} bloqueio{row.activeBlockers !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{row.studentCount} aluno{row.studentCount !== 1 ? 's' : ''}</span>
                  <span className="text-orbitus-border">·</span>
                  <span className="badge-xp">{row.totalXp} XP</span>
                </div>
                {row.classGroupId !== '_sem_turma' && (
                  <Link href={`/roster?classGroupId=${row.classGroupId}`} className="mt-3 inline-flex items-center gap-1 text-xs text-orbitus-accent-bright hover:underline">
                    Ver alunos →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI section */}
      <div className="mt-10 space-y-4">
        {/* Insights */}
        <div className="card-base p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xl">🤖</span>
            <h2 className="section-title">Insights IA</h2>
            {aiAvailable === true && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">Ativo</span>
            )}
            {aiAvailable === false && !isDemoMode() && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-400 ring-1 ring-amber-500/30">GEMINI_API_KEY não configurado</span>
            )}
            {isDemoMode() && (
              <span className="rounded-full bg-orbitus-border/50 px-2.5 py-0.5 text-xs text-gray-500">Modo demo</span>
            )}
          </div>
          {insightsLoading && (
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-orbitus-border" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-orbitus-border" />
            </div>
          )}
          {!insightsLoading && insights && (
            <p className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{insights}</p>
          )}
          {!insightsLoading && !insights && !isDemoMode() && aiAvailable === false && (
            <p className="text-sm text-gray-500">Adicione GEMINI_API_KEY no .env da API e reinicie.</p>
          )}
          {!insightsLoading && !insights && isDemoMode() && (
            <p className="text-sm text-gray-500">Conecte a API para ver insights do Gemini.</p>
          )}
        </div>

        {/* Chat */}
        <div className="card-base p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xl">💬</span>
            <h2 className="section-title">Assistente IA</h2>
            {aiAvailable === true && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">Ativo</span>
            )}
          </div>
          <div className="max-h-72 min-h-[80px] overflow-y-auto rounded-lg border border-orbitus-border bg-orbitus-surface p-3">
            {chatMessages.length === 0 && (
              <p className="text-sm text-gray-600">Ex.: "O que falta implementar?", "Sugira melhorias de UX"</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-orbitus-accent/25 text-gray-100' : 'bg-orbitus-card text-gray-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
              placeholder="Pergunta ou sugestão..."
              className="input-field flex-1 text-sm"
            />
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatSending}
              className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50"
            >
              {chatSending ? '…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
