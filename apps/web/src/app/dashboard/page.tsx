'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isDemoMode } from '@/lib/mock-data';
import { fetchDashboardOverview, type OverviewCard, type ByClassRow } from '@/lib/api/dashboard';
import { getToken } from '@/lib/api/client';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ByClassSection } from '@/components/dashboard/ByClassSection';
import { AiSection } from '@/components/dashboard/AiSection';

export default function DashboardPage() {
  const [cards, setCards] = useState<OverviewCard[]>([]);
  const [byClass, setByClass] = useState<ByClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoBanner, setDemoBanner] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    if (isDemoMode()) setDemoBanner(true);

    fetchDashboardOverview()
      .then((data) => {
        setCards(data.cards);
        setByClass(data.byClass);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'API offline');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Dashboard — Orbitus Classroom RPG';
  }, []);

  const allZero = cards.length > 0 && cards.every((c) => c.value === 0 || c.value === '0' || c.value === '—');

  return (
    <main id="main" className="page-shell max-w-7xl mx-auto">
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

      <ByClassSection byClass={byClass} />

      <AiSection />
    </main>
  );
}
