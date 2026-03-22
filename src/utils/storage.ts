import type { AppState, Board, Card } from "../types";

// PRD section 3.5 — two distinct localStorage keys for board and cards.
const BOARD_KEY = "kanban_board";
const CARDS_KEY = "kanban_cards";

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

    // Nothing stored yet — clean first-time load.
    if (rawBoard === null && rawCards === null) {
      return { ok: false, corrupted: false };
    }

    // If one key exists but not the other, treat as corrupted.
    if (rawBoard === null || rawCards === null) {
      return { ok: false, corrupted: true };
    }

    const board: Board = JSON.parse(rawBoard);
    const cards: Record<string, Card> = JSON.parse(rawCards);

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

    return { ok: true, state: { board, cards } };
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
  // Snapshot the current board value before writing so we can roll it back if
  // the subsequent cards write fails. prevCards is not needed — if the board
  // write fails first, localStorage is still consistent.
  const prevBoard = localStorage.getItem(BOARD_KEY);

  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(state.board));
  } catch {
    return "Unable to save changes: storage is full.";
  }

  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(state.cards));
  } catch {
    // Roll back the board write so both keys stay in sync.
    try {
      if (prevBoard === null) {
        localStorage.removeItem(BOARD_KEY);
      } else {
        localStorage.setItem(BOARD_KEY, prevBoard);
      }
    } catch {
      // If the rollback itself fails there is nothing more we can do.
    }
    return "Unable to save changes: storage is full.";
  }

  return null;
}
