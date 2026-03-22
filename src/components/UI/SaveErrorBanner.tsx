import { X, AlertCircle } from "lucide-react";
import { useBoardContext } from "../../context/BoardContext";

/**
 * Inline error banner for storage write failures (Ticket Scenario 6).
 * Deliberately not a toast — the ticket explicitly requires an inline banner.
 */
export function SaveErrorBanner() {
  const { saveError, dismissSaveError } = useBoardContext();
  if (!saveError) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 text-sm"
    >
      <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">
        <strong>Changes could not be saved.</strong> {saveError}
      </span>
      <button
        type="button"
        onClick={dismissSaveError}
        aria-label="Dismiss save error"
        className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        <X size={14} />
      </button>
    </div>
  );
}
