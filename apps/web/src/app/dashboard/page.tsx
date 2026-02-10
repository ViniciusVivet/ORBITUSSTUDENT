'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { isDemoMode, MOCK_DASHBOARD_CARDS, logout } from '@/lib/mock-data';

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

export default function DashboardPage() {
  const [cards, setCards] = useState<OverviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoBanner, setDemoBanner] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (isDemoMode()) {
      setCards(MOCK_DASHBOARD_CARDS);
      setDemoBanner(true);
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

  return (
    <main className="min-h-screen p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbitus-accent">Dashboard do Professor</h1>
          <p className="text-gray-400">Visão geral da turma (MVP)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/roster"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card"
          >
            Roster
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card"
          >
            Início
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Sair
          </button>
        </div>
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
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-dashed border-orbitus-accent/30 bg-orbitus-card/30 p-8">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-300">Insights IA</h2>
          <span className="rounded bg-orbitus-accent/20 px-2 py-0.5 text-xs text-orbitus-accent">Em breve (V2)</span>
        </div>
        <p className="text-sm text-gray-500">
          Sugestões automáticas: próximo tópico para cada aluno, padrões de bloqueio e resumos. Esta seção será ativada em uma versão futura.
        </p>
      </div>
    </main>
  );
}
