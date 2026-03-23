import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useBoardContext } from "../../context/BoardContext";
import type { Task } from "../../types";

const MAX_TITLE_LENGTH = 200;

interface AddTaskFormProps {
  cardId: string;
}

/**
 * Inline task creation form rendered at the bottom of TaskSection.
 *
 * Behaviour per ticket AC-10 through AC-14:
 * - Enter with non-empty input → creates task, clears input, retains focus
 *   for rapid successive entry.
 * - Enter with empty / whitespace input → no-op, focus retained.
 * - Input longer than 200 chars is truncated before creation (AC-12).
 * - Escape while input is empty → collapses the form (AC-13).
 * - Escape while input has content → clears the input but keeps form open
 *   (consistent UX: user can still add tasks after accidentally typing).
 */
export function AddTaskForm({ cardId }: AddTaskFormProps) {
  const { dispatch } = useBoardContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const expandForm = () => {
    setIsExpanded(true);
    // Use rAF so the input is in the DOM before we try to focus it.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const createTask = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return; // AC-11: reject empty / whitespace-only

    const title = trimmed.slice(0, MAX_TITLE_LENGTH); // AC-12: truncate to 200 chars
    const now = new Date().toISOString();

    const newTask: Task = {
      id: uuidv4(),
      title,
      description: "",
      status: "todo",
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "ADD_TASK", payload: { cardId, task: newTask } });
    setInputValue("");
    // AC-14: retain focus for rapid sequential creation
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createTask();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (inputValue === "") {
        // AC-13: collapse form when input is already empty
        setIsExpanded(false);
      } else {
        // Clear content but keep the form open so user can start again
        setInputValue("");
      }
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={expandForm}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Add a task"
      >
        <Plus size={14} aria-hidden="true" />
        Add task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title... (Enter to save, Esc to cancel)"
        aria-label="New task title — press Enter to create"
        className="flex-1 px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
      />
      <button
        type="button"
        onClick={createTask}
        aria-label="Create task"
        className="shrink-0 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
