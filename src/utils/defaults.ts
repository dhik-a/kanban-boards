import { v4 as uuidv4 } from "uuid";
import type { AppState } from "../types";

/**
 * Builds a fresh default AppState — three empty columns, no cards.
 * Called on first load or when stored data is corrupted.
 *
 * Column colors follow a muted palette that works in both light and dark modes
 * and leaves room for the user to customise them later (C-006).
 */
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
