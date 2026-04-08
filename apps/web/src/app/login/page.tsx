'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_TOKEN } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('prof@escola.com');
  const [password, setPassword] = useState('senha123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Entrar — Orbitus Classroom RPG';
  }, []);

  function enterDemoMode() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', DEMO_TOKEN);
    }
    router.push('/roster');
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Erro ao entrar');
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.access_token);
      }
      router.push('/roster');
      router.refresh();
    } catch {
      setError('Falha de conexão. A API está rodando?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-orbitus-accent/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-accent shadow-glow-accent text-2xl">
            ⚔️
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo ao Orbitus</h1>
          <p className="mt-1 text-sm text-gray-500">Dashboard gamificado para professores</p>
        </div>

        {/* Card */}
        <div className="card-base p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base shadow-glow-accent disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Entrando…
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="flex-1 border-t border-orbitus-border" />
            <span className="text-xs text-gray-600">ou</span>
            <span className="flex-1 border-t border-orbitus-border" />
          </div>

          <button
            type="button"
            onClick={enterDemoMode}
            className="w-full rounded-lg border border-orbitus-xp/30 bg-orbitus-xp/10 py-3 text-sm font-medium text-orbitus-xp transition hover:bg-orbitus-xp/20"
          >
            🎮 Modo demo — explorar sem API
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Com API: prof@escola.com / senha123
        </p>
      </div>
    </main>
  );
}
