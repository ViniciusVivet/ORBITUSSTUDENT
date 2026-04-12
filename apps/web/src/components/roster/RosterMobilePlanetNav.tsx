'use client';

import { getPlanetColors } from '@/lib/planetColors';

interface Props {
  classGroups: { id: string; name: string }[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
}

export function RosterMobilePlanetNav({ classGroups, selectedGroupId, onSelect }: Props) {
  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 px-3 pt-2 shrink-0 border-b border-[#1a2040]">
      <button
        type="button"
        onClick={() => onSelect('')}
        className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
          selectedGroupId === ''
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'border border-[#1a2040] text-gray-500 hover:text-gray-300'
        }`}
      >
        ✦ Todas
      </button>
      {classGroups.map((g, i) => {
        const color = getPlanetColors(g.name, i);
        const isSelected = selectedGroupId === g.id;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className="rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition"
            style={{
              background: isSelected ? color.bg : undefined,
              borderColor: isSelected ? color.ring : '#1a2040',
              color: isSelected ? color.primary : '#6b7280',
            }}
          >
            ● {g.name}
          </button>
        );
      })}
    </div>
  );
}
