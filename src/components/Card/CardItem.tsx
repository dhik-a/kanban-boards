import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../../types";
import { getLabelColor } from "../../utils/labelColor";
import { TaskSummary } from "./TaskSummary";

/**
 * Floating card rendered inside DragOverlay while a drag is in progress.
 * Rendered without drag handles and with a slight rotation/shadow to signal
 * it is detached from the list (HIGH #5).
 */
export function CardItemOverlay({ card }: { card: Card }) {
  return (
    <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-blue-300 dark:border-blue-500 p-3 opacity-95 rotate-1 cursor-grabbing">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{card.title}</p>
    </div>
  );
}

interface CardItemProps {
  card: Card;
  onOpenDetail: (cardId: string) => void;
  isDragDisabled?: boolean;
}

/** Maps a priority value to a Tailwind background color class. */
const PRIORITY_COLOR: Record<Card["priority"], string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

/** Maps a priority value to an accessible label. */
const PRIORITY_LABEL: Record<Card["priority"], string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

// Pixel threshold to distinguish a drag from a click.
const DRAG_THRESHOLD_PX = 5;

/**
 * Draggable card face component.
 *
 * Click or Enter opens CardDetail modal. Space is forwarded to dnd-kit's
 * KeyboardSensor for keyboard drag activation. Drag-and-drop is handled via
 * dnd-kit's useSortable. To avoid opening the modal after a drag, we track
 * whether the pointer moved more than DRAG_THRESHOLD_PX during the session.
 *
 * Keyboard accessibility (TICKET-012):
 * - tabIndex={0} ensures the card is in the tab order.
 * - Enter key fires onOpenDetail; Space is forwarded to dnd-kit for keyboard drag.
 * - role="button" so screen readers announce it as interactive.
 */
export function CardItem({ card, onOpenDetail, isDragDisabled = false }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isDragDisabled,
  });

  // Track pointer origin to detect drag vs click.
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  // When dragging, suppress the transition so the ghost doesn't snap — the
  // DragOverlay handles the floating preview instead (HIGH #5).
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transform ? undefined : transition,
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerOrigin.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerOrigin.current) return;
    const dx = Math.abs(e.clientX - pointerOrigin.current.x);
    const dy = Math.abs(e.clientY - pointerOrigin.current.y);
    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      didDragRef.current = true;
    }
  };

  const handleClick = () => {
    if (didDragRef.current) return;
    onOpenDetail(card.id);
  };


  // When this item is being dragged, render only a dashed placeholder so the
  // user can see exactly where the card will land (HIGH #5). The floating
  // preview is handled by DragOverlay in Board.tsx.
  if (isDragging) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 h-14"
        aria-hidden="true"
      />
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      // Spread dnd-kit attributes first, then override role/tabIndex/aria-label
      // so our values take precedence over the sortable defaults (TS2783 fix).
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      className={[
        "bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-600",
        "cursor-pointer select-none",
        "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      ].join(" ")}
      onPointerDown={(e) => {
        // Must call dnd-kit's listener FIRST so it can initiate drag detection,
        // then run our own origin-tracking for click-vs-drag disambiguation.
        listeners?.onPointerDown?.(e);
        handlePointerDown(e);
      }}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onKeyDown={(e) => {
        // dnd-kit's KeyboardSensor owns Space for drag activation.
        // Use Enter exclusively to open the card detail modal so the two
        // keyboard interactions don't collide (CRIT-1 / TICKET-010 Scenario 5).
        if (e.key === "Enter") {
          e.preventDefault();
          onOpenDetail(card.id);
          return;
        }
        // Forward all other keys (including Space) to dnd-kit's listener.
        listeners?.onKeyDown?.(e);
      }}
      aria-label={`${card.title}. ${PRIORITY_LABEL[card.priority]}. Press Enter to open, Space to drag.`}
    >
      {/* Priority color indicator */}
      <div className="flex items-start gap-2">
        <div
          className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${PRIORITY_COLOR[card.priority]}`}
          aria-label={PRIORITY_LABEL[card.priority]}
          role="img"
        />
        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-snug line-clamp-2 min-w-0">
          {card.title}
        </p>
      </div>

      {/* Label chips — deterministic color per label text (TICKET-006). */}
      {card.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1" aria-label="Labels">
          {card.labels.map((label) => (
            <span
              key={label}
              className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${getLabelColor(label)}`}
            >
              {label.substring(0, 20)}
            </span>
          ))}
        </div>
      )}

      {/* Task progress summary — hidden when card has no tasks (AC-2). */}
      <TaskSummary taskIds={card.taskIds} />
    </li>
  );
}
