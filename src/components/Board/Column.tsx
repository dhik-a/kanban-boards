import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnHeader } from "./ColumnHeader";
import { CardItem } from "../Card/CardItem";
import { AddCard } from "../Card/AddCard";
import { useBoardContext } from "../../context/BoardContext";
import { useFilterContext } from "../../context/FilterContext";
import type { Column as ColumnType, Card } from "../../types";
import { v4 as uuidv4 } from "uuid";

interface ColumnProps {
  column: ColumnType;
  onOpenCardDetail: (cardId: string, columnId: string) => void;
}

/**
 * Single column: header (read-only), card list, add-card input.
 *
 * Phase 2 (TICKET-P2-004): column drag-to-reorder has been removed. Columns are
 * fixed and non-configurable per PRD section 3.1.
 *
 * Card filtering (TICKET-008): when isFiltering, cards are filtered client-side.
 * DnD is disabled for cards when any filter is active.
 */
export function Column({ column, onOpenCardDetail }: ColumnProps) {
  const { state, dispatch } = useBoardContext();
  const { searchQuery, priorityFilter, labelFilter, isFiltering } = useFilterContext();

  // Make the column droppable for card drops.
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
          taskIds: [],
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
  const visibleCards = useMemo(() => {
    if (!isFiltering) return allCards;
    const query = searchQuery.trim().toLowerCase();
    return allCards.filter((card) => {
      const matchesSearch = query === "" || card.title.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === null || card.priority === priorityFilter;
      const matchesLabel =
        labelFilter === null ||
        card.labels.some((l) => l.toLowerCase() === labelFilter.toLowerCase());
      return matchesSearch && matchesPriority && matchesLabel;
    });
  }, [allCards, isFiltering, searchQuery, priorityFilter, labelFilter]);

  return (
    <section
      aria-label={`${column.title} column`}
      className={[
        // Responsive: full-width on mobile, fixed-width on desktop (TICKET-011).
        "w-full md:flex-shrink-0 md:w-72",
        "bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex flex-col gap-1",
        "transition-colors duration-150",
        isOver ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-600" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ColumnHeader column={column} />

      {/* Card list */}
      <div ref={setDropRef} className="flex-1">
        {visibleCards.length === 0 ? (
          <div
            aria-label={isFiltering ? "No matching cards" : "No cards in this column"}
            className="py-8 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg"
          >
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {isFiltering ? "No matching cards" : "No cards yet"}
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
                  isDragDisabled={isFiltering}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </div>

      {/* Only show Add Card when not filtering — avoids confusion about where a new card lands. */}
      {!isFiltering && <AddCard onAddCard={handleAddCard} />}
    </section>
  );
}
