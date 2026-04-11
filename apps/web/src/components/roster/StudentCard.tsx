'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { AttentionHintsBadges } from '@/components/AttentionHintsBadges';
import { QuickLessonForm } from '@/components/roster/QuickLessonForm';
import { getPlanetColors } from '@/lib/planetColors';

interface Props {
  student: StudentListItem;
  index: number;
  focused: boolean;
  itemRef: (el: HTMLDivElement | null) => void;
  onClick: () => void;
  isInAttentionQueue?: boolean;
  /** Se true, o card age como checkbox para selecao em lote */
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** Indica falha no registro em lote */
  bulkError?: boolean;
  /** Index da turma na lista para ciclo de cores */
  groupIndex?: number;
}

export function StudentCard({
  student: s,
  index,
  focused,
  itemRef,
  onClick,
  isInAttentionQueue = false,
  selectionMode = false,
  selected = false,
  onSelect,
  bulkError = false,
  groupIndex = 0,
}: Props) {
  const xpInLevel = (s.xp ?? 0) % 100;
  const [quickOpen, setQuickOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const planetColor = getPlanetColors(s.classGroup?.name ?? '', groupIndex);

  function handleCardClick() {
    if (selectionMode) {
      onSelect?.();
      return;
    }
    if (quickOpen) return;
    onClick();
  }

  function handleQuickClick(e: React.MouseEvent) {
    e.stopPropagation();
    setQuickOpen((v) => !v);
  }

  // Ring classes for states
  const selectedRing = selected ? `ring-2 ring-[${planetColor.ring}]` : '';
  const bulkErrorRing = bulkError ? 'ring-2 ring-red-500' : '';

  return (
    <div ref={itemRef} className="flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        role="button"
        tabIndex={focused ? 0 : -1}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative rounded-xl border bg-[#141832] p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-orbitus-accent/50 ${selectedRing} ${bulkErrorRing} ${isInAttentionQueue ? 'border-l-4 border-l-amber-500' : ''}`}
        style={{
          borderColor: isInAttentionQueue ? undefined : planetColor.ring + '60',
          boxShadow: hovered
            ? `0 8px 32px ${planetColor.glow}, 0 0 0 1px ${planetColor.ring}40`
            : selected
            ? `0 0 0 2px ${planetColor.ring}80`
            : undefined,
        }}
      >
        {/* Astronaut avatar */}
        <div
          className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${planetColor.primary}40, #141832 70%)`,
            boxShadow: `0 0 0 2px ${planetColor.ring}50, 0 4px 16px rgba(0,0,0,0.4)`,
          }}
        >
          {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🚀'}
          {/* Level badge */}
          <div
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black ring-2 ring-[#141832]"
            style={{ background: planetColor.primary }}
          >
            {s.level ?? 1}
          </div>
          {/* Attention pulse dot */}
          {isInAttentionQueue && (
            <span
              className="absolute -top-0.5 -left-0.5 h-3 w-3 rounded-full bg-amber-400 animate-pulse ring-2 ring-[#141832]"
              aria-label="Na fila de atenção"
            />
          )}
        </div>

        {/* Name + class group */}
        <div className="mb-2 text-center min-w-0">
          <h2 className="truncate font-semibold text-gray-100 text-sm">{s.displayName}</h2>
          <p className="text-[10px] text-gray-500 truncate">{s.classGroup?.name ?? 'Sem turma'}</p>
        </div>

        {/* Status + bulk checkbox row */}
        <div className="mb-3 flex items-center justify-between gap-1">
          {selectionMode && (
            <div
              className={`h-5 w-5 shrink-0 rounded border-2 transition ${
                selected
                  ? 'border-orbitus-accent bg-orbitus-accent'
                  : 'border-orbitus-border bg-transparent'
              } flex items-center justify-center`}
              aria-hidden
            >
              {selected && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}

          <span
            className={s.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}
          >
            {s.status === 'active' ? 'ativo' : s.status}
          </span>

          {/* Quick Lesson button (hidden in selection mode) */}
          {!selectionMode && (
            <button
              type="button"
              onClick={handleQuickClick}
              aria-label={quickOpen ? 'Fechar formulário de aula' : 'Registrar aula rápido'}
              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                quickOpen
                  ? 'bg-orbitus-accent text-white'
                  : 'border border-orbitus-border text-gray-400 hover:border-orbitus-accent/50 hover:text-orbitus-accent-bright'
              }`}
            >
              ⚡ Aula
            </button>
          )}
        </div>

        {/* XP bar — energy shield style */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>ENERGIA</span>
            <span style={{ color: planetColor.primary }}>{s.xp ?? 0} XP</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1a2040]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${xpInLevel}%`,
                background: `linear-gradient(90deg, ${planetColor.primary}80, ${planetColor.primary})`,
                boxShadow: `0 0 6px ${planetColor.glow}`,
              }}
            />
          </div>
        </div>

        <AttentionHintsBadges hints={s.attentionHints} className="mb-1" variant="card" />

        {bulkError && (
          <p className="mt-1 text-xs text-red-400">Falha ao registrar</p>
        )}
      </motion.div>

      {/* Inline quick lesson form */}
      <AnimatePresence>
        {quickOpen && !selectionMode && (
          <QuickLessonForm
            studentId={s.id}
            onClose={() => setQuickOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
