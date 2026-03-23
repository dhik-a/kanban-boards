import type { Column } from "../../types";

// ─── ColumnHeader ─────────────────────────────────────────────────────────────

interface ColumnHeaderProps {
  column: Column;
}

/**
 * Column header: read-only display of the color accent bar, column title,
 * and card count badge.
 *
 * Phase 2 (TICKET-P2-004): all edit/delete/color-picker/drag-handle UI has
 * been removed. Columns are fixed and non-configurable per PRD section 3.1.
 */
export function ColumnHeader({ column }: ColumnHeaderProps) {
  const cardCount = column.cardIds.length;

  return (
    <div className="mb-2">
      {/* Color accent bar */}
      <div
        className="h-1 rounded-full mb-2"
        style={{ backgroundColor: column.color }}
        aria-hidden="true"
      />

      {/* Header row: title + badge */}
      <div className="flex items-center gap-1">
        {/* Read-only column title */}
        <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate px-1">
          {column.title}
        </span>

        {/* Card count badge */}
        <span
          aria-label={`${cardCount} card${cardCount !== 1 ? "s" : ""}`}
          className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full"
        >
          {cardCount}
        </span>
      </div>
    </div>
  );
}
