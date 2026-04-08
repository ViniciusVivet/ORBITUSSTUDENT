'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function NavLink({ href, active, children, onClick }: { href: string; active: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-orbitus-accent/20 text-orbitus-accent-bright shadow-glow-accent/20'
          : 'text-gray-400 hover:bg-orbitus-card hover:text-gray-100',
      ].join(' ')}
    >
      {children}
    </Link>
  );
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
    <header className="sticky top-0 z-40 border-b border-orbitus-border/80 bg-orbitus-dark/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-accent shadow-glow-accent/50 text-sm">
            ⚔
          </div>
          <span className="font-bold text-white tracking-tight hidden sm:block">
            Orbitus
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          <NavLink href="/hoje" active={pathname === '/hoje'}>
            Hoje
          </NavLink>
          <NavLink href="/turmas" active={!!pathname?.startsWith('/turmas')}>
            Turmas
          </NavLink>
          <NavLink href="/roster" active={!!pathname?.startsWith('/roster')}>
            Roster
          </NavLink>
          <NavLink href="/dashboard" active={pathname === '/dashboard'}>
            Dashboard
          </NavLink>
          <NavLink href="/students/new" active={pathname === '/students/new'}>
            + Aluno
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-orbitus-border text-gray-300 transition hover:bg-orbitus-card md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? 'Fechar menu' : 'Abrir menu'}</span>
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="hidden items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/15 hover:border-red-500/50 md:flex"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden><path d="M8.5 4.5l3 3-3 3M11.5 7.5h-7M5.5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sair
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-14 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={close}
          />
          <div
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed left-0 right-0 top-14 z-[60] border-b border-orbitus-border bg-orbitus-surface px-4 py-4 shadow-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Navegação principal">
              <NavLink href="/hoje" active={pathname === '/hoje'} onClick={close}>
                Hoje
              </NavLink>
              <NavLink href="/turmas" active={!!pathname?.startsWith('/turmas')} onClick={close}>
                Turmas
              </NavLink>
              <NavLink href="/roster" active={!!pathname?.startsWith('/roster')} onClick={close}>
                Roster
              </NavLink>
              <NavLink href="/dashboard" active={pathname === '/dashboard'} onClick={close}>
                Dashboard
              </NavLink>
              <NavLink href="/students/new" active={pathname === '/students/new'} onClick={close}>
                + Cadastrar aluno
              </NavLink>
            </nav>
            <div className="mt-3 border-t border-orbitus-border pt-3">
              <button
                type="button"
                onClick={() => { logout(); close(); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
