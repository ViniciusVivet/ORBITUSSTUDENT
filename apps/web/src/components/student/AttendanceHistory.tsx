'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { isDemoMode } from '@/lib/mock-data';

interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'makeup';
  note?: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  present:  { label: 'Presente',   color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20', dot: 'bg-emerald-400' },
  absent:   { label: 'Ausente',    color: 'bg-red-500/15 text-red-400 ring-red-500/20',             dot: 'bg-red-400' },
  late:     { label: 'Atrasado',   color: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',       dot: 'bg-amber-400' },
  makeup:   { label: 'Reposição',  color: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/20',          dot: 'bg-cyan-400' },
};

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function todayYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface Props {
  studentId: string;
}

export function AttendanceHistory({ studentId }: Props) {
  const [month, setMonth] = useState(todayYM);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (isDemoMode()) { setRecords([]); return; }
    setLoading(true);
    try {
      const data = await apiFetch<AttendanceRecord[]>(`/students/${studentId}/attendance?month=${month}`);
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, month]);

  useEffect(() => { void load(); }, [load]);

  const presentCount  = records.filter((r) => r.status === 'present').length;
  const absentCount   = records.filter((r) => r.status === 'absent').length;
  const lateCount     = records.filter((r) => r.status === 'late').length;
  const makeupCount   = records.filter((r) => r.status === 'makeup').length;
  const isCurrentMonth = month === todayYM();

  return (
    <div className="print-sheet-card rounded-xl border border-gray-700 bg-orbitus-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Histórico de presença</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(prevMonth)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-orbitus-border hover:text-white transition"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize text-gray-300">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth(nextMonth)}
            disabled={isCurrentMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-orbitus-border hover:text-white transition disabled:opacity-30"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {records.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {presentCount > 0 && <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">{presentCount} presente{presentCount > 1 ? 's' : ''}</span>}
          {absentCount  > 0 && <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">{absentCount} ausente{absentCount > 1 ? 's' : ''}</span>}
          {lateCount    > 0 && <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">{lateCount} atrasado{lateCount > 1 ? 's' : ''}</span>}
          {makeupCount  > 0 && <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/20">{makeupCount} reposição</span>}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-700" />)}
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isDemoMode() ? 'Histórico de presença não disponível em modo demo.' : 'Nenhum registro de presença neste mês.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {records.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.present;
            const dateLabel = new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-[#141832]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className="text-xs text-gray-400 w-28 shrink-0 capitalize">{dateLabel}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.color}`}>{meta.label}</span>
                {r.note && <span className="truncate text-xs text-gray-500">{r.note}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
