'use client';

import { motion } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { AttentionHintsBadges } from '@/components/AttentionHintsBadges';

interface Props {
  student: StudentListItem;
  index: number;
  focused: boolean;
  itemRef: (el: HTMLDivElement | null) => void;
  onClick: () => void;
}

export function StudentCard({ student: s, index, focused, itemRef, onClick }: Props) {
  const xpInLevel = (s.xp ?? 0) % 100;

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      role="button"
      tabIndex={focused ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onClick(); } }}
      className="card-interactive group p-4 focus:outline-none focus:ring-2 focus:ring-orbitus-accent/50"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orbitus-accent/30 to-purple-900/30 text-2xl ring-2 ring-orbitus-border group-hover:ring-orbitus-accent/40 transition">
            {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orbitus-accent text-[9px] font-bold text-white ring-2 ring-orbitus-card">
            {s.level ?? 1}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-gray-100 group-hover:text-white">{s.displayName}</h2>
          <p className="text-xs text-gray-500">{s.classGroup?.name ?? 'Sem turma'}</p>
        </div>
        <span className={s.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}>
          {s.status === 'active' ? 'ativo' : s.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">XP</span>
          <span className="badge-xp">{s.xp ?? 0}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-orbitus-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orbitus-xp to-amber-400 transition-all duration-500"
            style={{ width: `${xpInLevel}%` }}
          />
        </div>
      </div>

      <AttentionHintsBadges hints={s.attentionHints} className="mb-1" variant="card" />
    </motion.div>
  );
}
