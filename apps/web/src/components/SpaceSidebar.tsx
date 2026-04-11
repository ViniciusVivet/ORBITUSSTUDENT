'use client';

import Link from 'next/link';
import { getPlanetColors } from '@/lib/planetColors';
import { logout } from '@/lib/mock-data';

interface Props {
  classGroups: { id: string; name: string }[];
  selectedGroupId: string; // '' = all
  onSelect: (id: string) => void;
  onNavigate?: (path: string) => void;
}

function lightenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // blend with white at 40%
  const lr = Math.round(r + (255 - r) * 0.4);
  const lg = Math.round(g + (255 - g) * 0.4);
  const lb = Math.round(b + (255 - b) * 0.4);
  return `rgb(${lr},${lg},${lb})`;
}

export function SpaceSidebar({ classGroups, selectedGroupId, onSelect }: Props) {
  const allSelected = selectedGroupId === '';

  return (
    <aside className="hidden lg:flex flex-col w-[200px] shrink-0 h-screen bg-[#0a0e1a]/95 backdrop-blur-md border-r border-[#1a2040] overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[#1a2040] shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 shadow-[0_0_12px_rgba(139,92,246,0.5)] text-sm shrink-0">
          ⚔
        </div>
        <span className="font-bold text-white tracking-tight text-sm">Orbitus</span>
      </div>

      {/* Planet list */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Filtro por turma">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Turmas</p>

        {/* "Todas" option — golden star */}
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-all duration-200 group ${
            allSelected
              ? 'bg-amber-500/10 ring-1 ring-amber-500/30'
              : 'hover:bg-white/5'
          }`}
        >
          <div
            className="w-9 h-9 rounded-full shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #fef3c7, #fbbf24 60%, #92400e)',
              boxShadow: allSelected
                ? '0 0 0 2px #fbbf24, 0 0 16px rgba(251,191,36,0.4)'
                : '0 2px 8px rgba(0,0,0,0.5)',
            }}
          />
          <span className={`text-xs font-medium truncate ${allSelected ? 'text-amber-300' : 'text-gray-400 group-hover:text-gray-200'}`}>
            ✦ Todas
          </span>
        </button>

        {/* Class group planets */}
        {classGroups.map((group, i) => {
          const color = getPlanetColors(group.name, i);
          const selected = selectedGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-all duration-200 group ${
                selected
                  ? 'bg-white/5'
                  : 'hover:bg-white/5'
              }`}
            >
              <div
                className="w-9 h-9 rounded-full shrink-0 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${lightenColor(color.primary)}, ${color.primary} 60%, #0a0e1a)`,
                  boxShadow: selected
                    ? `0 0 0 2px ${color.ring}, 0 0 16px ${color.glow}`
                    : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
              <span
                className="text-xs font-medium truncate transition-colors"
                style={{ color: selected ? color.primary : undefined }}
              >
                {!selected && <span className="text-gray-400 group-hover:text-gray-200">{group.name}</span>}
                {selected && group.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-[#1a2040] p-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all"
        >
          <span className="w-9 h-9 flex items-center justify-center text-base">📊</span>
          <span>Dashboard</span>
        </Link>
        <Link
          href="/students/new"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all"
        >
          <span className="w-9 h-9 flex items-center justify-center text-base">➕</span>
          <span>+ Aluno</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-xs text-red-500/70 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <span className="w-9 h-9 flex items-center justify-center text-base">🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
