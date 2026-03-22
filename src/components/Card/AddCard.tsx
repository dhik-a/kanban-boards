import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { useToastContext } from "../../context/ToastContext";

interface AddCardProps {
  onAddCard: (title: string) => void;
}

/**
 * Quick-add card input at the bottom of a column.
 *
 * Lifecycle:
 * - "+" button click → input appears and receives focus.
 * - Enter with non-empty title → card created, input stays open (batch entry).
 * - Escape → input dismissed with no card created.
 * - Blur with non-empty title → card created, input dismissed.
 * - Blur with empty title → input dismissed, no card created.
 */
export function AddCard({ onAddCard }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToastContext();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Cancel any pending error-hide timer on unmount to prevent stale setState
  // after the component is gone (CRIT-4).
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const open = () => {
    setTitle("");
    setIsOpen(true);
  };

  const close = () => {
    setTitle("");
    setShowError(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setIsOpen(false);
  };

  const showValidationError = () => {
    setShowError(true);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setShowError(false), 2000);
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      showValidationError();
      return;
    }
    setShowError(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    onAddCard(trimmed);
    addToast(`Card "${trimmed}" created.`, "success");
    setTitle(""); // keep open for batch entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      close();
    }
  };

  const handleBlur = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onAddCard(trimmed);
      addToast(`Card "${trimmed}" created.`, "success");
    }
    close();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Add a card"
      >
        <Plus size={16} aria-hidden="true" />
        <span>Add a card</span>
      </button>
    );
  }

  return (
    <div className="mt-1">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (showError && e.target.value.trim()) setShowError(false);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        maxLength={100}
        placeholder="Enter card title..."
        aria-label="New card title"
        aria-describedby={showError ? "add-card-error" : undefined}
        aria-invalid={showError ? "true" : undefined}
        className={[
          "w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-600 dark:text-slate-200 shadow-sm outline-none focus:ring-2 placeholder:text-slate-400 dark:placeholder:text-slate-500",
          showError
            ? "border-red-400 focus:ring-red-400"
            : "border-blue-400 focus:ring-blue-400",
        ].join(" ")}
      />
      {showError ? (
        <p
          id="add-card-error"
          role="alert"
          className="mt-1 text-xs text-red-500 dark:text-red-400 px-1"
        >
          Card title cannot be empty.
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 px-1">
          Press Enter to add, Escape to cancel
        </p>
      )}
    </div>
  );
}
