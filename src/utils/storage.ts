import type { AppState, Board, Card, Task } from "../types";

// localStorage keys — Phase 2 adds kanban_tasks and kanban_schema_version.
const BOARD_KEY = "kanban_board";
const CARDS_KEY = "kanban_cards";
const TASKS_KEY = "kanban_tasks";

/**
 * Reads AppState from localStorage.
 *
 * Returns null in two distinct cases:
 *   1. No data stored yet (first-time user) → caller initialises with defaults.
 *   2. Data exists but is corrupted → caller should show a warning.
 *
 * The second case is communicated via the `corrupted` flag so the caller can
 * decide to surface a dismissible warning to the user (Scenario 7).
 */
export type LoadResult =
  | { ok: true; state: AppState }
  | { ok: false; corrupted: boolean }; // corrupted=false means simply empty

export function loadState(): LoadResult {
  try {
    const rawBoard = localStorage.getItem(BOARD_KEY);
    const rawCards = localStorage.getItem(CARDS_KEY);
    const rawTasks = localStorage.getItem(TASKS_KEY);

    // Nothing stored yet — clean first-time load.
    if (rawBoard === null && rawCards === null) {
      return { ok: false, corrupted: false };
    }

    // If board or cards key is missing, treat as corrupted.
    if (rawBoard === null || rawCards === null) {
      return { ok: false, corrupted: true };
    }

    const board: Board = JSON.parse(rawBoard);
    const cards: Record<string, Card> = JSON.parse(rawCards);
    // tasks key may be absent in Phase 1 data — default to empty object.
    const tasks: Record<string, Task> = rawTasks ? JSON.parse(rawTasks) : {};

    // Minimal shape validation — catch obviously wrong data without a full schema check.
    if (
      typeof board !== "object" ||
      board === null ||
      typeof board.id !== "string" ||
      typeof board.title !== "string" ||
      !Array.isArray(board.columns) ||
      typeof cards !== "object" ||
      cards === null
    ) {
      return { ok: false, corrupted: true };
    }

    return { ok: true, state: { board, cards, tasks } };
  } catch {
    // JSON.parse threw — data is definitely corrupted.
    return { ok: false, corrupted: true };
  }
}

/**
 * Writes AppState to localStorage using two separate keys (PRD section 3.5).
 *
 * The two writes are made atomic via rollback: if the second setItem throws
 * (e.g. quota exceeded after the first write succeeds), the first write is
 * reverted so localStorage is never left in a logically inconsistent state.
 *
 * Returns an error message string on failure (storage full, private browsing
 * restrictions, etc.) or null on success. The caller is responsible for
 * surfacing the error to the user — we do not throw here.
 */
export function saveState(state: AppState): string | null {
  // Snapshot current values before writing so we can roll back on failure.
  const prevBoard = localStorage.getItem(BOARD_KEY);
  const prevCards = localStorage.getItem(CARDS_KEY);

  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(state.board));
  } catch {
    return "Unable to save changes: storage is full.";
  }

  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(state.cards));
  } catch {
    // Roll back the board write.
    try {
      if (prevBoard === null) {
        localStorage.removeItem(BOARD_KEY);
      } else {
        localStorage.setItem(BOARD_KEY, prevBoard);
      }
    } catch {
      // Rollback failed — nothing more we can do.
    }
    return "Unable to save changes: storage is full.";
  }

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks));
  } catch {
    // Roll back both board and cards writes.
    try {
      if (prevBoard === null) {
        localStorage.removeItem(BOARD_KEY);
      } else {
        localStorage.setItem(BOARD_KEY, prevBoard);
      }
    } catch { /* ignore */ }
    try {
      if (prevCards === null) {
        localStorage.removeItem(CARDS_KEY);
      } else {
        localStorage.setItem(CARDS_KEY, prevCards);
      }
    } catch { /* ignore */ }
    return "Unable to save changes: storage is full.";
  }

  return null;
}
