'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import { addBlocker, updateBlocker, type BlockerItem } from '@/lib/api/blockers';

function parseBlockerTagsInput(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 24);
}

interface Props {
  studentId: string;
  blockers: BlockerItem[];
  onUpdate: () => void;
}

export function BlockersList({ studentId, blockers: initialBlockers, onUpdate }: Props) {
  const [blockers, setBlockers] = useState<BlockerItem[]>(initialBlockers);
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerError, setBlockerError] = useState('');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);
  const [blockerQuickEditId, setBlockerQuickEditId] = useState<string | null>(null);
  const [blockerPatchingId, setBlockerPatchingId] = useState<string | null>(null);

  // Keep local state in sync with parent refreshes
  // (parent passes new blockers after onUpdate is called)
  const displayBlockers = blockers;

  async function handleAddBlocker(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const titleOrTopic = (form.elements.namedItem('titleOrTopic') as HTMLInputElement)?.value?.trim();
    const severity = parseInt((form.elements.namedItem('severity') as HTMLSelectElement)?.value ?? '1', 10);
    const observation = (form.elements.namedItem('observation') as HTMLTextAreaElement)?.value?.trim();
    const tags = parseBlockerTagsInput((form.elements.namedItem('tagsInput') as HTMLInputElement)?.value ?? '');

    setBlockerError('');
    if (!titleOrTopic) { setBlockerError('Preencha onde o aluno trava (título do bloqueio).'); return; }

    setBlockerSubmitting(true);
    try {
      const newBlocker = await addBlocker(studentId, {
        titleOrTopic,
        severity,
        tags: tags.length ? tags : undefined,
        observation: observation || undefined,
      });
      setBlockers((prev) => [...prev, { ...newBlocker, createdAt: newBlocker.createdAt ?? new Date().toISOString() }]);
      setShowBlockerForm(false);
      form.reset();
      onUpdate();
    } catch (err) {
      setBlockerError(err instanceof Error ? err.message : 'Falha de conexão');
    } finally {
      setBlockerSubmitting(false);
    }
  }

  async function handleResolve(blockerId: string) {
    try {
      await updateBlocker(studentId, blockerId, { status: 'resolved' });
      setBlockers((prev) => prev.map((x) => (x.id === blockerId ? { ...x, status: 'resolved' as const } : x)));
      setBlockerQuickEditId((cur) => (cur === blockerId ? null : cur));
      onUpdate();
    } catch {
      // silently fail — page-level toast is on onUpdate
    }
  }

  async function handleQuickEdit(e: React.FormEvent<HTMLFormElement>, blockerId: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const obs = (form.elements.namedItem('quickObservation') as HTMLTextAreaElement)?.value ?? '';
    const tagsRaw = (form.elements.namedItem('quickTags') as HTMLInputElement)?.value ?? '';
    const tagsNext = parseBlockerTagsInput(tagsRaw);

    setBlockerPatchingId(blockerId);
    try {
      const data = await updateBlocker(studentId, blockerId, {
        observation: obs.trim() || null,
        tags: tagsNext,
      });
      setBlockers((prev) =>
        prev.map((x) =>
          x.id === blockerId
            ? { ...x, observation: data.observation ?? null, tags: Array.isArray(data.tags) ? data.tags : tagsNext }
            : x,
        ),
      );
      setBlockerQuickEditId(null);
      onUpdate();
    } catch {
      // silently fail
    } finally {
      setBlockerPatchingId(null);
    }
  }

  return (
    <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Bloqueios</h2>
        <button
          type="button"
          onClick={() => setShowBlockerForm((v) => !v)}
          className="rounded bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/30 print:hidden"
        >
          {showBlockerForm ? 'Fechar' : 'Marcar bloqueio'}
        </button>
      </div>

      {showBlockerForm && (
        <form onSubmit={handleAddBlocker} className="mb-4 space-y-3 print:hidden">
          <input name="titleOrTopic" placeholder="Onde trava?" required className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none" />
          <select name="severity" defaultValue="2" className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white focus:border-orbitus-accent focus:outline-none">
            <option value={1}>1 - Leve</option>
            <option value={2}>2 - Média</option>
            <option value={3}>3 - Alta</option>
          </select>
          <textarea name="observation" rows={2} placeholder="Observação (opcional)" className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none" />
          <div>
            <label className="mb-1 block text-sm text-gray-400">Tags (opcional)</label>
            <input
              name="tagsInput"
              type="text"
              placeholder="ex.: lógica, sintaxe — separadas por vírgula"
              className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
            />
          </div>
          {blockerError && <p id="blocker-error" className="text-sm text-red-400" role="alert">{blockerError}</p>}
          <button type="submit" disabled={blockerSubmitting} className="rounded bg-amber-500/20 px-4 py-2 text-sm text-amber-400 disabled:opacity-50">
            {blockerSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      )}

      {displayBlockers.length === 0 ? (
        <p className="text-gray-500">Nenhum bloqueio registrado.</p>
      ) : (
        <ul className="space-y-3">
          {displayBlockers.map((b) => (
            <li key={b.id} className="print-sheet-row rounded-lg bg-orbitus-dark/50 px-3 py-2 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div>
                    <span className="font-medium text-white">{b.titleOrTopic}</span>
                    <span className="print-sheet-muted ml-2 text-gray-500">sev. {b.severity}</span>
                    {b.status === 'resolved' && (
                      <span className="ml-2 rounded bg-green-500/20 px-1.5 text-xs text-green-400">resolvido</span>
                    )}
                  </div>
                  {(b.tags?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Tags do bloqueio">
                      {(b.tags ?? []).map((tag) => (
                        <span
                          key={`${b.id}-${tag}`}
                          className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-200/90"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.observation ? (
                    <p className="print-sheet-muted mt-1.5 text-xs text-gray-400">{b.observation}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1 print:hidden">
                  <button
                    type="button"
                    onClick={() => setBlockerQuickEditId((cur) => (cur === b.id ? null : b.id))}
                    className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-orbitus-card"
                  >
                    {blockerQuickEditId === b.id ? 'Fechar' : 'Nota e tags'}
                  </button>
                  {b.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleResolve(b.id)}
                      className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>

              {blockerQuickEditId === b.id && (
                <form
                  key={`qe-${b.id}`}
                  className="mt-3 space-y-2 border-t border-gray-700/80 pt-3 print:hidden"
                  onSubmit={(e) => handleQuickEdit(e, b.id)}
                >
                  <label className="block text-xs text-gray-400">Nota / observação</label>
                  <textarea
                    name="quickObservation"
                    rows={2}
                    defaultValue={b.observation ?? ''}
                    className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
                    placeholder="Ex.: revisou com o tutor na sexta"
                  />
                  <label className="block text-xs text-gray-400">Tags (vírgula ou ponto e vírgula)</label>
                  <input
                    name="quickTags"
                    type="text"
                    defaultValue={(b.tags ?? []).join(', ')}
                    className="w-full rounded-lg border border-gray-600 bg-orbitus-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orbitus-accent focus:outline-none"
                    placeholder="ex.: sintaxe, revisão"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={blockerPatchingId === b.id}
                      className="rounded bg-amber-500/20 px-3 py-1.5 text-xs text-amber-300 disabled:opacity-50"
                    >
                      {blockerPatchingId === b.id ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-300"
                      onClick={() => setBlockerQuickEditId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
