import { useState } from "react";
import { useBoardContext } from "../../context/BoardContext";
import { TaskList } from "./TaskList";
import { TaskEmptyState } from "./TaskEmptyState";
import { AddTaskForm } from "./AddTaskForm";
import type { TaskStatus } from "../../types";

interface TaskSectionProps {
  cardId: string;
}

// ─── Status filter configuration ─────────────────────────────────────────────

interface StatusFilterOption {
  value: TaskStatus;
  label: string;
  /** Active state Tailwind classes — mirrors TaskItem STATUS_OPTIONS badge colors. */
  activeClass: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  {
    value: "todo",
    label: "To Do",
    activeClass:
      "bg-slate-200 text-slate-700 border-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500",
  },
  {
    value: "in_progress",
    label: "In Progress",
    activeClass:
      "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600",
  },
  {
    value: "done",
    label: "Done",
    activeClass:
      "bg-green-100 text-green-700 border-green-400 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600",
  },
  {
    value: "dropped",
    label: "Dropped",
    activeClass:
      "bg-red-100 text-red-700 border-red-400 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600",
  },
  {
    value: "blocked",
    label: "Blocked",
    activeClass:
      "bg-amber-100 text-amber-700 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Container for all task-related UI within the Card detail modal.
 *
 * AC-1 layout:
 *   1. "Tasks" section label (with count)
 *   2. Status filter buttons (only when card has tasks — P2-007)
 *   3. TaskList (if card has tasks, filtered by active status) OR TaskEmptyState
 *   4. AddTaskForm — always visible for creating new tasks
 *
 * P2-007 filter behaviour:
 *   - Single-select; clicking the active filter clears it (shows all).
 *   - Filter resets when CardDetail closes (ephemeral local state).
 *   - Does NOT affect the board-level isFiltering flag — DnD is unaffected.
 */
export function TaskSection({ cardId }: TaskSectionProps) {
  const { state } = useBoardContext();
  const card = state.cards[cardId];

  // P2-007: ephemeral task status filter — local state, not in FilterContext.
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | null>(null);

  // Guard: if the card has been removed from state, render nothing.
  if (!card) return null;

  const hasTasks = card.taskIds.length > 0;
  const totalTaskCount = card.taskIds.length;

  // Derive filtered count for the heading label when a filter is active.
  const filteredTaskCount =
    taskStatusFilter === null
      ? totalTaskCount
      : card.taskIds.filter((id) => {
          const task = state.tasks[id];
          return task && task.status === taskStatusFilter;
        }).length;

  const isFiltering = taskStatusFilter !== null;

  const handleFilterClick = (status: TaskStatus) => {
    // Toggle: clicking the active filter clears it.
    setTaskStatusFilter((prev) => (prev === status ? null : status));
  };

  return (
    <section aria-labelledby="tasks-section-label">
      <h3
        id="tasks-section-label"
        className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2"
      >
        Tasks
        {hasTasks && (
          <span className="ml-1.5 font-normal normal-case text-slate-400 dark:text-slate-500">
            {isFiltering
              ? `(${filteredTaskCount} of ${totalTaskCount})`
              : `(${totalTaskCount})`}
          </span>
        )}
      </h3>

      {/* P2-007: Status filter bar — only rendered when the card has tasks. */}
      {hasTasks && (
        <div
          className="flex flex-wrap items-center gap-1 mb-2"
          role="group"
          aria-label="Filter tasks by status"
        >
          {STATUS_FILTER_OPTIONS.map(({ value, label, activeClass }) => {
            const isActive = taskStatusFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleFilterClick(value)}
                aria-pressed={isActive}
                className={[
                  "px-2 py-0.5 text-xs font-medium rounded-md border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive
                    ? activeClass
                    : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {hasTasks ? (
        <TaskList
          taskIds={card.taskIds}
          cardId={cardId}
          statusFilter={taskStatusFilter}
        />
      ) : (
        <TaskEmptyState />
      )}

      <div className="mt-2">
        <AddTaskForm cardId={cardId} />
      </div>
    </section>
  );
}
