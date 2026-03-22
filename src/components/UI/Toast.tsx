import { CheckCircle, Info, AlertCircle, X } from "lucide-react";
import { useToastContext, type Toast, type ToastType } from "../../context/ToastContext";

// ─── Individual toast item ─────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200",
  info: "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200",
  error: "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200",
};

const TOAST_ICON_STYLES: Record<ToastType, string> = {
  success: "text-green-600 dark:text-green-400",
  info: "text-blue-600 dark:text-blue-400",
  error: "text-red-600 dark:text-red-400",
};

function ToastIcon({ type }: { type: ToastType }) {
  const className = `shrink-0 ${TOAST_ICON_STYLES[type]}`;
  if (type === "success") return <CheckCircle size={16} className={className} aria-hidden="true" />;
  if (type === "error") return <AlertCircle size={16} className={className} aria-hidden="true" />;
  return <Info size={16} className={className} aria-hidden="true" />;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => onDismiss(toast.id)}
      className={[
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm cursor-pointer",
        "transition-all duration-200",
        TOAST_STYLES[toast.type],
      ].join(" ")}
    >
      <ToastIcon type={toast.type} />
      <span className="flex-1 min-w-0">{toast.message}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

/**
 * Renders the active toast stack in the bottom-right corner.
 * Newest toasts appear on top (first in array, visually at top of stack).
 * Each toast is manually dismissible; they auto-dismiss via ToastContext.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
