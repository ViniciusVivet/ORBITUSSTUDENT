'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-3xl font-bold text-orbitus-accent">
        Orbitus Classroom RPG
      </h1>
      <p className="mb-8 text-gray-400">
        Dashboard gamificado para acompanhar seus alunos
      </p>
      {loggedIn ? (
        <>
          <p className="mb-6 text-gray-300">Você já está conectado.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/roster"
              className="rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Roster
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10"
            >
              Dashboard
            </Link>
            <Link
              href="/students/new"
              className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-orbitus-card"
            >
              Cadastrar aluno
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setLoggedIn(false); }}
              className="rounded-lg border border-red-500/50 px-6 py-3 font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Sair
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Entrar
          </Link>
          <Link
            href="/roster"
            className="rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10"
          >
            Ver alunos (Roster)
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-orbitus-card"
          >
            Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
