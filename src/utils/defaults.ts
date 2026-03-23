import { v4 as uuidv4 } from "uuid";
import type { AppState, Board, Column } from "../types";

/**
 * Phase 2 fixed column definitions.
 * Colors and titles are semantically assigned per PRD section 3.1 and cannot
 * be changed by the user. isFixed: true signals immutability in the UI.
 */
const FIXED_COLUMN_DEFINITIONS: Array<Omit<Column, "id" | "cardIds">> = [
  { title: "To Do",       color: "#94a3b8", isFixed: true }, // slate-400
  { title: "In Progress", color: "#3b82f6", isFixed: true }, // blue-500
  { title: "Done",        color: "#22c55e", isFixed: true }, // green-500
  { title: "Dropped",     color: "#ef4444", isFixed: true }, // red-500
  { title: "Blocked",     color: "#f59e0b", isFixed: true }, // amber-500
];

/**
 * Creates the five fixed columns for Phase 2.
 */
function createFixedColumns(): Column[] {
  return FIXED_COLUMN_DEFINITIONS.map((def) => ({
    ...def,
    id: uuidv4(),
    cardIds: [],
  }));
}

/**
 * Creates a single default Board for Phase 2.
 * Used during fresh install or migration.
 */
export function createDefaultBoard(): Board {
  const id = uuidv4();
  const now = new Date().toISOString();

  return {
    id,
    title: "My Kanban Board",
    columns: createFixedColumns(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates BoardMeta for a board (used in the boards index).
 */
export function createDefaultBoardMeta(board: Board): Record<string, unknown> {
  return {
    id: board.id,
    title: board.title,
    totalCards: 0,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

/**
 * Builds a fresh default AppState for Phase 2 — 5 fixed columns, no cards, no tasks.
 * Called on first load or when stored data requires a fresh-start migration.
 *
 * Column structure per PRD section 3.1:
 *   1. To Do       — #94a3b8 (slate-400)
 *   2. In Progress — #3b82f6 (blue-500)
 *   3. Done        — #22c55e (green-500)
 *   4. Dropped     — #ef4444 (red-500)
 *   5. Blocked     — #f59e0b (amber-500)
 */
export function createDefaultState(): AppState {
  const now = new Date().toISOString();
  const boardId = uuidv4();

  return {
    board: {
      id: boardId,
      title: "My Kanban Board",
      columns: createFixedColumns(),
      createdAt: now,
      updatedAt: now,
    },
    cards: {},
    tasks: {},
  };
}
