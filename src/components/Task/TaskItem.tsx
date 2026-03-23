import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { useBoardContext } from "../../context/BoardContext";
import type { Task, TaskStatus } from "../../types";

// ─── Status configuration ──────────────────────────────────────────────────────

interface StatusOption {
  value: TaskStatus;
  label: string;
  /** Tailwind classes for the colored badge rendered next to the select. */
  badgeClass: string;
}

/**
 * AC-15: Status color mapping mirrors the five fixed column colors.
 *   todo        → slate  (#94a3b8)
 *   in_progress → blue   (#3b82f6)
 *   done        → green  (#22c55e)
 *   dropped     → red    (#ef4444)
 *   blocked     → amber  (#f59e0b)
 */
const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "todo",
    label: "To Do",
    badgeClass:
      "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  },
  {
    value: "in_progress",
    label: "In Progress",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  {
    value: "done",
    label: "Done",
    badgeClass:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  },
  {
    value: "dropped",
    label: "Dropped",
    badgeClass:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
  },
  {
    value: "blocked",
    label: "Blocked",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  },
];

const STATUS_MAP = new Map<TaskStatus, StatusOption>(
  STATUS_OPTIONS.map((opt) => [opt.value, opt])
);

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  cardId: string;
}

/**
 * Single task row inside TaskList.
 *
 * Title area:
 *   - Click → enters inline edit mode (AC-3).
 *   - Enter or blur while editing → saves (AC-3, AC-5).
 *   - Escape while editing → cancels without saving (AC-4).
 *
 * Status dropdown:
 *   - Native <select> with color-coded badge reflecting current status (AC-6, AC-15).
 *   - Changing value dispatches UPDATE_TASK immediately — no confirmation (AC-6).
 *
 * Delete:
 *   - Trash icon opens ConfirmDialog with exact message from AC-7.
 *   - Confirm dispatches DELETE_TASK (AC-7).
 *   - Cancel closes dialog, task unchanged (AC-8).
 */
export function TaskItem({ task, cardId }: TaskItemProps) {
  const { dispatch } = useBoardContext();

  // ── Inline edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Delete confirmation state ──────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Focus + select-all when entering edit mode.
  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        editInputRef.current?.select();
      });
    }
  }, [isEditing]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const enterEditMode = () => {
    setEditValue(task.title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      dispatch({
        type: "UPDATE_TASK",
        payload: { id: task.id, cardId, updates: { title: trimmed } },
      });
    } else if (!trimmed) {
      // Revert to original if user cleared the field
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    dispatch({
      type: "UPDATE_TASK",
      payload: { id: task.id, cardId, updates: { status: newStatus } },
    });
  };

  const handleDeleteConfirm = () => {
    dispatch({ type: "DELETE_TASK", payload: { taskId: task.id, cardId } });
    setShowDeleteConfirm(false);
  };

  const statusOption = STATUS_MAP.get(task.status) ?? STATUS_OPTIONS[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <li className="flex items-center gap-2 py-1.5 group">
        {/* Title — read mode or edit mode */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={commitEdit}
              maxLength={200}
              aria-label="Edit task title — press Enter to save, Escape to cancel"
              className="w-full px-2 py-1 text-sm border border-blue-400 rounded-md bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          ) : (
            <button
              type="button"
              onClick={enterEditMode}
              aria-label={`Edit task: ${task.title}`}
              className={[
                "w-full text-left text-sm px-2 py-1 rounded-md transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                task.status === "done"
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-700 dark:text-slate-200",
              ].join(" ")}
            >
              {task.title}
            </button>
          )}
        </div>

        {/* Status dropdown */}
        <div className="shrink-0 relative">
          {/* Color badge — visually reflects the current status */}
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusOption.badgeClass}`}
            aria-hidden="true"
          >
            {statusOption.label}
          </span>
          {/* Overlay select for interaction — visually hidden behind the badge */}
          <select
            value={task.status}
            onChange={handleStatusChange}
            aria-label={`Task status: ${statusOption.label}`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`Delete task "${task.title}"`}
          className={[
            "shrink-0 p-1 rounded-md text-slate-400 dark:text-slate-500",
            "hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
          ].join(" ")}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </li>

      {/* AC-7 / AC-8: Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete task?"
        message={`Delete task "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}
