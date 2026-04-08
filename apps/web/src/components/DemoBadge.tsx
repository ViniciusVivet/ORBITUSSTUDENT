'use client';

import { isDemoMode } from '@/lib/mock-data';

export function DemoBadge() {
  if (!isDemoMode()) return null;
  return (
    <div
      className="fixed z-40 rounded-full border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 shadow-lg print:hidden"
      style={{
        right: 'max(1rem, env(safe-area-inset-right, 0px))',
        bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Modo demonstração"
    >
      Modo demo
    </div>
  );
}
