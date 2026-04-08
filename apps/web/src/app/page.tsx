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
    <main id="main" className="page-shell flex flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold text-orbitus-accent">
        Orbitus Classroom RPG
      </h1>
      <p className="mb-8 text-gray-400">
        Dashboard gamificado para acompanhar seus alunos
      </p>
      {loggedIn ? (
        <>
          <p className="mb-6 text-gray-300">Você já está conectado.</p>
          <div className="flex w-full max-w-md flex-col gap-3 touch-manipulation sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Link
              href="/roster"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90 sm:min-h-0"
            >
              Roster
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10 sm:min-h-0"
            >
              Dashboard
            </Link>
            <Link
              href="/students/new"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-orbitus-card sm:min-h-0"
            >
              Cadastrar aluno
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setLoggedIn(false); }}
              className="min-h-12 rounded-lg border border-red-500/50 px-6 py-3 font-medium text-red-400 transition hover:bg-red-500/10 sm:min-h-0"
            >
              Sair
            </button>
          </div>
        </>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-3 touch-manipulation sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90 sm:min-h-0"
          >
            Entrar
          </Link>
          <Link
            href="/roster"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10 sm:min-h-0"
          >
            Ver alunos (Roster)
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-orbitus-card sm:min-h-0"
          >
            Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
