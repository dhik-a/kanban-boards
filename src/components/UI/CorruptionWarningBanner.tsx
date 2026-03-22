import { X, AlertTriangle } from "lucide-react";
import { useBoardContext } from "../../context/BoardContext";

/**
 * Inline warning banner for corrupted-data recovery (Ticket Scenario 7).
 */
export function CorruptionWarningBanner() {
  const { corruptionWarning, dismissCorruptionWarning } = useBoardContext();
  if (!corruptionWarning) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-4 py-3 text-sm"
    >
      <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">{corruptionWarning}</span>
      <button
        type="button"
        onClick={dismissCorruptionWarning}
        aria-label="Dismiss warning"
        className="rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <X size={14} />
      </button>
    </div>
  );
}
