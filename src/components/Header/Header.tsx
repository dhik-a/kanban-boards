import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Sun, Moon, Search, X } from "lucide-react";
import { useBoardContext } from "../../context/BoardContext";
import { useThemeContext } from "../../context/ThemeContext";
import { useFilterContext } from "../../context/FilterContext";
import { getLabelColor } from "../../utils/labelColor";
import type { Card } from "../../types";

// ─── Board title (inline editable) ────────────────────────────────────────────

function BoardTitle() {
  const { state, dispatch } = useBoardContext();
  const { board } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
    }
  }, [isEditing]);

  // editValue is reset from board.title every time the user enters edit mode
  // via startEditing(), so no sync effect is needed. The read-mode button
  // renders board.title directly, which is always current (BUG-01 fix).

  const startEditing = () => {
    setEditValue(board.title);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== board.title) {
      dispatch({ type: "SET_BOARD_TITLE", payload: trimmed });
    } else if (!trimmed) {
      // Revert to existing title.
      setEditValue(board.title);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setEditValue(board.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      cancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        maxLength={100}
        aria-label="Board title — press Enter to confirm, Escape to cancel"
        className="text-xl font-bold bg-transparent border-b-2 border-blue-500 outline-none text-slate-800 dark:text-slate-100 min-w-0 max-w-xs"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      aria-label={`Board title: ${board.title}. Click to edit.`}
      className="text-xl font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded px-1 -mx-1 transition-colors"
    >
      {board.title}
    </button>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

// ─── Priority filter buttons ───────────────────────────────────────────────────

const PRIORITIES: Array<{ value: Card["priority"]; label: string; activeClass: string }> = [
  { value: "low", label: "Low", activeClass: "bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600" },
  { value: "medium", label: "Med", activeClass: "bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600" },
  { value: "high", label: "High", activeClass: "bg-red-100 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600" },
];

// ─── Header ───────────────────────────────────────────────────────────────────

/**
 * App header: board title (editable), search bar, priority filters,
 * label filter chips, theme toggle.
 *
 * Label chips are derived from all unique labels currently in use across
 * every card on the board (QA-1). Clicking a chip toggles the label filter;
 * clicking the active chip clears it.
 *
 * Search is debounced 200ms before updating FilterContext.
 */
export function Header() {
  const { state: boardState } = useBoardContext();
  const {
    searchQuery,
    priorityFilter,
    labelFilter,
    isFiltering,
    setSearchQuery,
    setPriorityFilter,
    setLabelFilter,
    clearFilters,
  } = useFilterContext();

  // Collect all unique labels across all cards, sorted alphabetically.
  const uniqueLabels = useMemo(() => {
    const seen = new Set<string>();
    Object.values(boardState.cards).forEach((card) => {
      card.labels.forEach((l) => seen.add(l));
    });
    return Array.from(seen).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [boardState.cards]);

  // Local input value for debounced search.
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending debounce timer on unmount to prevent stale setState
  // calls after the component is gone (CRIT-3).
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, 200);
    },
    [setSearchQuery]
  );

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  const handlePriorityClick = (priority: Card["priority"]) => {
    setPriorityFilter(priorityFilter === priority ? null : priority);
  };

  const handleLabelClick = (label: string) => {
    // Toggle: clicking the active label chip clears it (QA-1).
    setLabelFilter(labelFilter === label ? null : label);
  };

  // Clears all filters and resets the local search input in one action.
  // Keeping localSearch in sync here avoids needing a useEffect that calls
  // setState in response to searchQuery changes (BUG-01 fix).
  const handleClearAllFilters = () => {
    clearFilters();
    setLocalSearch("");
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Left: board title */}
        <div className="flex items-center gap-2 min-w-0">
          <BoardTitle />
        </div>

        {/* Right: search + filters + theme */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:ml-auto">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search cards..."
              aria-label="Search cards by title"
              className="pl-8 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 transition"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Priority filters */}
          <div className="flex items-center gap-1" role="group" aria-label="Filter by priority">
            {PRIORITIES.map(({ value, label, activeClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePriorityClick(value)}
                aria-pressed={priorityFilter === value}
                className={[
                  "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  priorityFilter === value
                    ? activeClass
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Label filter chips — derived from all labels in use across cards (QA-1).
              Only rendered when at least one label exists on any card. */}
          {uniqueLabels.length > 0 && (
            <div
              className="flex items-center gap-1 flex-wrap"
              role="group"
              aria-label="Filter by label"
            >
              {uniqueLabels.map((label) => {
                const isActive = labelFilter === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleLabelClick(label)}
                    aria-pressed={isActive}
                    title={label}
                    className={[
                      "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isActive
                        ? `${getLabelColor(label)} ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-slate-800`
                        : `${getLabelColor(label)} opacity-60 hover:opacity-100`,
                    ].join(" ")}
                  >
                    {label.substring(0, 20)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Clear all filters */}
          {isFiltering && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              aria-label="Clear all filters"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={12} aria-hidden="true" />
              Clear All
            </button>
          )}

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
