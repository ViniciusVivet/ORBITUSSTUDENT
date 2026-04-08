'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import type { BlockerItem } from '@/lib/mock-data';
import { apiFetch } from '@/lib/api/client';

interface Props {
  studentId: string;
  blockers: BlockerItem[];
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

function SeverityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['', 'Baixa', 'Média', 'Alta'];
  const colors = ['', 'bg-green-500/20 text-green-400 ring-green-500/40', 'bg-amber-500/20 text-amber-400 ring-amber-500/40', 'bg-red-500/20 text-red-400 ring-red-500/40'];
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${n === value ? colors[n] : 'bg-orbitus-border/50 text-gray-500 ring-orbitus-border hover:text-gray-300'}`}
        >
          {labels[n]}
        </button>
      ))}
    </div>
  );
}

export function BlockersTab({ studentId, blockers, onUpdate, showToast }: Props) {
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerTitle, setBlockerTitle] = useState('');
  const [blockerSeverity, setBlockerSeverity] = useState(1);
  const [blockerObs, setBlockerObs] = useState('');
  const [blockerSending, setBlockerSending] = useState(false);
  const [blockerError, setBlockerError] = useState('');
  const isDemo = isDemoMode();

  async function submitBlocker() {
    if (!blockerTitle.trim()) { setBlockerError('Informe o tópico do bloqueio.'); return; }
    if (isDemo) { setBlockerError('Modo demo — conecte a API.'); return; }
    setBlockerError('');
    setBlockerSending(true);
    try {
      await apiFetch(`/students/${studentId}/blockers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleOrTopic: blockerTitle.trim(), severity: blockerSeverity, observation: blockerObs.trim() || undefined }),
      });
      showToast('🚧 Bloqueio registrado!');
      setBlockerTitle('');
      setBlockerObs('');
      setShowBlockerForm(false);
      onUpdate();
    } catch (err) {
      setBlockerError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      setBlockerSending(false);
    }
  }

  async function resolveBlocker(blockerId: string) {
    if (isDemo) { showToast('Modo demo — conecte a API.'); return; }
    try {
      await apiFetch(`/students/${studentId}/blockers/${blockerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      showToast('✅ Bloqueio resolvido!');
      onUpdate();
    } catch { showToast('Falha ao resolver.'); }
  }

  const activeBlockers = blockers.filter((b) => b.status === 'active');

  return (
    <div className="space-y-3">
      {activeBlockers.length === 0 && (
        <div className="rounded-lg border border-dashed border-orbitus-border p-4 text-center">
          <p className="text-sm text-gray-500">Nenhum bloqueio ativo.</p>
        </div>
      )}
      {activeBlockers.map((b) => (
        <div key={b.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-200 text-sm">{b.titleOrTopic}</p>
              {b.observation && <p className="mt-0.5 text-xs text-gray-500">{b.observation}</p>}
              <div className="mt-1 flex gap-1">
                {b.tags.map((t) => (
                  <span key={t} className="rounded bg-orbitus-border/60 px-1.5 py-0.5 text-[10px] text-gray-400">{t}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void resolveBlocker(b.id)}
              className="shrink-0 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs text-green-400 hover:bg-green-500/20 transition"
            >
              Resolver
            </button>
          </div>
        </div>
      ))}

      {!showBlockerForm ? (
        <button
          type="button"
          onClick={() => setShowBlockerForm(true)}
          className="btn-secondary w-full justify-center"
        >
          + Marcar bloqueio
        </button>
      ) : (
        <div className="rounded-lg border border-orbitus-border p-3 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Novo bloqueio</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Tópico / descrição</label>
            <input
              type="text"
              value={blockerTitle}
              onChange={(e) => setBlockerTitle(e.target.value)}
              placeholder="Ex.: Condicionais if/else"
              className="input-field w-full text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Gravidade</label>
            <SeverityPicker value={blockerSeverity} onChange={setBlockerSeverity} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Observação (opcional)</label>
            <textarea
              value={blockerObs}
              onChange={(e) => setBlockerObs(e.target.value)}
              rows={2}
              className="input-field w-full text-sm resize-none"
            />
          </div>
          {blockerError && <p className="text-xs text-red-400">{blockerError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submitBlocker} disabled={blockerSending} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {blockerSending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setShowBlockerForm(false)} className="btn-ghost px-3 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
