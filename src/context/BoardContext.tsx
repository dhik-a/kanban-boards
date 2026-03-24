import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { AppState, Action, Board, Column } from "../types";
import { createDefaultState } from "../utils/defaults";
import { loadState } from "../utils/storage";
import { useDebouncedSave } from "../hooks/useDebouncedSave";

// ─── Initial state ────────────────────────────────────────────────────────────

/**
 * Resolves the initial AppState from localStorage.
 * Returns the state AND a flag indicating whether data was corrupted on load
 * (used to show the dismissible warning banner — Ticket Scenario 7).
 */
function resolveInitialState(): { state: AppState; wasCorrupted: boolean } {
  const result = loadState();
  if (result.ok) {
    return { state: result.state, wasCorrupted: false };
  }
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
    case "ADD_COLUMN": {
      // Mirror the UI-level 10-column cap inside the reducer so the constraint
      // is enforced regardless of how the action is dispatched (CRITICAL #4).
      if (state.board.columns.length >= 10) return state;
      const newColumn: Column = {
        id: uuidv4(),
        title: action.payload.title,
        cardIds: [],
        color: "#94a3b8", // default slate — user can change via UPDATE_COLUMN
      };
      return {
        ...state,
        board: withUpdatedAt({
          ...state.board,
          columns: [...state.board.columns, newColumn],
        }),
        cards: state.cards,
        projects: state.projects,
      };
    }

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

    case "DELETE_COLUMN": {
      const { id } = action.payload;
      // Enforce minimum 1 column constraint (PRD section 4.2).
      if (state.board.columns.length <= 1) return state;

      const targetColumn = state.board.columns.find((col) => col.id === id);
      if (!targetColumn) return state;

      // Remove all cards belonging to the deleted column from normalized storage.
      const updatedCards = { ...state.cards };
      for (const cardId of targetColumn.cardIds) {
        delete updatedCards[cardId];
      }

      return {
        board: withUpdatedAt({
          ...state.board,
          columns: state.board.columns.filter((col) => col.id !== id),
        }),
        cards: updatedCards,
        projects: state.projects,
      };
    }

    case "REORDER_COLUMNS": {
      const { sourceIndex, destinationIndex } = action.payload;
      const columns = [...state.board.columns];
      const [moved] = columns.splice(sourceIndex, 1);
      columns.splice(destinationIndex, 0, moved);
      return {
        ...state,
        board: withUpdatedAt({ ...state.board, columns }),
        cards: state.cards,
        projects: state.projects,
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
        board: withUpdatedAt({ ...state.board, columns }),
        cards: { ...state.cards, [card.id]: card },
        projects: state.projects,
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
      delete updatedCards[id];
      return {
        board: withUpdatedAt({ ...state.board, columns }),
        cards: updatedCards,
        projects: state.projects,
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

    // ── Projects ─────────────────────────────────────────────────────────────
    case "ADD_PROJECT":
      return {
        ...state,
        board: withUpdatedAt(state.board),
        projects: { ...state.projects, [action.payload.id]: action.payload },
      };

    case "DELETE_PROJECT": {
      const { id } = action.payload;
      const updatedCards = Object.fromEntries(
        Object.entries(state.cards).map(([cid, card]) => [
          cid,
          card.projectId === id ? { ...card, projectId: null } : card,
        ])
      );
      const remainingProjects = Object.fromEntries(
        Object.entries(state.projects).filter(([projectId]) => projectId !== id)
      );
      return {
        ...state,
        board: withUpdatedAt(state.board),
        projects: remainingProjects,
        cards: updatedCards,
      };
    }

    default: {
      // Exhaustiveness check — TypeScript will error here if a new Action
      // variant is added to the union without a corresponding case (MAJOR #7).
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
  // resolveInitialState() reads localStorage — it must NOT run at module scope
  // because that breaks tests (no DOM) and SSR environments. We guard it with
  // a ref so it executes exactly once on first render (CRITICAL #1).
  const initRef = useRef<ReturnType<typeof resolveInitialState> | null>(null);
  if (!initRef.current) {
    initRef.current = resolveInitialState();
  }
  const { state: initialState, wasCorrupted } = initRef.current;

  const [state, dispatch] = useReducer(boardReducer, initialState);

  // ── Error / warning banner state ──────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null);
  const [corruptionWarning, setCorruptionWarning] = useState<string | null>(
    wasCorrupted
      ? "Saved data could not be loaded and has been reset to the default board."
      : null
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

export function useBoardContext(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (ctx === null) {
    throw new Error("useBoardContext must be used inside <BoardProvider>");
  }
  return ctx;
}
