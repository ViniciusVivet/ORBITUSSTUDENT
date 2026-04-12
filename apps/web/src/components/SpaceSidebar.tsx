'use client';

import Link from 'next/link';
import { getPlanetColors } from '@/lib/planetColors';
import { logout } from '@/lib/mock-data';

interface Props {
  classGroups: { id: string; name: string }[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
}

function lightenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * 0.4);
  const lg = Math.round(g + (255 - g) * 0.4);
  const lb = Math.round(b + (255 - b) * 0.4);
  return `rgb(${lr},${lg},${lb})`;
}

export function SpaceSidebar({ classGroups, selectedGroupId, onSelect }: Props) {
  const allSelected = selectedGroupId === '';

  return (
    <aside className="hidden h-screen w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#050606]/95 backdrop-blur-md lg:flex">
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4e04d] text-sm font-black text-[#050606] shadow-[0_0_22px_rgba(244,224,77,0.22)]">
            O
          </div>
          <div>
            <span className="block text-sm font-bold text-white">Orbitus</span>
            <span className="block text-[10px] text-zinc-500">observatorio</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="Filtro por turma">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase text-zinc-600">Mapa de turmas</p>

        <button
          type="button"
          onClick={() => onSelect('')}
          className={`group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-all duration-200 ${
            allSelected ? 'border border-[#f4e04d]/35 bg-[#f4e04d]/10' : 'border border-transparent hover:bg-white/5'
          }`}
        >
          <div
            className="h-9 w-9 shrink-0 rounded-full transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #fff7c2, #f4e04d 58%, #5d5008)',
              boxShadow: allSelected ? '0 0 0 2px #f4e04d, 0 0 18px rgba(244,224,77,0.35)' : '0 2px 8px rgba(0,0,0,0.5)',
            }}
          />
          <span className={`truncate text-xs font-medium ${allSelected ? 'text-[#f4e04d]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
            Todas as orbitas
          </span>
        </button>

        {classGroups.map((group, index) => {
          const color = getPlanetColors(group.name, index);
          const selected = selectedGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`group flex w-full items-center gap-3 rounded-lg border px-2 py-2 text-left transition-all duration-200 ${
                selected ? 'border-white/10 bg-white/5' : 'border-transparent hover:bg-white/5'
              }`}
            >
              <div
                className="h-9 w-9 shrink-0 rounded-full transition-all duration-300 group-hover:scale-105"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${lightenColor(color.primary)}, ${color.primary} 60%, #050606)`,
                  boxShadow: selected ? `0 0 0 2px ${color.ring}, 0 0 16px ${color.glow}` : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
              <span className="truncate text-xs font-medium transition-colors" style={{ color: selected ? color.primary : undefined }}>
                {!selected && <span className="text-zinc-400 group-hover:text-zinc-200">{group.name}</span>}
                {selected && group.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 p-2">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-zinc-500 transition-all hover:bg-[#112217] hover:text-[#7ee787]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[10px] font-bold">SIG</span>
          <span>Sinais</span>
        </Link>
        <Link href="/students/new" className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-zinc-500 transition-all hover:bg-[#112217] hover:text-[#7ee787]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm font-bold">+</span>
          <span>Novo aluno</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs text-red-400/75 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 text-[10px] font-bold">OFF</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
