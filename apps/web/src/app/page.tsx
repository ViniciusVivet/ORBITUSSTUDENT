'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

const loggedActions = [
  { href: '/hoje', label: 'Abrir agenda', note: 'Plano de voo do dia' },
  { href: '/roster', label: 'Mapa dos alunos', note: 'Aulas rapidas e painel lateral' },
  { href: '/turmas', label: 'Fazer chamada', note: 'Presenca que vira progresso' },
  { href: '/dashboard', label: 'Ver sinais', note: 'XP, bloqueios e evolucao' },
];

const demoActions = [
  { href: '/login', label: 'Entrar', note: 'Acesse sua sala de comando' },
  { href: '/roster', label: 'Ver demo', note: 'Explore uma turma de exemplo' },
];

const rosterPreview = [
  { name: 'Luna', topic: 'Logica', xp: 1280, status: 'orbita estavel' },
  { name: 'Theo', topic: 'HTML/CSS', xp: 940, status: 'ajustar rota' },
  { name: 'Maya', topic: 'Python', xp: 1510, status: 'pronta' },
];

const learningSignals = [
  { label: 'Conceito', value: 'Loops', tone: 'text-[#f4e04d]' },
  { label: 'Evidencia', value: 'Quiz + projeto', tone: 'text-[#7ee787]' },
  { label: 'Proximo passo', value: 'Condicionais', tone: 'text-[#ffb86b]' },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  const actions = loggedIn ? loggedActions : demoActions;

  return (
    <main id="main" className="min-h-screen overflow-hidden bg-[#050606] text-white">
      <section className="relative isolate min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <img
          src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#050606_0%,rgba(5,6,6,0.92)_46%,rgba(5,6,6,0.62)_100%)]" />
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(244,224,77,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(126,231,135,0.08) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#050606] to-transparent" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f4e04d] text-lg font-black text-[#050606]">
              O
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#f4e04d]">ORBITUS</span>
              <span className="block text-xs text-zinc-400">Observatorio pedagogico</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <>
                <Link
                  href="/students/new"
                  className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10 sm:inline-flex"
                >
                  Novo aluno
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setLoggedIn(false);
                  }}
                  className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/15"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#050606] transition hover:bg-[#f4e04d]">
                Login
              </Link>
            )}
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 pb-10 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)] lg:items-center lg:pt-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-lg border border-[#7ee787]/40 bg-[#7ee787]/10 px-3 py-1 text-sm font-medium text-[#7ee787]">
              {loggedIn ? 'Estacao pronta para a proxima aula' : 'Transforme aula em rota de aprendizagem'}
            </p>
            <h1 className="text-4xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Conduza cada aluno pela propria orbita.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Registre evidencias, acompanhe bloqueios, planeje a proxima aula e veja progresso sem sair do fluxo da turma.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {actions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group rounded-lg border p-4 transition hover:-translate-y-0.5 ${
                    index === 0
                      ? 'border-[#f4e04d] bg-[#f4e04d] text-[#050606] hover:bg-white'
                      : 'border-white/15 bg-[#0f1210]/85 text-white hover:border-[#7ee787]/60 hover:bg-[#112217]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 text-base font-bold">
                    {action.label}
                    <span aria-hidden className="transition group-hover:translate-x-1">
                      -&gt;
                    </span>
                  </span>
                  <span className={`mt-1 block text-sm ${index === 0 ? 'text-[#26250f]' : 'text-zinc-400'}`}>{action.note}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {learningSignals.map((signal) => (
                <div key={signal.label} className="rounded-lg border border-white/10 bg-[#0f1210]/70 p-3">
                  <p className="text-xs text-zinc-500">{signal.label}</p>
                  <p className={`mt-1 text-sm font-bold ${signal.tone}`}>{signal.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-white/12 bg-[#10110f]/92 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#f4e04d]">Mapa orbital</p>
                  <h2 className="mt-1 text-xl font-bold">Hoje na turma</h2>
                </div>
                <div className="rounded-lg bg-[#7ee787]/15 px-3 py-2 text-right">
                  <p className="text-xs text-[#7ee787]">em foco</p>
                  <p className="text-lg font-black text-[#7ee787]">12</p>
                </div>
              </div>

              <div className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-[#050606]">
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  className="h-36 w-full object-cover opacity-80"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs text-zinc-400">Aulas</p>
                  <p className="mt-1 text-2xl font-black text-white">8</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs text-zinc-400">Bloqueios</p>
                  <p className="mt-1 text-2xl font-black text-[#ff7a90]">3</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs text-zinc-400">XP hoje</p>
                  <p className="mt-1 text-2xl font-black text-[#f4e04d]">420</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {rosterPreview.map((student) => (
                  <div key={student.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#050606] p-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-sm font-black text-[#050606]">
                      {student.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{student.name}</p>
                      <p className="truncate text-xs text-zinc-500">{student.topic}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#f4e04d]">{student.xp} XP</p>
                      <p className="text-xs text-zinc-500">{student.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/turmas" className="rounded-lg border border-[#48b8ff]/40 bg-[#48b8ff]/10 p-4 text-sm font-semibold text-[#9fddff] transition hover:bg-[#48b8ff]/20">
                Decolagem da chamada
              </Link>
              <Link href="/roster" className="rounded-lg border border-[#ff7a90]/40 bg-[#ff7a90]/10 p-4 text-sm font-semibold text-[#ffb0bd] transition hover:bg-[#ff7a90]/20">
                Alunos fora de rota
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
