'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

const loggedActions = [
  { href: '/hoje', label: 'Abrir agenda', note: 'Aulas e pendencias do dia' },
  { href: '/roster', label: 'Entrar no roster', note: 'Alunos, aulas rapidas e painel lateral' },
  { href: '/turmas', label: 'Fazer chamada', note: 'Presenca, duracao e progresso por turma' },
  { href: '/dashboard', label: 'Ver indicadores', note: 'XP, bloqueios e evolucao' },
];

const demoActions = [
  { href: '/login', label: 'Entrar', note: 'Acesse sua area de professor' },
  { href: '/roster', label: 'Ver demo', note: 'Explore o app sem configurar nada' },
];

const rosterPreview = [
  { name: 'Luna', topic: 'Logica', xp: 1280, status: 'evoluindo' },
  { name: 'Theo', topic: 'HTML/CSS', xp: 940, status: 'revisar' },
  { name: 'Maya', topic: 'Python', xp: 1510, status: 'pronto' },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  const actions = loggedIn ? loggedActions : demoActions;

  return (
    <main id="main" className="min-h-screen overflow-hidden bg-[#070807] text-white">
      <section className="relative isolate min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#070807_0%,rgba(7,8,7,0.93)_42%,rgba(7,8,7,0.70)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#070807] to-transparent" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f4e04d] text-lg font-black text-[#070807]">
              O
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#f4e04d]">ORBITUS</span>
              <span className="block text-xs text-zinc-400">Sala de aula viva</span>
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
              <Link href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#070807] transition hover:bg-[#f4e04d]">
                Login
              </Link>
            )}
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 pb-10 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)] lg:items-center lg:pt-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-lg border border-[#33d17a]/40 bg-[#33d17a]/10 px-3 py-1 text-sm font-medium text-[#72f0a2]">
              {loggedIn ? 'Pronto para a proxima aula' : 'Organize alunos, aulas e progresso'}
            </p>
            <h1 className="text-4xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Controle sua turma sem perder o ritmo da aula.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Registre aulas, acompanhe bloqueios, veja evolucao por aluno e transforme chamada em progresso real.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {actions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group rounded-lg border p-4 transition hover:-translate-y-0.5 ${
                    index === 0
                      ? 'border-[#f4e04d] bg-[#f4e04d] text-[#070807] hover:bg-white'
                      : 'border-white/15 bg-white/[0.08] text-white hover:border-[#33d17a]/60 hover:bg-[#33d17a]/10'
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
          </div>

          <div className="relative">
            <div className="rounded-lg border border-white/12 bg-[#10110f]/92 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#f4e04d]">Painel rapido</p>
                  <h2 className="mt-1 text-xl font-bold">Hoje na escola</h2>
                </div>
                <div className="rounded-lg bg-[#33d17a]/15 px-3 py-2 text-right">
                  <p className="text-xs text-[#72f0a2]">em foco</p>
                  <p className="text-lg font-black text-[#72f0a2]">12</p>
                </div>
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
                  <div key={student.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#070807] p-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-sm font-black text-[#070807]">
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
                Chamada em minutos
              </Link>
              <Link href="/roster" className="rounded-lg border border-[#ff7a90]/40 bg-[#ff7a90]/10 p-4 text-sm font-semibold text-[#ffb0bd] transition hover:bg-[#ff7a90]/20">
                Alunos que precisam de atencao
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
