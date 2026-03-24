import {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AppState, Action, Board } from "../types";
import { createDefaultState } from "../utils/defaults";
import { loadState, SCHEMA_VERSION_KEY, SCHEMA_VERSION } from "../utils/storage";
import { useDebouncedSave } from "../hooks/useDebouncedSave";

// ─── Initial state ────────────────────────────────────────────────────────────

/**
 * Resolves the initial AppState from localStorage.
 *
 * Schema version check (AC-1):
 *   - If kanban_schema_version is absent or < 2 → fresh install (AC-2).
 *     Phase 1 keys (kanban_board, kanban_cards) are intentionally not read.
 *   - If kanban_schema_version === 2 → load persisted state normally (AC-4).
 *
 * Returns the state AND a flag indicating whether data was corrupted on load
 * (used to show the dismissible warning banner — AC-5).
 */
function resolveInitialState(): { state: AppState; wasCorrupted: boolean } {
  const rawVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
  const schemaVersion = rawVersion !== null ? Number(rawVersion) : 0;

  // Fresh install path: version absent or below current schema version (AC-1, AC-2).
  // Phase 1 keys are not read — their presence is irrelevant (AC-6).
  if (schemaVersion < SCHEMA_VERSION) {
    return { state: createDefaultState(), wasCorrupted: false };
  }

  // Normal load path: schema version matches, attempt to restore persisted state (AC-4).
  const result = loadState();
  if (result.ok) {
    return { state: result.state, wasCorrupted: false };
  }

  // loadState failed — data is corrupted despite a valid schema version flag.
  // Fall back to defaults and surface a warning (AC-5).
  return {
    state: createDefaultState(),
    wasCorrupted: result.corrupted,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function boardReducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();

  // Helper: update board.updatedAt on every mutation.
  const withUpdatedAt = (board: Board): Board => ({ ...board, updatedAt: now });

  switch (action.type) {
    case "LOAD_STATE":
      return action.payload;

    // ── Board ────────────────────────────────────────────────────────────────
    case "SET_BOARD_TITLE":
      return {
        ...state,
        board: withUpdatedAt({ ...state.board, title: action.payload }),
      };

    // ── Columns ──────────────────────────────────────────────────────────────
    // Note: ADD_COLUMN, DELETE_COLUMN, REORDER_COLUMNS removed in Phase 2.
    // Columns are fixed and non-configurable. UPDATE_COLUMN retained for
    // internal use but the UI no longer surfaces column mutation controls.

    case "UPDATE_COLUMN": {
      const { id, title, color } = action.payload;
      const columns = state.board.columns.map((col) =>
        col.id === id
          ? {
              ...col,
              ...(title !== undefined ? { title } : {}),
              ...(color !== undefined ? { color } : {}),
            }
          : col
      );
      return {
        ...state,
        board: withUpdatedAt({ ...state.board, columns }),
      };
    }

    // ── Cards ────────────────────────────────────────────────────────────────
    case "ADD_CARD": {
      const { columnId, card } = action.payload;
      const columns = state.board.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, card.id] }
          : col
      );
      return {
        ...state,
        board: withUpdatedAt({ ...state.board, columns }),
        cards: { ...state.cards, [card.id]: card },
      };
    }

    case "UPDATE_CARD": {
      const { id, updates } = action.payload;
      const existing = state.cards[id];
      if (!existing) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          [id]: { ...existing, ...updates, updatedAt: now },
        },
        // Board.updatedAt also advances when card content changes.
        board: withUpdatedAt(state.board),
      };
    }

    case "DELETE_CARD": {
      const { id, columnId } = action.payload;
      const columns = state.board.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: col.cardIds.filter((cid) => cid !== id) }
          : col
      );
      const updatedCards = { ...state.cards };
      // Cascade-delete all tasks belonging to this card before removing it
      // so no orphaned entries remain in state.tasks (AC-4).
      const updatedTasks = { ...state.tasks };
      const cardBeingDeleted = state.cards[id];
      if (cardBeingDeleted) {
        for (const taskId of cardBeingDeleted.taskIds) {
          delete updatedTasks[taskId];
        }
      }
      delete updatedCards[id];
      return {
        ...state,
        board: withUpdatedAt({ ...state.board, columns }),
        cards: updatedCards,
        tasks: updatedTasks,
      };
    }

    case "MOVE_CARD": {
      const { cardId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex, newCardIds } =
        action.payload;

      const columns = state.board.columns.map((col) => {
        if (col.id === sourceColumnId && col.id === destinationColumnId) {
          // Same-column reorder. Use pre-computed order from arrayMove when
          // available (avoids the splice off-by-one when dragging downward).
          return {
            ...col,
            cardIds: newCardIds ?? (() => {
              const ids = [...col.cardIds];
              ids.splice(sourceIndex, 1);
              ids.splice(destinationIndex, 0, cardId);
              return ids;
            })(),
          };
        }
        if (col.id === sourceColumnId) {
          return {
            ...col,
            cardIds: col.cardIds.filter((id) => id !== cardId),
          };
        }
        if (col.id === destinationColumnId) {
          const ids = [...col.cardIds];
          ids.splice(destinationIndex, 0, cardId);
          return { ...col, cardIds: ids };
        }
        return col;
      });

      return {
        ...state,
        board: withUpdatedAt({ ...state.board, columns }),
      };
    }

    // ── Tasks (Phase 2) ──────────────────────────────────────────────────────
    case "ADD_TASK": {
      const { cardId, task } = action.payload;
      const existingCard = state.cards[cardId];
      if (!existingCard) return state;
      return {
        ...state,
        tasks: { ...state.tasks, [task.id]: task },
        cards: {
          ...state.cards,
          [cardId]: {
            ...existingCard,
            taskIds: [...existingCard.taskIds, task.id],
            updatedAt: now,
          },
        },
        board: withUpdatedAt(state.board),
      };
    }

    case "UPDATE_TASK": {
      const { id, cardId, updates } = action.payload;
      const existingTask = state.tasks[id];
      if (!existingTask) return state;
      const existingCard = state.cards[cardId];
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [id]: { ...existingTask, ...updates, updatedAt: now },
        },
        cards: existingCard
          ? {
              ...state.cards,
              [cardId]: { ...existingCard, updatedAt: now },
            }
          : state.cards,
        board: withUpdatedAt(state.board),
      };
    }

    case "DELETE_TASK": {
      const { taskId, cardId } = action.payload;
      // No-op if the task does not exist (AC-3).
      if (!state.tasks[taskId]) return state;
      const existingCard = state.cards[cardId];
      if (!existingCard) return state;
      const updatedTasks = { ...state.tasks };
      delete updatedTasks[taskId];
      return {
        ...state,
        tasks: updatedTasks,
        cards: {
          ...state.cards,
          [cardId]: {
            ...existingCard,
            taskIds: existingCard.taskIds.filter((id) => id !== taskId),
            updatedAt: now,
          },
        },
        board: withUpdatedAt(state.board),
      };
    }

    default: {
      // Exhaustiveness check — TypeScript will error here if a new Action
      // variant is added to the union without a corresponding case.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface BoardContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Non-null when the last localStorage write failed (Scenario 6). */
  saveError: string | null;
  /** Clears the save error banner. */
  dismissSaveError: () => void;
  /** Non-null when data was corrupted on load (Scenario 7). */
  corruptionWarning: string | null;
  /** Clears the corruption warning banner. */
  dismissCorruptionWarning: () => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BoardProvider({ children }: { children: ReactNode }) {
  // Resolve initial state once via useState's lazy initializer — this avoids
  // reading a ref during render (BUG-01) while ensuring localStorage is never
  // read at module scope (safe for tests and SSR environments).
  const [{ initialState, wasCorrupted }] = useState(() => {
    const { state, wasCorrupted } = resolveInitialState();
    return { initialState: state, wasCorrupted };
  });

  // Initialise reducer with the already-resolved state object. The third-arg
  // lazy form is not needed here because we already have the value in hand.
  const [state, dispatch] = useReducer(boardReducer, initialState);

  // ── Error / warning banner state ──────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null);
  const [corruptionWarning, setCorruptionWarning] = useState<string | null>(
    wasCorrupted ? "Your saved board data was corrupted. Starting fresh." : null
  );

  const handleSaveResult = useCallback((error: string | null) => {
    setSaveError(error);
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(null), []);
  const dismissCorruptionWarning = useCallback(() => setCorruptionWarning(null), []);

  // ── Debounced persistence ─────────────────────────────────────────────────
  useDebouncedSave(state, handleSaveResult);

  return (
    <BoardContext.Provider
      value={{
        state,
        dispatch,
        saveError,
        dismissSaveError,
        corruptionWarning,
        dismissCorruptionWarning,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useBoardContext(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (ctx === null) {
    throw new Error("useBoardContext must be used inside <BoardProvider>");
  }
  return ctx;
}
