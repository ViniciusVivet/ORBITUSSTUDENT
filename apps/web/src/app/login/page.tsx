'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <main id="main" className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-xl bg-orbitus-card p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-orbitus-accent">
          Entrar
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-4 py-2 text-white focus:border-orbitus-accent focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-4 py-2 text-white focus:border-orbitus-accent focus:outline-none"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orbitus-accent py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <span className="flex-1 border-t border-gray-600" />
          <span className="text-xs text-gray-500">ou</span>
          <span className="flex-1 border-t border-gray-600" />
        </div>
        <button
          type="button"
          onClick={enterDemoMode}
          className="w-full rounded-lg border border-amber-500/50 bg-amber-500/10 py-3 font-medium text-amber-400 transition hover:bg-amber-500/20"
        >
          Modo demo (testar sem API)
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Com API: prof@escola.com / senha123 (após rodar o seed)
        </p>
      </div>
      <p className="mt-4 max-w-sm text-center text-xs text-gray-500">
        No modo demo você navega por todas as telas com dados de exemplo. Nada é salvo no servidor.
      </p>
    </main>
  );
}
