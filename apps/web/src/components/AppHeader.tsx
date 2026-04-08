'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function navLinkClass(active: boolean): string {
  return [
    'flex min-h-12 items-center rounded-lg px-4 text-base font-medium touch-manipulation transition md:min-h-0 md:px-3 md:text-sm',
    active ? 'bg-orbitus-accent/20 text-orbitus-accent' : 'text-gray-300 hover:bg-orbitus-card hover:text-white',
  ].join(' ');
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = getToken();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  if (pathname === '/' || pathname === '/login') return null;
  if (!token) return null;

  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-700 bg-orbitus-dark/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <nav className="hidden items-center gap-1 md:flex md:gap-2" aria-label="Navegação principal">
          <Link href="/roster" className={navLinkClass(!!pathname?.startsWith('/roster'))}>
            Roster
          </Link>
          <Link href="/dashboard" className={navLinkClass(pathname === '/dashboard')}>
            Dashboard
          </Link>
          <Link href="/students/new" className={navLinkClass(pathname === '/students/new')}>
            Cadastrar aluno
          </Link>
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition hover:bg-orbitus-card hover:text-white">
            Início
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-600 text-lg text-gray-200 touch-manipulation md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className="sr-only">{mobileOpen ? 'Fechar menu' : 'Abrir menu'}</span>
          {mobileOpen ? '✕' : '☰'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="hidden min-h-10 rounded-lg border border-red-500/50 px-3 py-2 text-sm text-red-400 touch-manipulation hover:bg-red-500/10 md:inline-flex md:items-center"
        >
          Sair
        </button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-14 z-50 bg-black/60 md:hidden"
            aria-hidden
            onClick={close}
          />
          <div
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed left-0 right-0 top-14 z-[60] max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto border-b border-gray-700 bg-orbitus-dark px-4 py-3 shadow-2xl md:hidden"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <nav className="flex flex-col gap-1" aria-label="Navegação principal">
              <Link href="/roster" onClick={close} className={navLinkClass(!!pathname?.startsWith('/roster'))}>
                Roster
              </Link>
              <Link href="/dashboard" onClick={close} className={navLinkClass(pathname === '/dashboard')}>
                Dashboard
              </Link>
              <Link href="/students/new" onClick={close} className={navLinkClass(pathname === '/students/new')}>
                Cadastrar aluno
              </Link>
              <Link href="/" onClick={close} className={navLinkClass(false)}>
                Início
              </Link>
            </nav>
            <button
              type="button"
              onClick={() => {
                logout();
                close();
              }}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-lg border border-red-500/50 text-base font-medium text-red-400 touch-manipulation hover:bg-red-500/10"
            >
              Sair
            </button>
          </div>
        </>
      )}
    </header>
  );
}
