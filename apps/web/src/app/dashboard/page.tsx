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
    if (!token) {
      window.location.href = '/login';
      return;
    }
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
    fetch(`${API_URL}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.cards) {
          setCards(data.cards);
        } else if (data?.alunosSemAulaHaXDias !== undefined) {
          setCards([
            { title: 'Alunos sem aula há 7+ dias', value: data.alunosSemAulaHaXDias ?? '—', subtitle: 'MVP' },
            { title: 'Top evolução (XP esta semana)', value: data.topEvolucao ?? '—', subtitle: 'MVP' },
            { title: 'Top bloqueios por tópico', value: data.topBloqueios ?? '—', subtitle: 'MVP' },
            { title: 'Tempo médio por tema', value: data.tempoMedioPorTema ?? '—', subtitle: 'MVP' },
          ]);
        } else if (data?.message && data.statusCode >= 400) {
          setError(data.message);
          setCards(MOCK_DASHBOARD_CARDS);
        }
      })
      .catch(() => {
        setError('API offline');
        setCards(MOCK_DASHBOARD_CARDS);
      })
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
      .then((data) => {
        if (data?.insights) setInsights(data.insights);
      })
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
      const reply = data?.reply ?? 'Sem resposta.';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Erro de conexão com a API.' }]);
    } finally {
      setChatSending(false);
    }
  }

  return (
    <main id="main" className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-orbitus-accent">Dashboard do Professor</h1>
        <p className="text-gray-400">Visão geral da turma (MVP)</p>
      </div>

      {demoBanner && (
        <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
          Modo demo — métricas de exemplo.
        </div>
      )}

      {error && !demoBanner && (
        <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
          {error} — Mostrando dados de exemplo.
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Carregando métricas…</p>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-gray-700 bg-orbitus-card p-5"
            >
              <h3 className="text-sm font-medium text-gray-400">{card.title}</h3>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
              {card.subtitle && (
                <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
              )}
              {card.title.includes('sem aula') && (
                <Link href="/roster" className="mt-2 inline-block text-xs text-orbitus-accent hover:underline">
                  Ver no Roster →
                </Link>
              )}
            </motion.div>
          ))}
        </div>
        {cards.length > 0 && cards.every((c) => c.value === 0 || c.value === '0' || c.value === '—') && (
          <div className="mt-6 rounded-xl border border-dashed border-gray-600 bg-orbitus-card/30 p-6 text-center">
            <p className="text-gray-400">Ainda não há dados. Cadastre alunos e registre aulas para ver as métricas aqui.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Link href="/students/new" className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Cadastrar aluno
              </Link>
              <Link href="/roster" className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card">
                Ver Roster
              </Link>
            </div>
          </div>
        )}
        </>
      )}

      {!loading && byClass.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-300">Por turma</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byClass.map((row) => (
              <div key={row.classGroupName} className="rounded-xl border border-gray-700 bg-orbitus-card p-4">
                <h3 className="font-medium text-white">{row.classGroupName}</h3>
                <p className="mt-1 text-sm text-gray-400">{row.studentCount} aluno(s) · {row.totalXp} XP total</p>
                <p className="text-xs text-amber-400">{row.activeBlockers} bloqueio(s) ativo(s)</p>
                {row.classGroupId !== '_sem_turma' && (
                  <Link href={`/roster?classGroupId=${row.classGroupId}`} className="mt-2 inline-block text-xs text-orbitus-accent hover:underline">
                    Ver alunos →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-orbitus-accent/30 bg-orbitus-card/50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-300">Insights IA</h2>
            {aiAvailable === true && (
              <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Ativo</span>
            )}
            {aiAvailable === false && !isDemoMode() && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">GEMINI_API_KEY não configurado</span>
            )}
            {isDemoMode() && (
              <span className="rounded bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400">Modo demo — use a API</span>
            )}
          </div>
          {insightsLoading && <p className="text-sm text-gray-500">Carregando sugestões…</p>}
          {!insightsLoading && insights && <p className="whitespace-pre-wrap text-sm text-gray-300">{insights}</p>}
          {!insightsLoading && !insights && !isDemoMode() && aiAvailable === false && (
            <p className="text-sm text-gray-500">Adicione GEMINI_API_KEY no .env da API e reinicie. Chave em aistudio.google.com/apikey</p>
          )}
          {!insightsLoading && !insights && isDemoMode() && (
            <p className="text-sm text-gray-500">Conecte a API (saia do modo demo) para ver insights gerados pelo Gemini.</p>
          )}
        </div>

        <div className="rounded-xl border border-orbitus-accent/30 bg-orbitus-card/50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-300">Assistente IA (chat)</h2>
            {aiAvailable === true && (
              <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Ativo</span>
            )}
          </div>
          <p className="mb-4 text-sm text-gray-500">
            O assistente conhece o Orbitus (estrutura, stack, o que já existe e o roadmap). Pergunte em linguagem natural ou peça sugestões de melhorias.
          </p>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-700 bg-orbitus-dark/50 p-3">
            {chatMessages.length === 0 && (
              <p className="text-sm text-gray-500">Ex.: &quot;O que falta implementar?&quot;, &quot;Sugira melhorias de UX&quot;, &quot;Como funciona o CQRS no backend?&quot;</p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 ${m.role === 'user' ? 'ml-4 text-right' : 'mr-4 text-left'}`}
              >
                <span className="text-xs text-gray-500">{m.role === 'user' ? 'Você' : 'Assistente'}</span>
                <p className={`mt-0.5 rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'ml-auto inline-block max-w-[85%] bg-orbitus-accent/20 text-gray-200' : 'inline-block max-w-[85%] bg-gray-700 text-gray-200'}`}>
                  {m.content}
                </p>
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
              className="flex-1 rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatSending}
              className="rounded-lg bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:bg-orbitus-accent/90 disabled:opacity-50"
            >
              {chatSending ? '…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
