# TICKET-P2-BOARD-005: Board Title Rename Sync Between Board Page and Boards List

**Phase**: 2 -- Multi-Board
**Feature Area**: BM (Board Management) / NAV (Navigation)
**Priority**: P0
**Dependencies**: P2-BOARD-001
**Related Scenarios**: 8, 12
**Related Feature IDs**: BM-003, NAV-003

---

## Problem Statement

When a board title is changed from within the board page (e.g., via an inline edit on the breadcrumb or other future mechanism) or from the boards list (via inline rename), the change must be reflected consistently in both places: the `kanban_boards` index, the `kanban_board_{id}` data, and the breadcrumb display. Without sync, the title could become inconsistent between the index and the board data.

---

## Goal & Success Metrics

- **Goal**: Ensure board title changes propagate to both the global boards index and the board-specific localStorage key.
- **Success looks like**: A board title renamed on the boards list page is reflected when the user opens that board (in the breadcrumb). The `kanban_boards` index and `kanban_board_{id}` always have matching titles.

---

## User Story

As a Kanban user,
I want board title changes to be consistent everywhere,
So that I always see the correct board name regardless of where I look.

---

## Acceptance Criteria

### Scenario 1: Rename on boards list syncs to board data
```gherkin
Given the user renames a board from "Alpha" to "Beta" on the boards list page
When the user navigates into that board
Then the breadcrumb shows "All Boards > Beta"
And the kanban_board_{id} key in localStorage has title "Beta"
```

### Scenario 2: Board data title matches index after rename
```gherkin
Given a board is renamed via the boards list
When the system persists the change
Then both kanban_boards (index entry) and kanban_board_{id} have the updated title
And the updatedAt timestamp is refreshed on both
```

### Scenario 3: Card count updates reflect on boards list
```gherkin
Given the user adds 2 cards to a board while viewing it
When the user navigates back to the boards list
Then the board card shows the updated total card count
And the kanban_boards index entry has the correct totalCards value
```

---

## Additional Context & Notes

- **Assumptions**: In Phase 2, board title editing is only available from the boards list page (via inline rename). The breadcrumb on the board page is display-only. However, the sync mechanism should be bidirectional-ready for future enhancements.
- **Dependencies**: TICKET-P2-BOARDS-004 (rename), TICKET-P2-BOARDS-007 (global state), TICKET-P2-BOARD-001 (board-scoped state).
- **Out of scope**: Inline editing of the board title from the breadcrumb within the board page.

---

## Notes for AI Agents

- When `RENAME_BOARD` is dispatched to the global context:
  1. Update the `BoardMeta` entry in the boards index (title + updatedAt).
  2. Read `kanban_board_{id}` from localStorage, update its `title` and `updatedAt`, and write it back.
  3. Write the updated `kanban_boards` index to localStorage.
- When `UPDATE_BOARD_CARD_COUNT` is dispatched:
  1. Update the `BoardMeta.totalCards` field in the global state.
  2. Persist the updated `kanban_boards` index.
- The `RENAME_BOARD` action handler in the global reducer should update `updatedAt` to the current ISO 8601 timestamp.
- Consider creating a helper function `syncBoardTitle(boardId: string, newTitle: string)` in storage utils that updates both the index and the board data atomically.
