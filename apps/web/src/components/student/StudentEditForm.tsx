'use client';

import { useState, useEffect } from 'react';
import type { StudentSummary } from '@orbitus/shared';
import { isDemoMode } from '@/lib/mock-data';
import { updateStudent, fetchClassGroupsForStudents } from '@/lib/api/students';

interface Props {
  studentId: string;
  summary: StudentSummary;
  onSuccess: () => void;
  onClose: () => void;
}

export function StudentEditForm({ studentId, summary, onSuccess, onClose }: Props) {
  const [displayName, setDisplayName] = useState(summary.student.displayName ?? '');
  const [fullName, setFullName] = useState(summary.student.fullName ?? '');
  const [classGroupId, setClassGroupId] = useState(
    (summary.student as { classGroupId?: string }).classGroupId ??
    summary.student.classGroup?.id ?? ''
  );
  const [status, setStatus] = useState<string>(summary.student.status ?? 'active');
  const [classGroups, setClassGroups] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassGroupsForStudents().then(setClassGroups).catch(() => setClassGroups([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDemoMode()) return;

    setError('');
    if (!displayName.trim()) {
      setError('Preencha o nome ou apelido.');
      return;
    }

    setSubmitting(true);
    try {
      await updateStudent(studentId, {
        displayName: displayName.trim(),
        fullName: fullName.trim() || null,
        classGroupId: classGroupId.trim() || null,
        status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-orbitus-card p-6 print:hidden">
      <h2 className="mb-4 font-semibold text-white">Editar dados do aluno</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Nome ou apelido</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Nome completo (opcional)</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
          />
        </div>
        {classGroups.length > 0 && (
          <div>
            <label className="mb-1 block text-sm text-gray-400">Turma</label>
            <select
              value={classGroupId}
              onChange={(e) => setClassGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
            >
              <option value="">Nenhuma</option>
              {classGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm text-gray-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-orbitus-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-orbitus-card"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
