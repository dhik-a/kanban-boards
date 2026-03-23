import { useMemo } from "react";
import { useBoardContext } from "../../context/BoardContext";
import { TaskItem } from "./TaskItem";
import type { Task, TaskStatus } from "../../types";

interface TaskListProps {
  taskIds: string[];
  cardId: string;
  /**
   * P2-007: When set, only tasks with a matching status are rendered.
   * Null means "show all" (no filter active).
   */
  statusFilter: TaskStatus | null;
}

/**
 * Renders an ordered list of TaskItem components.
 *
 * AC-2: Tasks are displayed in creation order (oldest first) — the order of
 * taskIds in Card.taskIds is already maintained by the ADD_TASK reducer which
 * appends new IDs to the end of the array. No additional sorting is needed here.
 *
 * P2-007: When statusFilter is non-null, only tasks matching that status are
 * rendered. If the filter produces zero results, an inline empty message is
 * shown (distinct from TaskEmptyState which covers the "no tasks at all" case).
 */
export function TaskList({ taskIds, cardId, statusFilter }: TaskListProps) {
  const { state } = useBoardContext();

  // Resolve taskIds → Task objects, skipping any orphaned IDs.
  const allTasks = useMemo<Task[]>(
    () =>
      taskIds
        .map((id) => state.tasks[id])
        .filter((task): task is Task => task !== undefined),
    [taskIds, state.tasks]
  );

  // Apply status filter when active.
  const visibleTasks = useMemo<Task[]>(
    () =>
      statusFilter === null
        ? allTasks
        : allTasks.filter((task) => task.status === statusFilter),
    [allTasks, statusFilter]
  );

  // When a status filter is active and produces zero results, show an inline
  // message — not TaskEmptyState (which is reserved for "no tasks at all").
  if (visibleTasks.length === 0) {
    const statusLabels: Record<TaskStatus, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      done: "Done",
      dropped: "Dropped",
      blocked: "Blocked",
    };
    const label = statusFilter ? statusLabels[statusFilter] : "";
    return (
      <p
        className="text-sm text-slate-500 dark:text-slate-400 italic py-1"
        role="status"
        aria-live="polite"
      >
        No {label} tasks.
      </p>
    );
  }

  return (
    <ul aria-label="Tasks" className="divide-y divide-slate-100 dark:divide-slate-700">
      {visibleTasks.map((task) => (
        <TaskItem key={task.id} task={task} cardId={cardId} />
      ))}
    </ul>
  );
}
