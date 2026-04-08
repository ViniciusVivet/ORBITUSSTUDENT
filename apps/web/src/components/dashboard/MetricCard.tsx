'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export interface OverviewCard {
  title: string;
  value: string | number;
  subtitle?: string;
}

const CARD_ICONS: Record<string, { icon: string; color: string; bar: string }> = {
  'Alunos sem aula há 7+ dias': { icon: '📅', color: 'from-amber-500/20 to-transparent', bar: 'bg-amber-500' },
  'Top evolução (XP esta semana)': { icon: '⚡', color: 'from-orbitus-accent/20 to-transparent', bar: 'bg-orbitus-accent' },
  'Top bloqueios por tópico': { icon: '🚧', color: 'from-red-500/20 to-transparent', bar: 'bg-red-500' },
  'Tempo médio por tema': { icon: '⏱', color: 'from-cyan-500/20 to-transparent', bar: 'bg-cyan-500' },
};

interface Props {
  card: OverviewCard;
  index: number;
}

export function MetricCard({ card, index }: Props) {
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
      <div className={`absolute inset-x-0 top-0 h-0.5 ${bar}`} />
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
