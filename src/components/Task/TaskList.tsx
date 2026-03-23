import { useBoardContext } from "../../context/BoardContext";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  taskIds: string[];
  cardId: string;
}

/**
 * Renders an ordered list of TaskItem components.
 *
 * AC-2: Tasks are displayed in creation order (oldest first) — the order of
 * taskIds in Card.taskIds is already maintained by the ADD_TASK reducer which
 * appends new IDs to the end of the array. No additional sorting is needed here.
 */
export function TaskList({ taskIds, cardId }: TaskListProps) {
  const { state } = useBoardContext();

  return (
    <ul aria-label="Tasks" className="divide-y divide-slate-100 dark:divide-slate-700">
      {taskIds.map((taskId) => {
        const task = state.tasks[taskId];
        // Guard: skip any taskId that has no matching task in state (defensive coding).
        if (!task) return null;
        return <TaskItem key={taskId} task={task} cardId={cardId} />;
      })}
    </ul>
  );
}
