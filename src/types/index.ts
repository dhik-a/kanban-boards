// ─── Core data model types — mirrored from PRD section 3 ─────────────────────

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
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  projectId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Project {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
}

// Normalized state: board structure lives separately from card content so that
// card lookups are O(1) and column reordering/moves don't require touching every card.
export interface AppState {
  board: Board;
  cards: Record<string, Card>;
  projects: Record<string, Project>;
}

// ─── Reducer action union — PRD section 6.1 ──────────────────────────────────

export type Action =
  // Board
  | { type: "SET_BOARD_TITLE"; payload: string }
  // Columns
  | { type: "ADD_COLUMN"; payload: { title: string } }
  | { type: "UPDATE_COLUMN"; payload: { id: string; title?: string; color?: string } }
  | { type: "DELETE_COLUMN"; payload: { id: string } }
  | { type: "REORDER_COLUMNS"; payload: { sourceIndex: number; destinationIndex: number } }
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
  // Projects
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: { id: string } }
  // Persistence
  | { type: "LOAD_STATE"; payload: AppState };
