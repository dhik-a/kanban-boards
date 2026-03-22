import { useState, useRef, useEffect, useCallback } from "react";
import { MoreHorizontal, Trash2, Palette, GripVertical } from "lucide-react";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { useBoardContext } from "../../context/BoardContext";
import { useToastContext } from "../../context/ToastContext";
import type { Column } from "../../types";

// ─── Color palette for column accent (TICKET-010) ─────────────────────────────

const ACCENT_COLORS = [
  { hex: "#94a3b8", label: "Slate" },
  { hex: "#60a5fa", label: "Blue" },
  { hex: "#4ade80", label: "Green" },
  { hex: "#f87171", label: "Red" },
  { hex: "#fb923c", label: "Orange" },
  { hex: "#facc15", label: "Yellow" },
  { hex: "#a78bfa", label: "Violet" },
  { hex: "#f472b6", label: "Pink" },
] as const;

// ─── Color picker ──────────────────────────────────────────────────────────────

interface ColorPickerProps {
  currentColor: string;
  onSelect: (hex: string) => void;
}

function ColorPicker({ currentColor, onSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2">
      {ACCENT_COLORS.map(({ hex, label }) => (
        <button
          key={hex}
          type="button"
          onClick={() => onSelect(hex)}
          aria-label={`Set column color to ${label}`}
          aria-pressed={currentColor === hex}
          title={label}
          className={[
            "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            currentColor === hex ? "border-slate-700 dark:border-slate-200 scale-110" : "border-transparent",
          ].join(" ")}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

// ─── ColumnHeader ─────────────────────────────────────────────────────────────

interface ColumnHeaderProps {
  column: Column;
  canDelete: boolean;
  /** DnD drag handle attributes/listeners passed down from Column (TICKET-010). */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * Column header: drag handle, color accent bar, editable title, card count badge,
 * column menu (delete + color picker).
 *
 * Inline title editing:
 * - Click title or press Enter/Space → input appears with current title pre-filled.
 * - Enter or blur → save if non-empty, revert if empty.
 * - Escape → revert to previous title.
 * - Max 50 characters enforced at input level.
 *
 * Delete column:
 * - Triggers ConfirmDialog with card count context.
 * - Disabled (visually and functionally) when only 1 column remains.
 */
export function ColumnHeader({ column, canDelete, dragHandleProps }: ColumnHeaderProps) {
  const { dispatch } = useBoardContext();
  const { addToast } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // Focus input when editing starts.
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
    }
  }, [isEditing]);

  // When the menu opens, move focus to the first menu item (QA-4).
  useEffect(() => {
    if (!showMenu) return;
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
    firstItem?.focus();
  }, [showMenu]);

  // Close menu on outside click.
  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu]);

  // Close menu and return focus to trigger on Escape (QA-4).
  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setShowColorPicker(false);
    requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }, []);

  // Arrow-key navigation and Escape within the menu (QA-4).
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!showMenu) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      closeMenu();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
      );
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      let nextIndex: number;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      }
      items[nextIndex].focus();
    }
  };

  const startEditing = () => {
    setEditValue(column.title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== column.title) {
      dispatch({
        type: "UPDATE_COLUMN",
        payload: { id: column.id, title: trimmed },
      });
    } else if (!trimmed) {
      setEditValue(column.title);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(column.title);
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Keyboard: Enter/Space on the title button starts editing.
  const handleTitleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing();
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowColorPicker(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    const columnTitle = column.title;
    dispatch({ type: "DELETE_COLUMN", payload: { id: column.id } });
    setShowDeleteConfirm(false);
    addToast(`Column "${columnTitle}" deleted.`, "info");
  };

  const handleColorSelect = (hex: string) => {
    dispatch({ type: "UPDATE_COLUMN", payload: { id: column.id, color: hex } });
    setShowMenu(false);
    setShowColorPicker(false);
  };

  const cardCount = column.cardIds.length;
  const deleteMessage =
    cardCount === 0
      ? `Delete column "${column.title}"? This column has no cards.`
      : `Delete column "${column.title}"? This will permanently remove ${cardCount} card${cardCount !== 1 ? "s" : ""}.`;

  return (
    <>
      <div className="mb-2">
        {/* Color accent bar */}
        <div
          className="h-1 rounded-full mb-2"
          style={{ backgroundColor: column.color }}
          aria-hidden="true"
        />

        {/* Header row: drag handle + title + badge + menu */}
        <div className="flex items-center gap-1">
          {/* Drag handle for column reordering (TICKET-010) */}
          {dragHandleProps && (
            <button
              type="button"
              aria-label={`Drag to reorder column "${column.title}"`}
              className="shrink-0 p-0.5 rounded text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
              {...dragHandleProps}
            >
              <GripVertical size={14} aria-hidden="true" />
            </button>
          )}

          {/* Inline editable title */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={commitEdit}
              maxLength={50}
              aria-label={`Edit column title, currently "${column.title}"`}
              className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-600 border border-blue-400 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              onKeyDown={handleTitleButtonKeyDown}
              aria-label={`Column title: ${column.title}. Press Enter or Space to edit.`}
              className="flex-1 min-w-0 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mx-1 py-0.5 transition-colors"
            >
              {column.title}
            </button>
          )}

          {/* Card count badge */}
          <span
            aria-label={`${cardCount} card${cardCount !== 1 ? "s" : ""}`}
            className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full"
          >
            {cardCount}
          </span>

          {/* Column menu (3-dot) */}
          <div className="relative shrink-0" ref={menuRef} onKeyDown={handleMenuKeyDown}>
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              onKeyDown={(e) => {
                // Enter and Space open the menu via onClick, but we also need
                // to ensure they do not bubble and accidentally trigger other
                // handlers (QA-4).
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowMenu((prev) => !prev);
                }
              }}
              aria-label="Column options"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>

            {showMenu && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 py-1 z-10"
              >
                {/* Color picker toggle */}
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                >
                  <Palette size={14} aria-hidden="true" />
                  Accent color
                </button>

                {showColorPicker && (
                  <ColorPicker
                    currentColor={column.color}
                    onSelect={handleColorSelect}
                  />
                )}

                <hr className="my-1 border-slate-200 dark:border-slate-600" />

                <button
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  onClick={handleDeleteClick}
                  disabled={!canDelete}
                  aria-disabled={!canDelete}
                  className={[
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                    canDelete
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
                      : "text-slate-400 dark:text-slate-600 cursor-not-allowed",
                  ].join(" ")}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete column?"
        message={deleteMessage}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}
