'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function AppHeader() {
  const pathname = usePathname();
  const token = getToken();

  if (pathname === '/' || pathname === '/login') return null;
  if (!token) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-700 bg-orbitus-dark/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <nav className="flex items-center gap-2">
          <Link
            href="/roster"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname?.startsWith('/roster') ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'text-gray-300 hover:bg-orbitus-card hover:text-white'}`}
          >
            Roster
          </Link>
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === '/dashboard' ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'text-gray-300 hover:bg-orbitus-card hover:text-white'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/students/new"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === '/students/new' ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'text-gray-300 hover:bg-orbitus-card hover:text-white'}`}
          >
            Cadastrar aluno
          </Link>
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition hover:bg-orbitus-card hover:text-white"
          >
            Início
          </Link>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-red-500/50 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
