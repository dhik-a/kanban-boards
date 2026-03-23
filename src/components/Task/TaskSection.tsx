import { useBoardContext } from "../../context/BoardContext";
import { TaskList } from "./TaskList";
import { TaskEmptyState } from "./TaskEmptyState";
import { AddTaskForm } from "./AddTaskForm";

interface TaskSectionProps {
  cardId: string;
}

/**
 * Container for all task-related UI within the Card detail modal.
 *
 * AC-1 layout:
 *   1. "Tasks" section label
 *   2. TaskList (if the card has tasks) OR TaskEmptyState (if no tasks)
 *   3. AddTaskForm — always visible for creating new tasks
 */
export function TaskSection({ cardId }: TaskSectionProps) {
  const { state } = useBoardContext();
  const card = state.cards[cardId];

  // Guard: if the card has been removed from state, render nothing.
  if (!card) return null;

  const hasTasks = card.taskIds.length > 0;

  return (
    <section aria-labelledby="tasks-section-label">
      <h3
        id="tasks-section-label"
        className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2"
      >
        Tasks
        {hasTasks && (
          <span className="ml-1.5 font-normal normal-case text-slate-400 dark:text-slate-500">
            ({card.taskIds.length})
          </span>
        )}
      </h3>

      {hasTasks ? (
        <TaskList taskIds={card.taskIds} cardId={cardId} />
      ) : (
        <TaskEmptyState />
      )}

      <div className="mt-2">
        <AddTaskForm cardId={cardId} />
      </div>
    </section>
  );
}
