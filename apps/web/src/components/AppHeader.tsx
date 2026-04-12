'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/mock-data';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'border border-[#f4e04d]/35 bg-[#f4e04d]/10 text-[#f4e04d]'
          : 'text-zinc-400 hover:bg-[#112217] hover:text-[#7ee787]',
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

  if (pathname === '/' || pathname === '/login' || pathname?.startsWith('/roster')) return null;
  if (!token) return null;

  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050606]/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4e04d] text-sm font-black text-[#050606] shadow-[0_0_20px_rgba(244,224,77,0.18)]">
            O
          </div>
          <span className="hidden font-bold text-white sm:block">Orbitus</span>
          <span className="hidden text-xs text-zinc-500 lg:block">Observatorio pedagogico</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegacao principal">
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
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-zinc-300 transition hover:bg-[#112217] md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">{mobileOpen ? 'Fechar menu' : 'Abrir menu'}</span>
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="hidden items-center gap-1.5 rounded-lg border border-red-400/35 bg-red-500/5 px-3 py-1.5 text-sm text-red-300 transition hover:border-red-400/60 hover:bg-red-500/15 md:flex"
          >
            Sair
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-x-0 bottom-0 top-14 z-50 bg-black/60 backdrop-blur-sm md:hidden" aria-hidden onClick={close} />
          <div
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacao"
            className="fixed left-0 right-0 top-14 z-[60] border-b border-white/10 bg-[#10110f] px-4 py-4 shadow-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Navegacao principal">
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
            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  logout();
                  close();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/35 bg-red-500/5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
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
