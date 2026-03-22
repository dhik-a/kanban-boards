import { Plus } from "lucide-react";
import { useBoardContext } from "../../context/BoardContext";

const MAX_COLUMNS = 10;

/**
 * "+ Add Column" button.
 *
 * - Dispatches ADD_COLUMN with the default title "New Column".
 * - Disabled and visually indicates the limit when 10 columns already exist.
 */
export function AddColumn() {
  const { state, dispatch } = useBoardContext();
  const columnCount = state.board.columns.length;
  const isAtLimit = columnCount >= MAX_COLUMNS;

  const handleClick = () => {
    if (isAtLimit) return;
    dispatch({ type: "ADD_COLUMN", payload: { title: "New Column" } });
  };

  return (
    <div className="w-full md:flex-shrink-0 md:w-72">
      <button
        type="button"
        onClick={handleClick}
        disabled={isAtLimit}
        aria-label={
          isAtLimit
            ? "Maximum of 10 columns reached. Cannot add more columns."
            : "Add a new column"
        }
        title={isAtLimit ? "Maximum of 10 columns reached" : "Add column"}
        className={[
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors",
          isAtLimit
            ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
            : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        ].join(" ")}
      >
        <Plus size={16} aria-hidden="true" />
        <span>Add Column</span>
        {isAtLimit && <span className="sr-only">(limit reached)</span>}
      </button>
      {isAtLimit && (
        <p
          className="mt-1 text-xs text-slate-400 dark:text-slate-600 text-center"
          role="status"
          aria-live="polite"
        >
          Maximum of 10 columns reached
        </p>
      )}
    </div>
  );
}
