// ─── Core data model types — mirrored from PRD phase 2 section 4 ──────────────

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[]; // ordered list of card IDs
  color: string;     // hex color for column header accent
  isFixed: boolean;  // Phase 2: all columns are fixed and non-configurable
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  taskIds: string[]; // Phase 2: ordered list of task IDs (by createdAt ascending)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ─── Task types (Phase 2) ──────────────────────────────────────────────────────

/**
 * Five task statuses that mirror the five fixed board columns.
 * Status is independent of the parent Card's column position.
 */
export type TaskStatus = "todo" | "in_progress" | "done" | "dropped" | "blocked";

export interface Task {
  id: string;
  title: string;        // required, max 200 characters
  description: string;  // optional (empty string default), max 1000 characters
  status: TaskStatus;   // defaults to "todo" on creation
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// Normalized state: board structure lives separately from card and task content
// so that lookups are O(1) and moves don't require touching every entity.
export interface AppState {
  board: Board;
  cards: Record<string, Card>;
  tasks: Record<string, Task>; // Phase 2: normalized task storage by ID
}

// ─── Reducer action union — Phase 2 ──────────────────────────────────────────

export type Action =
  // Board
  | { type: "SET_BOARD_TITLE"; payload: string }
  // Columns — ADD_COLUMN, DELETE_COLUMN, REORDER_COLUMNS removed in Phase 2
  // (columns are fixed and non-configurable)
  | { type: "UPDATE_COLUMN"; payload: { id: string; title?: string; color?: string } }
  // Cards
  | { type: "ADD_CARD"; payload: { columnId: string; card: Card } }
  | { type: "UPDATE_CARD"; payload: { id: string; updates: Partial<Card> } }
  | { type: "DELETE_CARD"; payload: { id: string; columnId: string } }
  | {
      type: "MOVE_CARD";
      payload: {
        cardId: string;
        sourceColumnId: string;
        destinationColumnId: string;
        sourceIndex: number;
        destinationIndex: number;
        /** Pre-computed card order for same-column reorders (avoids splice off-by-one). */
        newCardIds?: string[];
      };
    }
  // Tasks (Phase 2)
  | { type: "ADD_TASK"; payload: { cardId: string; task: Task } }
  | {
      type: "UPDATE_TASK";
      payload: {
        id: string;
        cardId: string;
        updates: Partial<Omit<Task, "id" | "createdAt">>;
      };
    }
  | { type: "DELETE_TASK"; payload: { taskId: string; cardId: string } }
  // Persistence
  | { type: "LOAD_STATE"; payload: AppState };
