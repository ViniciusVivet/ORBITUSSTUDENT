'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudentListItem } from '@orbitus/shared';
import { AttentionHintsBadges } from '@/components/AttentionHintsBadges';
import { QuickLessonForm } from '@/components/roster/QuickLessonForm';

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
}: Props) {
  const xpInLevel = (s.xp ?? 0) % 100;
  const [quickOpen, setQuickOpen] = useState(false);

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

  // Border classes
  const attentionBorder = isInAttentionQueue ? 'border-l-4 border-l-amber-500' : '';
  const selectedBorder = selected ? 'ring-2 ring-orbitus-accent' : '';
  const bulkErrorBorder = bulkError ? 'ring-2 ring-red-500' : '';

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
        className={`card-interactive group p-4 focus:outline-none focus:ring-2 focus:ring-orbitus-accent/50 ${attentionBorder} ${selectedBorder} ${bulkErrorBorder}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orbitus-accent/30 to-purple-900/30 text-2xl ring-2 ring-orbitus-border group-hover:ring-orbitus-accent/40 transition">
              {s.avatarType === 'emoji' ? s.avatarValue : '🧑‍🎓'}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orbitus-accent text-[9px] font-bold text-white ring-2 ring-orbitus-card">
              {s.level ?? 1}
            </div>
            {/* Pulsing amber dot para alunos na fila de atencao */}
            {isInAttentionQueue && (
              <span
                className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-amber-500 animate-pulse ring-2 ring-orbitus-card"
                aria-label="Na fila de atenção"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-gray-100 group-hover:text-white">
              {s.displayName}
            </h2>
            <p className="text-xs text-gray-500">{s.classGroup?.name ?? 'Sem turma'}</p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Checkbox em modo selecao */}
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

            {/* Badge de status */}
            <span
              className={s.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}
            >
              {s.status === 'active' ? 'ativo' : s.status}
            </span>

            {/* Botao Quick Lesson (escondido em modo selecao) */}
            {!selectionMode && (
              <button
                type="button"
                onClick={handleQuickClick}
                aria-label={quickOpen ? 'Fechar formulário de aula' : 'Registrar aula rápido'}
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  quickOpen
                    ? 'bg-orbitus-accent text-white'
                    : 'border border-orbitus-border text-gray-400 hover:border-orbitus-accent/50 hover:text-orbitus-accent-bright'
                }`}
              >
                ⚡ Aula
              </button>
            )}
          </div>
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
