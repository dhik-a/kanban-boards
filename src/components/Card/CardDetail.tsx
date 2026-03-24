import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Trash2, Plus, X, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Modal } from "../UI/Modal";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { useBoardContext } from "../../context/BoardContext";
import { useToastContext } from "../../context/ToastContext";
import { getLabelColor } from "../../utils/labelColor";
import type { Card } from "../../types";

type DraftCard = Pick<Card, "title" | "description" | "priority" | "labels"> & {
  projectId: string | null;
};

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
 * Compare two label arrays for equality (order-insensitive).
 */
function labelsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted = (arr: string[]) => [...arr].sort();
  return sorted(a).every((v, i) => v === sorted(b)[i]);
}

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

  // Clean up pending error timer on unmount to prevent stale setState.
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

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

// ─── Project section ──────────────────────────────────────────────────────

interface ProjectSectionProps {
  projectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => void;
}

function ProjectSection({ projectId, onSelectProject, onAddProject }: ProjectSectionProps) {
  const { state } = useBoardContext();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when add-project form opens (including re-opens after cancel).
  useEffect(() => {
    if (isAddingProject) {
      inputRef.current?.focus();
    }
  }, [isAddingProject]);

  // Clean up pending error timer on unmount to prevent stale setState.
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  };

  const tryAddProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      showError("Project name is required.");
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicate = Object.values(state.projects).some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      showError("A project with this name already exists.");
      return;
    }

    onAddProject(trimmed);
    setNewProjectName("");
    setError(null);
    setIsAddingProject(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryAddProject();
    } else if (e.key === "Escape") {
      setIsAddingProject(false);
      setNewProjectName("");
      setError(null);
    }
  };

  const sortedProjects = useMemo(() => {
    return Object.values(state.projects).sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }, [state.projects]);

  return (
    <div>
      <label
        htmlFor="card-project"
        className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5"
      >
        Project
      </label>
      <div className="flex gap-2 items-start">
        <select
          id="card-project"
          value={projectId ?? ""}
          onChange={(e) => onSelectProject(e.target.value ? e.target.value : null)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          aria-label="Select project for this card"
        >
          <option value="">No project</option>
          {sortedProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {!isAddingProject && (
          <button
            type="button"
            onClick={() => setIsAddingProject(true)}
            aria-label="Add new project"
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors flex-shrink-0"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {isAddingProject && (
        <div className="flex gap-2 mt-2">
          <input
            ref={inputRef}
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            placeholder="Project name..."
            aria-label="New project name — press Enter or click Add"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "project-error" : undefined}
            className={[
              "flex-1 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
              error
                ? "border-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-500",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={tryAddProject}
            aria-label="Add project"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors text-sm font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingProject(false);
              setNewProjectName("");
              setError(null);
            }}
            aria-label="Cancel adding project"
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p
          id="project-error"
          role="alert"
          className="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── CardDetail ───────────────────────────────────────────────────────────

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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const card = cardId ? state.cards[cardId] : null;
  const isOpen = card !== null && card !== undefined;

  // Draft state — buffered edits not yet saved.
  const [draft, setDraft] = useState<DraftCard>(() => ({
    title: card?.title ?? "",
    description: card?.description ?? "",
    priority: card?.priority ?? "medium",
    labels: card?.labels ?? [],
    projectId: card?.projectId ?? null,
  }));

  // Reinitialize draft whenever the target card changes (e.g., user selects different card).
  // Same pattern as original code's titleValue/descValue initialization (see BUG-4 comment below).
  // Disabling the linter rule because this intentional state sync on card change is required.
  // eslint-disable-next-line no-console, react-hooks/exhaustive-deps
  useEffect(() => {
    if (card) {
      setDraft({
        title: card.title,
        description: card.description,
        priority: card.priority,
        labels: card.labels,
        projectId: card.projectId ?? null,
      });
      setTitleError(null);
      // Reset dialog states when card changes or modal closes.
      setShowCloseConfirm(false);
      setShowDiscardConfirm(false);
    }
  }, [cardId]); // intentionally only [cardId]; card is derived from cardId

  // Dirty tracking: card is dirty if any buffered field differs from saved card.
  const isDirty =
    draft.title.trim() !== card?.title ||
    draft.description !== card?.description ||
    draft.priority !== card?.priority ||
    draft.projectId !== (card?.projectId ?? null) ||
    !labelsEqual(draft.labels, card?.labels ?? []);

  // Submit handler: validate and dispatch UPDATE_CARD with all buffered fields.
  const handleSubmit = useCallback(() => {
    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) {
      setTitleError("Title is required");
      titleInputRef.current?.focus();
      return;
    }

    if (!cardId) return;

    dispatch({
      type: "UPDATE_CARD",
      payload: {
        id: cardId,
        updates: {
          title: trimmedTitle,
          description: draft.description,
          priority: draft.priority,
          labels: draft.labels,
          projectId: draft.projectId,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    setTitleError(null);
    addToast("Card saved.", "success");
    onClose();
  }, [draft, cardId, dispatch, addToast, onClose]);

  // Discard handler: reset draft to current card state, with confirmation if dirty.
  const handleDiscard = useCallback(() => {
    if (!isDirty) {
      // No changes; just reset (no-op in practice).
      if (card) {
        setDraft({
          title: card.title,
          description: card.description,
          priority: card.priority,
          labels: card.labels,
          projectId: card.projectId ?? null,
        });
      }
      return;
    }
    // Show confirmation before discarding.
    setShowDiscardConfirm(true);
  }, [isDirty, card]);

  // Confirm discard: reset draft, close dialog, and close modal.
  const handleConfirmDiscard = useCallback(() => {
    if (card) {
      setDraft({
        title: card.title,
        description: card.description,
        priority: card.priority,
        labels: card.labels,
        projectId: card.projectId ?? null,
      });
    }
    setShowDiscardConfirm(false);
    setTitleError(null);
    onClose();
  }, [card, onClose]);

  // Wrapped onClose: check for dirty state before closing.
  const handleModalClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

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

  // Field handlers update draft only (no immediate save).
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, title: e.target.value }));
    setTitleError(null);
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, description: e.target.value }));
  };

  const handlePriorityChange = (priority: Card["priority"]) => {
    setDraft((d) => ({ ...d, priority }));
  };

  const handleAddLabel = (label: string) => {
    setDraft((d) => ({ ...d, labels: [...d.labels, label] }));
  };

  const handleRemoveLabel = (label: string) => {
    setDraft((d) => ({ ...d, labels: d.labels.filter((l) => l !== label) }));
  };

  const handleSelectProject = (projectId: string | null) => {
    setDraft((d) => ({ ...d, projectId }));
  };

  const handleAddProject = (name: string) => {
    const newProject = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_PROJECT", payload: newProject });
    // Auto-assign the new project to the current card so the user doesn't
    // have to manually re-select after creating it.
    setDraft((d) => ({ ...d, projectId: newProject.id }));
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

  const descRemaining = MAX_DESCRIPTION - draft.description.length;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleModalClose} title={card.title}>
        <div className="space-y-5">
          {/* Title with unsaved indicator */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="card-title"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
              >
                Title
              </label>
              {isDirty && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle size={14} aria-hidden="true" />
                  Unsaved changes
                </span>
              )}
            </div>
            <input
              ref={titleInputRef}
              id="card-title"
              type="text"
              value={draft.title}
              onChange={handleTitleChange}
              maxLength={100}
              className={[
                "w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition",
                titleError
                  ? "border-red-400 dark:border-red-500"
                  : "border-slate-300 dark:border-slate-500",
              ].join(" ")}
              aria-label="Card title"
              aria-invalid={titleError ? "true" : undefined}
              aria-describedby={titleError ? "title-error" : undefined}
            />
            {titleError && (
              <p
                id="title-error"
                role="alert"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
              >
                {titleError}
              </p>
            )}
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
                  onClick={() => handlePriorityChange(opt.value)}
                  aria-pressed={draft.priority === opt.value}
                  className={[
                    "flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    draft.priority === opt.value
                      ? PRIORITY_COLOR[opt.value]
                      : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <ProjectSection
            projectId={draft.projectId}
            onSelectProject={handleSelectProject}
            onAddProject={handleAddProject}
          />

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
            labels={draft.labels}
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
              value={draft.description}
              onChange={handleDescChange}
              maxLength={MAX_DESCRIPTION}
              rows={5}
              placeholder="Add a description..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              aria-label="Card description"
            />
          </div>

          {/* Created date */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatCreatedAt(card.createdAt)}
            </p>
          </div>

          {/* Save and Discard buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isDirty}
              className={[
                "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                isDirty
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed",
              ].join(" ")}
              aria-label={isDirty ? "Save changes" : "No unsaved changes"}
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
            >
              Discard
            </button>
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

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard unsaved changes?"
        message="Your edits will be lost and cannot be recovered."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Close with unsaved changes?"
        message="You have unsaved changes. They will be lost if you close without saving."
        confirmLabel="Close without saving"
        cancelLabel="Cancel"
        onConfirm={onClose}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}
