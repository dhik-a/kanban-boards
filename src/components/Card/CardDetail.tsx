import { useState, useCallback, useRef } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { Modal } from "../UI/Modal";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { TaskSection } from "../Task";
import { useBoardContext } from "../../context/BoardContext";
import { useToastContext } from "../../context/ToastContext";
import { getLabelColor } from "../../utils/labelColor";
import type { Card } from "../../types";

interface CardDetailProps {
  cardId: string | null;
  columnId: string | null;
  onClose: () => void;
}

const PRIORITY_OPTIONS: Array<{ value: Card["priority"]; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const PRIORITY_COLOR: Record<Card["priority"], string> = {
  low: "text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/40 dark:border-green-700",
  medium: "text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-300 dark:bg-yellow-900/40 dark:border-yellow-700",
  high: "text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/40 dark:border-red-700",
};

const MAX_DESCRIPTION = 2000;
const MAX_LABELS = 5;
const MAX_LABEL_LENGTH = 20;

/**
 * Formats an ISO date string.
 * - Within 7 days: relative (e.g. "2 days ago", "just now").
 * - Older: "MMM DD, YYYY" (e.g. "Mar 18, 2026").
 */
function formatCreatedAt(isoString: string): string {
  const created = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(diffDays);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Labels section ───────────────────────────────────────────────────────────

interface LabelsSectionProps {
  labels: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}

function LabelsSection({ labels, onAdd, onRemove }: LabelsSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  };

  const tryAddLabel = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (labels.length >= MAX_LABELS) {
      showError(`Maximum of ${MAX_LABELS} labels per card.`);
      return;
    }

    // Case-insensitive duplicate check.
    const isDuplicate = labels.some((l) => l.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      showError("This label already exists on the card.");
      return;
    }

    onAdd(trimmed);
    setInputValue("");
    setError(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryAddLabel();
    }
  };

  const isAtLimit = labels.length >= MAX_LABELS;

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        Labels
        <span className="ml-1 font-normal normal-case">
          ({labels.length}/{MAX_LABELS})
        </span>
      </label>

      {/* Existing label chips */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Current labels">
          {labels.map((label) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getLabelColor(label)}`}
            >
              {label}
              <button
                type="button"
                onClick={() => onRemove(label)}
                aria-label={`Remove label "${label}"`}
                className="hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current rounded-full"
              >
                <X size={10} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add label input */}
      {!isAtLimit && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_LABEL_LENGTH}
            placeholder="Add a label..."
            aria-label="New label name — press Enter or click Add"
            aria-describedby={error ? "label-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            className={[
              "flex-1 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
              error
                ? "border-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-500",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={tryAddLabel}
            aria-label="Add label"
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {isAtLimit && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Maximum of {MAX_LABELS} labels reached.
        </p>
      )}

      {error && (
        <p
          id="label-error"
          role="alert"
          className="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── CardDetail ───────────────────────────────────────────────────────────────

/**
 * Card detail modal.
 *
 * All field changes auto-save immediately via UPDATE_CARD dispatch.
 * Closing the modal does not discard changes (they are already saved).
 * Delete action uses the shared ConfirmDialog component.
 *
 * IMPORTANT: ALL hooks must be declared unconditionally before any early
 * return — this prevents a Rules of Hooks violation that caused a blank
 * screen (BUG-4). The early-return guard has been moved below all hooks.
 */
export function CardDetail({ cardId, columnId, onClose }: CardDetailProps) {
  const { state, dispatch } = useBoardContext();
  const { addToast } = useToastContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const card = cardId ? state.cards[cardId] : null;
  const isOpen = card !== null && card !== undefined;

  // Local edit states — initialized from card on first render.
  const [titleValue, setTitleValue] = useState(card?.title ?? "");
  const [descValue, setDescValue] = useState(card?.description ?? "");

  // Note: local state (titleValue, descValue) does not need a sync effect here
  // because Board.tsx passes key={cardId} to CardDetail, which causes React to
  // fully remount this component when a different card is opened — initial state
  // is always derived from the card prop on first render (BUG-01 fix).

  // updateCard must be declared unconditionally (before the early return)
  // to comply with React's Rules of Hooks — previously placed after the guard,
  // which caused the blank-screen crash (BUG-4).
  const updateCard = useCallback(
    (updates: Partial<Card>) => {
      if (!cardId) return;
      dispatch({ type: "UPDATE_CARD", payload: { id: cardId, updates } });
    },
    [cardId, dispatch]
  );

  // Derive the card's current column directly from board state so the status
  // selector stays accurate after the user changes it (the columnId prop from
  // Board.tsx becomes stale once a MOVE_CARD is dispatched while the modal
  // remains open — TICKET-013).
  const currentColumn =
    state.board.columns.find((col) => col.cardIds.includes(cardId ?? "")) ?? null;
  const effectiveColumnId = currentColumn?.id ?? columnId;

  // Early return guard — must come AFTER all hook declarations.
  if (!card || !cardId || !effectiveColumnId) {
    return null;
  }

  const handleTitleBlur = () => {
    const trimmed = titleValue.trim();
    if (!trimmed) {
      setTitleValue(card.title);
      return;
    }
    if (trimmed !== card.title) {
      updateCard({ title: trimmed });
    }
  };

  const handleDescBlur = () => {
    if (descValue !== card.description) {
      updateCard({ description: descValue });
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Card["priority"];
    updateCard({ priority: value });
  };

  const handleAddLabel = (label: string) => {
    const updated = [...card.labels, label];
    updateCard({ labels: updated });
  };

  const handleRemoveLabel = (label: string) => {
    const updated = card.labels.filter((l) => l !== label);
    updateCard({ labels: updated });
  };

  const handleDeleteConfirm = () => {
    const cardTitle = card.title;
    // Use effectiveColumnId so the DELETE_CARD targets the correct column even
    // after the user has moved the card via the status selector (TICKET-013).
    dispatch({ type: "DELETE_CARD", payload: { id: cardId, columnId: effectiveColumnId } });
    setShowDeleteConfirm(false);
    onClose();
    addToast(`Card "${cardTitle}" deleted.`, "info");
  };

  const descRemaining = MAX_DESCRIPTION - descValue.length;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={card.title}>
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="card-title"
              className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5"
            >
              Title
            </label>
            <input
              id="card-title"
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              maxLength={100}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              aria-label="Card title"
            />
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="card-priority"
              className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5"
            >
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCard({ priority: opt.value })}
                  aria-pressed={card.priority === opt.value}
                  className={[
                    "flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    card.priority === opt.value
                      ? PRIORITY_COLOR[opt.value]
                      : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Hidden select for accessibility / form semantics */}
            <select
              id="card-priority"
              value={card.priority}
              onChange={handlePriorityChange}
              className="sr-only"
              aria-label="Card priority"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status (column) selector — TICKET-013 */}
          <div>
            <label
              htmlFor="card-status"
              className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5"
            >
              Status
            </label>
            <select
              id="card-status"
              value={effectiveColumnId}
              onChange={(e) => {
                const newColumnId = e.target.value;
                // Guard: no-op if same column or IDs are missing.
                if (!newColumnId || newColumnId === effectiveColumnId || !cardId) return;
                const sourceCol = state.board.columns.find((c) => c.id === effectiveColumnId);
                const destCol = state.board.columns.find((c) => c.id === newColumnId);
                if (!sourceCol || !destCol) return;
                dispatch({
                  type: "MOVE_CARD",
                  payload: {
                    cardId,
                    sourceColumnId: effectiveColumnId,
                    destinationColumnId: newColumnId,
                    sourceIndex: sourceCol.cardIds.indexOf(cardId),
                    // Append to bottom of the destination column.
                    destinationIndex: destCol.cardIds.length,
                  },
                });
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              aria-label="Card status (column)"
            >
              {state.board.columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <LabelsSection
            labels={card.labels}
            onAdd={handleAddLabel}
            onRemove={handleRemoveLabel}
          />

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="card-description"
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
              >
                Description
              </label>
              <span
                className={`text-xs ${descRemaining < 100 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}
                aria-live="polite"
                aria-label={`${descRemaining} characters remaining`}
              >
                {descRemaining} / {MAX_DESCRIPTION}
              </span>
            </div>
            <textarea
              id="card-description"
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescBlur}
              maxLength={MAX_DESCRIPTION}
              rows={5}
              placeholder="Add a description..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              aria-label="Card description"
            />
          </div>

          {/* Tasks */}
          <TaskSection cardId={cardId} />

          {/* Created date */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatCreatedAt(card.createdAt)}
            </p>
          </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-slate-600" />

          {/* Delete */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete this card"
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 w-full"
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete card
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete card?"
        message={`"${card.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}
