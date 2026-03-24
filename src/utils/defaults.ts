import { v4 as uuidv4 } from "uuid";
import type { AppState, Board } from "../types";

/**
 * Builds a fresh default AppState — three empty columns, no cards.
 * Called on first load or when stored data is corrupted.
 *
 * Column colors follow a muted palette that works in both light and dark modes
 * and leaves room for the user to customise them later (C-006).
 */
/**
 * Creates a single default Board for Phase 2 (multi-board).
 * Used during fresh install or migration.
 * Title is "My Board" (Phase 2 standard; Phase 1 legacy boards retain "My Kanban Board").
 */
export function createDefaultBoard(): Board {
  const id = uuidv4();
  const now = new Date().toISOString();

  const columns = [
    { id: uuidv4(), title: "To Do",       color: "#94a3b8" }, // slate-400
    { id: uuidv4(), title: "In Progress", color: "#60a5fa" }, // blue-400
    { id: uuidv4(), title: "Done",        color: "#4ade80" }, // green-400
  ].map((col) => ({ ...col, cardIds: [] as string[] }));

  return {
    id,
    title: "My Board",
    columns,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates BoardMeta for a board (used in the boards index).
 * Note: BoardMeta type is added in TICKET-P2-BOARD-006; this signature is for future use.
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

export function createDefaultState(): AppState {
  const now = new Date().toISOString();
  const boardId = uuidv4();

  const columns = [
    { id: uuidv4(), title: "To Do",       color: "#94a3b8" }, // slate-400
    { id: uuidv4(), title: "In Progress", color: "#60a5fa" }, // blue-400
    { id: uuidv4(), title: "Done",        color: "#4ade80" }, // green-400
  ].map((col) => ({ ...col, cardIds: [] as string[] }));

  return {
    board: {
      id: boardId,
      title: "My Kanban Board",
      columns,
      createdAt: now,
      updatedAt: now,
    },
    cards: {},
  };
}
