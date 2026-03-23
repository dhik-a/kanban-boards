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
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useBoardContext } from "../../context/BoardContext";
import { useFilterContext } from "../../context/FilterContext";
import { useToastContext } from "../../context/ToastContext";
import { Column } from "./Column";
import { AddColumn } from "./AddColumn";
import { CardDetail } from "../Card/CardDetail";
import { CardItemOverlay } from "../Card/CardItem";

/**
 * Top-level Board component.
 *
 * Responsibilities:
 * - Wraps the board in DndContext for both card and column drag-and-drop.
 * - Column IDs are plain UUIDs in SortableContext (horizontal layout).
 * - Card IDs are plain UUIDs in each Column's SortableContext (vertical layout).
 * - Distinguishes column vs card drag in onDragEnd by checking board.columns.
 * - Renders columns: flex-col on mobile (< md), flex-row with overflow-x-auto on desktop.
 * - Owns the "active card detail" state (which card modal is open).
 * - DnD is disabled for cards (but NOT columns) when any filter is active.
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

  // Track which item is being dragged.
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

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
    // Determine whether this is a column drag or card drag.
    const isColumn = board.columns.some((col) => col.id === id);
    if (isColumn) {
      setDraggingColumnId(id);
    } else {
      setDraggingCardId(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingCardId(null);
    setDraggingColumnId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Column reorder ────────────────────────────────────────────────────────
    const isActiveColumn = board.columns.some((col) => col.id === activeId);
    const isOverColumn = board.columns.some((col) => col.id === overId);

    // Phase 2: column reordering is disabled — columns are fixed.
    if (isActiveColumn && isOverColumn) {
      return;
    }

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
      // destination. The off-by-one that requires arrayMove only occurs during
      // same-column reorder because removal shifts subsequent indices.
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

  const canDelete = board.columns.length > 1;
  const columnIds = board.columns.map((col) => col.id);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/*
          Outer SortableContext for column reordering (horizontal).
          Each Column internally uses useSortable for its own ID.
        */}
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <main className="p-4 md:p-6">
            {/*
              Responsive layout (TICKET-011):
              - Mobile (< md): flex-col, columns stack vertically, each full width.
              - Desktop (>= md): flex-row, overflow-x-auto for horizontal scroll.
            */}
            <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-4 md:items-start">
              {board.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  canDelete={canDelete}
                  onOpenCardDetail={openCardDetail}
                />
              ))}
              <AddColumn />
            </div>
          </main>
        </SortableContext>

        {/* Floating preview for the item being dragged. */}
        <DragOverlay>
          {draggingCardId && state.cards[draggingCardId] ? (
            <CardItemOverlay card={state.cards[draggingCardId]} />
          ) : draggingColumnId ? (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 w-72 opacity-90 shadow-xl ring-2 ring-blue-400">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {board.columns.find((c) => c.id === draggingColumnId)?.title ?? "Column"}
              </p>
            </div>
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
