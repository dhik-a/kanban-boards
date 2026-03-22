import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { lockScroll, unlockScroll } from "../../utils/scrollLock";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Visual variant for the confirm button. Defaults to "danger". */
  variant?: "danger" | "default";
}

/**
 * Shared confirmation dialog for all destructive actions (U-005).
 * Used for card deletion (TICKET-003) and column deletion (TICKET-005).
 *
 * - Escape key cancels (stops propagation to prevent closing the parent Modal).
 * - Default focus is on the Cancel button (safer default for destructive actions — TICKET-012).
 * - Backdrop click cancels.
 * - Dark mode supported.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep a stable ref to onCancel so the keydown effect does not need to
  // re-attach its listener every time the parent re-renders and passes a new
  // onCancel function reference (CRIT-5).
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // Escape to cancel.
  // stopPropagation in capture phase prevents the event from reaching Modal's
  // own Escape handler, keeping the parent Modal open.
  // The effect only depends on isOpen — onCancel is accessed via ref (CRIT-5).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancelRef.current();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  // Default focus: Cancel button (TICKET-012 — safer for destructive actions).
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Prevent body scroll while open.
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      return () => unlockScroll();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 dark:bg-red-700 dark:hover:bg-red-600"
      : "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600";

  // Focus trap: keep Tab/Shift+Tab cycling within the dialog's focusable
  // elements so keyboard users cannot escape to the page behind (QA-3).
  const handleTabKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop — clicking it cancels the dialog but must not propagate to Modal */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative z-10 bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6"
        onKeyDown={handleTabKey}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-800 dark:text-slate-100"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-message"
              className="mt-1 text-sm text-slate-600 dark:text-slate-300"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 transition-colors ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
