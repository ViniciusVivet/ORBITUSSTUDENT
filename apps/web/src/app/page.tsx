'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

const features = [
  {
    icon: '🏆',
    title: 'RPG de Sala de Aula',
    desc: 'Alunos ganham XP, sobem de nível e desbloqueiam conquistas a cada aula.',
  },
  {
    icon: '🎯',
    title: 'Fila de Atenção',
    desc: 'Identifique automaticamente quem precisa de mais suporte com base em bloqueios e metas.',
  },
  {
    icon: '📊',
    title: 'Dashboard em Tempo Real',
    desc: 'Métricas por turma, histórico de aulas e insights gerados por IA.',
  },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  return (
    <main id="main" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-orbitus-accent/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] translate-x-1/2 rounded-full bg-orbitus-cyan/5 blur-[80px]" />
        <div className="absolute bottom-1/4 left-0 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-purple-900/20 blur-[60px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 mb-16 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orbitus-accent/30 bg-orbitus-accent/10 px-4 py-1.5 text-sm text-orbitus-accent-bright">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orbitus-accent animate-pulse" />
          Sistema de gestão gamificado
        </div>

        {/* Logo icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-accent shadow-glow-accent-lg text-4xl animate-float">
            ⚔️
          </div>
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-gradient">Orbitus</span>
          <br />
          <span className="text-white">Classroom RPG</span>
        </h1>

        <p className="mb-10 max-w-xl mx-auto text-lg text-gray-400 leading-relaxed">
          Transforme suas aulas em uma aventura. Acompanhe o progresso dos alunos,
          identifique bloqueios e engaje sua turma com gamificação.
        </p>

        {loggedIn ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/roster" className="btn-primary min-h-12 px-8 text-base shadow-glow-accent sm:min-h-0">
              Ver Roster →
            </Link>
            <Link href="/dashboard" className="btn-secondary min-h-12 px-8 text-base sm:min-h-0">
              Dashboard
            </Link>
            <div className="flex gap-2">
              <Link href="/students/new" className="btn-ghost min-h-12 px-6 sm:min-h-0">
                + Aluno
              </Link>
              <button
                type="button"
                onClick={() => { logout(); setLoggedIn(false); }}
                className="min-h-12 rounded-lg border border-red-500/30 px-4 text-sm text-red-400 transition hover:bg-red-500/10 sm:min-h-0"
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary min-h-12 px-10 text-base shadow-glow-accent sm:min-h-0">
              Entrar na plataforma →
            </Link>
            <Link href="/roster" className="btn-ghost min-h-12 px-8 sm:min-h-0">
              Ver demo
            </Link>
          </div>
        )}
      </div>

      {/* Feature cards */}
      <div className="relative z-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="card-base p-5 group"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h3 className="mb-1 font-semibold text-gray-100">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
