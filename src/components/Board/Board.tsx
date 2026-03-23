import { useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useBoardContext } from "../../context/BoardContext";
import { useFilterContext } from "../../context/FilterContext";
import { useToastContext } from "../../context/ToastContext";
import { Column } from "./Column";
import { CardDetail } from "../Card/CardDetail";
import { CardItemOverlay } from "../Card/CardItem";

/**
 * Phase 2 fixed column order. Columns are always rendered in this sequence
 * regardless of how they are stored in state. Board.tsx looks up each column
 * by title so the order is structural and cannot be changed by any mutation.
 *
 * PRD section 3.1 / TICKET-P2-004.
 */
const FIXED_COLUMN_TITLES = [
  "To Do",
  "In Progress",
  "Done",
  "Dropped",
  "Blocked",
] as const;

/**
 * Top-level Board component.
 *
 * Responsibilities:
 * - Wraps the board in DndContext for card drag-and-drop.
 * - Renders exactly 5 fixed columns in canonical order (TICKET-P2-004).
 * - Column reordering is disabled — columns are fixed per PRD section 3.1.
 * - Owns the "active card detail" state (which card modal is open).
 * - DnD is disabled for cards when any filter is active.
 *
 * Click-vs-drag detection: PointerSensor requires a 5px activation distance.
 */
export function Board() {
  const { state, dispatch } = useBoardContext();
  const { isFiltering } = useFilterContext();
  const { addToast } = useToastContext();
  const { board } = state;

  // Card detail modal state.
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCardColumnId, setActiveCardColumnId] = useState<string | null>(null);

  // Track which card is being dragged (for DragOverlay).
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // Store the trigger element so focus can be restored when the modal closes.
  const modalTriggerRef = useRef<HTMLElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    // Only card drags are supported in Phase 2 (column drag removed).
    const isColumn = board.columns.some((col) => col.id === id);
    if (!isColumn) {
      setDraggingCardId(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingCardId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Column drag is disabled in Phase 2 — ignore any column drag events.
    const isActiveColumn = board.columns.some((col) => col.id === activeId);
    if (isActiveColumn) return;

    // ── Card DnD — disabled when filtering ───────────────────────────────────
    if (isFiltering) return;

    // Find source column (the column that contains the dragged card).
    const sourceColumn = board.columns.find((col) => col.cardIds.includes(activeId));
    if (!sourceColumn) return;

    // Determine destination column.
    // 'over' can be:
    //   - a card ID (sorted item inside a column's SortableContext)
    //   - a "col-drop-{columnId}" droppable ID (column card-drop zone)
    const colDropPrefix = "col-drop-";
    const resolvedColumnId = overId.startsWith(colDropPrefix)
      ? overId.slice(colDropPrefix.length)
      : null;

    const destColumn =
      board.columns.find((col) => col.cardIds.includes(overId)) ??
      (resolvedColumnId ? board.columns.find((col) => col.id === resolvedColumnId) : undefined) ??
      board.columns.find((col) => col.id === overId);

    if (!destColumn) return;

    const sourceIndex = sourceColumn.cardIds.indexOf(activeId);
    const isCrossColumn = sourceColumn.id !== destColumn.id;

    if (!isCrossColumn) {
      // Same-column reorder. Use arrayMove to compute the final order before
      // dispatching — this avoids the off-by-one that occurs when dragging
      // downward because splice removes the card first, shifting all indices below.
      const destIndex = destColumn.cardIds.indexOf(overId);
      if (sourceIndex === destIndex || destIndex === -1) return;
      const newCardIds = arrayMove(sourceColumn.cardIds, sourceIndex, destIndex);
      dispatch({
        type: "MOVE_CARD",
        payload: {
          cardId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destColumn.id,
          sourceIndex,
          destinationIndex: destIndex,
          newCardIds,
        },
      });
    } else {
      // Cross-column move. No pre-computed newCardIds needed — the reducer
      // simply removes the card from the source column and splices it into the
      // destination.
      const isDroppedOnColumn =
        destColumn.id === overId || overId === `col-drop-${destColumn.id}`;
      const destIndex = isDroppedOnColumn
        ? destColumn.cardIds.length
        : destColumn.cardIds.indexOf(overId);

      dispatch({
        type: "MOVE_CARD",
        payload: {
          cardId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destColumn.id,
          sourceIndex,
          destinationIndex: destIndex >= 0 ? destIndex : destColumn.cardIds.length,
        },
      });

      const cardTitle = state.cards[activeId]?.title ?? "Card";
      addToast(`"${cardTitle}" moved to "${destColumn.title}".`, "success");
    }
  };

  const openCardDetail = (cardId: string, columnId: string) => {
    // Capture the currently focused element so we can restore it on modal close.
    modalTriggerRef.current = document.activeElement as HTMLElement;
    setActiveCardId(cardId);
    setActiveCardColumnId(columnId);
  };

  const closeCardDetail = () => {
    setActiveCardId(null);
    setActiveCardColumnId(null);
    // Restore focus to the card that opened the modal.
    requestAnimationFrame(() => {
      modalTriggerRef.current?.focus();
      modalTriggerRef.current = null;
    });
  };

  // Build the columns array in the fixed canonical order. If a column is not
  // found in state (e.g., during a transition), it is silently omitted.
  const orderedColumns = FIXED_COLUMN_TITLES
    .map((title) => board.columns.find((col) => col.title === title))
    .filter((col): col is NonNullable<typeof col> => col !== undefined);

  // Card IDs across all columns — used only to provide a flat SortableContext
  // id list for card-level DnD. Column IDs are not included (no column sort).
  const allCardIds = orderedColumns.flatMap((col) => col.cardIds);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allCardIds} strategy={verticalListSortingStrategy}>
          <main className="p-4 md:p-6">
            {/*
              Responsive layout (TICKET-011):
              - Mobile (< md): flex-col, columns stack vertically, each full width.
              - Desktop (>= md): flex-row, overflow-x-auto for horizontal scroll.
            */}
            <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-4 md:items-start">
              {orderedColumns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onOpenCardDetail={openCardDetail}
                />
              ))}
            </div>
          </main>
        </SortableContext>

        {/* Floating preview for the card being dragged. */}
        <DragOverlay>
          {draggingCardId && state.cards[draggingCardId] ? (
            <CardItemOverlay card={state.cards[draggingCardId]} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetail
        cardId={activeCardId}
        columnId={activeCardColumnId}
        onClose={closeCardDetail}
      />
    </>
  );
}
