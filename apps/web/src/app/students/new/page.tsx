'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { StudentListItem } from '@orbitus/shared';
import { isDemoMode, addStoredMockStudent, MOCK_CLASS_GROUPS } from '@/lib/mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ClassGroupOption {
  id: string;
  name: string;
  course?: string | null;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

const AVATAR_OPTIONS = [
  { type: 'emoji' as const, value: '🧑‍🎓', label: 'Estudante' },
  { type: 'emoji' as const, value: '👩‍🎓', label: 'Estudante 2' },
  { type: 'emoji' as const, value: '🦊', label: 'Raposa' },
  { type: 'emoji' as const, value: '🐱', label: 'Gato' },
  { type: 'emoji' as const, value: '🐶', label: 'Cachorro' },
  { type: 'emoji' as const, value: '🐹', label: 'Hamster' },
  { type: 'emoji' as const, value: '🦉', label: 'Coruja' },
  { type: 'emoji' as const, value: '🐸', label: 'Sapo' },
  { type: 'emoji' as const, value: '🦋', label: 'Borboleta' },
  { type: 'emoji' as const, value: '⭐', label: 'Estrela' },
  { type: 'emoji' as const, value: '🎮', label: 'Gamer' },
  { type: 'emoji' as const, value: '📚', label: 'Livros' },
  { type: 'template' as const, value: 'warrior-1', label: 'Guerreiro' },
  { type: 'template' as const, value: 'mage-1', label: 'Mago' },
  { type: 'template' as const, value: 'archer-1', label: 'Arqueiro' },
];

export default function NewStudentPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [classGroups, setClassGroups] = useState<ClassGroupOption[]>([]);
  const [avatarType, setAvatarType] = useState<'template' | 'emoji' | 'photo'>('emoji');
  const [avatarValue, setAvatarValue] = useState('🧑‍🎓');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = 'Cadastrar aluno — Orbitus Classroom RPG';
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      setClassGroups(MOCK_CLASS_GROUPS.map((g) => ({ id: g.id, name: g.name, course: g.course ?? null })));
      return;
    }
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/students/class-groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => Array.isArray(list) && setClassGroups(list));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Nome ou apelido é obrigatório.');
      return;
    }
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    if (isDemoMode()) {
      const selectedGroup = classGroupId ? MOCK_CLASS_GROUPS.find((g) => g.id === classGroupId) : null;
      const newStudent: StudentListItem = {
        id: `mock-${Date.now()}`,
        displayName: displayName.trim(),
        fullName: fullName.trim() || null,
        avatarType,
        avatarValue,
        photoUrl: null,
        level: 1,
        xp: 0,
        status: 'active',
        classGroup: selectedGroup ? { id: selectedGroup.id, name: selectedGroup.name } : null,
      };
      addStoredMockStudent(newStudent);
      router.push('/roster');
      router.refresh();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          fullName: fullName.trim() || undefined,
          classGroupId: classGroupId.trim() || undefined,
          avatarType,
          avatarValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Erro ao cadastrar.');
        return;
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
    <main id="main" className="min-h-screen p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orbitus-accent">Cadastrar aluno</h1>
          <Link
            href="/roster"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card"
          >
            ← Voltar ao Roster
          </Link>
        </div>

        {isDemoMode() && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
            Modo demo — o aluno será salvo só nesta sessão (localStorage). Conecte a API para persistir.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-700 bg-orbitus-card p-6"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Nome ou apelido *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                placeholder="Ex: João, Maria, Aluno 01"
                className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-4 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
                required
                title="Preencha o nome ou apelido do aluno"
                aria-invalid={!!error}
                aria-describedby={error ? 'cadastro-error' : undefined}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Nome completo (opcional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Se quiser registrar"
                className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-4 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
              />
            </div>

            {classGroups.length > 0 && (
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Turma (opcional)
                </label>
                <select
                  value={classGroupId}
                  onChange={(e) => setClassGroupId(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-4 py-2 text-white focus:border-orbitus-accent focus:outline-none"
                >
                  <option value="">Nenhuma</option>
                  {classGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}{g.course ? ` · ${g.course}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={`${opt.type}-${opt.value}`}
                    type="button"
                    onClick={() => {
                      setAvatarType(opt.type);
                      setAvatarValue(opt.value);
                    }}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl transition ${
                      avatarValue === opt.value
                        ? 'border-orbitus-accent bg-orbitus-accent/20'
                        : 'border-gray-600 bg-orbitus-dark hover:border-gray-500'
                    }`}
                    title={opt.label}
                  >
                    {opt.type === 'emoji' ? opt.value : '🧑'}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Escolha um emoji ou template. Foto real é opcional (em breve).
              </p>
            </div>
          </div>

          {error && (
            <p id="cadastro-error" className="mt-4 text-sm text-red-400" role="alert">{error}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-orbitus-accent px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Cadastrando…' : isDemoMode() ? 'Cadastrar (demo)' : 'Cadastrar'}
            </button>
            <Link
              href="/roster"
              className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 hover:bg-orbitus-card"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
