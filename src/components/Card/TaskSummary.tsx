import { useMemo } from "react";
import { useBoardContext } from "../../context/BoardContext";

interface TaskSummaryProps {
  /** Ordered list of task IDs belonging to the parent card. */
  taskIds: string[];
}

/**
 * Compact task progress indicator displayed on each board card.
 *
 * - Returns null if there are no tasks on the card (AC-2).
 * - Returns null if all tasks are dropped — total would be 0 (AC-7).
 * - Dropped tasks are excluded from the denominator (AC-4).
 * - Blocked tasks count toward the denominator but not toward done (AC-5).
 * - Progress bar is 4px tall, gray background, green fill (AC-8).
 * - Text is small and muted; positioned below the card title (AC-9).
 */
export function TaskSummary({ taskIds }: TaskSummaryProps) {
  const { state } = useBoardContext();

  const { done, total } = useMemo(() => {
    // Short-circuit before iterating when the card has no tasks at all.
    if (taskIds.length === 0) return { done: 0, total: 0 };

    let doneCount = 0;
    let totalCount = 0;

    for (const id of taskIds) {
      const task = state.tasks[id];
      if (!task) continue;
      if (task.status === "dropped") continue; // excluded from denominator
      totalCount += 1;
      if (task.status === "done") doneCount += 1;
    }

    return { done: doneCount, total: totalCount };
  }, [taskIds, state.tasks]);

  // AC-2: no tasks on card.
  if (taskIds.length === 0) return null;

  // AC-7: all tasks are dropped — denominator would be 0.
  if (total === 0) return null;

  const progressPercent = (done / total) * 100;

  return (
    <div className="mt-2" aria-label={`Task progress: ${done} of ${total} tasks done`}>
      {/* "X/Y tasks" label */}
      <p className="text-xs text-slate-400 dark:text-slate-400 mb-1 tabular-nums">
        {done}/{total} tasks
      </p>

      {/* Progress bar track */}
      <div
        className="w-full h-1 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(progressPercent)}% complete`}
      >
        {/* Progress bar fill */}
        <div
          className="h-full rounded-full bg-green-400 transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
