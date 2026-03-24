import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnHeader } from "./ColumnHeader";
import { CardItem } from "../Card/CardItem";
import { AddCard } from "../Card/AddCard";
import { useBoardContext } from "../../context/BoardContext";
import { useFilterContext } from "../../context/FilterContext";
import type { Column as ColumnType, Card } from "../../types";
import { v4 as uuidv4 } from "uuid";

interface ColumnProps {
  column: ColumnType;
  canDelete: boolean;
  onOpenCardDetail: (cardId: string, columnId: string) => void;
}

/**
 * Single column: drag handle (for column reorder), header, card list, add-card input.
 *
 * Column DnD (TICKET-010): the column itself uses useSortable so it can be reordered.
 * The drag handle is rendered inside ColumnHeader via dragHandleProps. The column
 * container uses the sortable transform/transition for smooth animation during reorder.
 *
 * Card filtering (TICKET-008): when isFiltering, cards are filtered client-side.
 * DnD is disabled for cards when any filter is active.
 *
 * Column ID prefix scheme (TICKET-010): column sortable IDs are plain column UUIDs.
 * Card sortable IDs are plain card UUIDs. Board.tsx distinguishes them by checking
 * whether the ID belongs to a column or a card.
 */
export function Column({ column, canDelete, onOpenCardDetail }: ColumnProps) {
  const { state, dispatch } = useBoardContext();
  const { searchQuery, priorityFilter, labelFilter, projectFilter, isHardFiltering } = useFilterContext();

  // Column sortable (for column reordering in Board).
  const {
    attributes: colAttributes,
    listeners: colListeners,
    setNodeRef: setColRef,
    transform: colTransform,
    transition: colTransition,
    isDragging: isColDragging,
  } = useSortable({ id: column.id });

  const colStyle = {
    transform: CSS.Transform.toString(colTransform),
    transition: colTransition ?? undefined,
  };

  // Make the column droppable for card drops.
  // Uses a prefixed ID ("col-drop-{id}") to avoid conflict with useSortable
  // which is already registered under the plain column.id for column reordering.
  const dropId = `col-drop-${column.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });

  const handleAddCard = (title: string) => {
    const now = new Date().toISOString();
    dispatch({
      type: "ADD_CARD",
      payload: {
        columnId: column.id,
        card: {
          id: uuidv4(),
          title,
          description: "",
          priority: "medium",
          labels: [],
          // Auto-assign to active project filter if one is set.
          projectId: projectFilter ?? null,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
  };

  // All cards in this column (preserves order).
  const allCards = useMemo(
    () =>
      column.cardIds
        .map((id) => state.cards[id])
        .filter((card): card is Card => card !== undefined),
    [column.cardIds, state.cards]
  );

  // Visible cards: apply search/filter when active.
  // Note: projectFilter is always applied (not conditional like search/priority/label).
  const visibleCards = useMemo(() => {
    // First, always filter by project.
    // Use ?? null to handle backward-compat: old cards have undefined projectId.
    const allCardsFiltered = allCards.filter((card) => {
      const matchesProject = projectFilter === null || (card.projectId ?? null) === projectFilter;
      return matchesProject;
    });

    // Then apply search/priority/label filters if active.
    if (!isHardFiltering) return allCardsFiltered;

    const query = searchQuery.trim().toLowerCase();
    return allCardsFiltered.filter((card) => {
      const matchesSearch = query === "" || card.title.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === null || card.priority === priorityFilter;
      const matchesLabel =
        labelFilter === null ||
        card.labels.some((l) => l.toLowerCase() === labelFilter.toLowerCase());
      return matchesSearch && matchesPriority && matchesLabel;
    });
  }, [allCards, isHardFiltering, searchQuery, priorityFilter, labelFilter, projectFilter]);

  // dragHandleProps — passed to ColumnHeader so the handle is on the grip icon.
  const dragHandleProps = {
    ...colAttributes,
    ...colListeners,
  };

  return (
    <section
      ref={setColRef}
      style={colStyle}
      aria-label={`${column.title} column`}
      className={[
        // Responsive: full-width on mobile, fixed-width on desktop (TICKET-011).
        "w-full md:flex-shrink-0 md:w-72",
        "bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex flex-col gap-1",
        "transition-colors duration-150",
        isOver && !isColDragging ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-600" : "",
        isColDragging ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ColumnHeader
        column={column}
        canDelete={canDelete}
        dragHandleProps={dragHandleProps}
      />

      {/* Card list */}
      <div ref={setDropRef} className="flex-1">
        {visibleCards.length === 0 ? (
          <div
            aria-label={
              isHardFiltering
                ? "No matching cards"
                : projectFilter !== null
                  ? "No cards in this project"
                  : "No cards in this column"
            }
            className="py-8 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg"
          >
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {isHardFiltering
                ? "No matching cards"
                : projectFilter !== null
                  ? "No cards in this project"
                  : "No cards yet"}
            </p>
          </div>
        ) : (
          <SortableContext
            items={visibleCards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul role="list" className="space-y-2">
              {visibleCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onOpenDetail={(cardId) => onOpenCardDetail(cardId, column.id)}
                  isDragDisabled={isHardFiltering}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </div>

      {/* Hide Add Card during hard filtering (search/priority/label) to avoid confusion.
          Visible during project-only filtering — new cards are auto-assigned to that project. */}
      {!isHardFiltering && <AddCard onAddCard={handleAddCard} />}
    </section>
  );
}
