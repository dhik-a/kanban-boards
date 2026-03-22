# TICKET-P2-BOARDS-007: Global State Management for Boards Index

**Phase**: 2 -- Multi-Board
**Feature Area**: BL / BM (Board List + Board Management)
**Priority**: P0
**Dependencies**: P2-BOARD-006
**Related Scenarios**: 1, 5, 8, 10
**Related Feature IDs**: BL-001, BM-001, BM-003, BM-004

---

## Problem Statement

Phase 2 requires a new global state layer to manage the boards index (`BoardMeta[]`). This state powers the boards list page and must be kept in sync with board-level operations (create, rename, delete, card count changes). Without a centralized global state and reducer, the boards list would become stale or inconsistent.

---

## Goal & Success Metrics

- **Goal**: Implement a global `BoardsContext` with a reducer that manages the boards index and enforces invariants (max 10, min 1, title validation).
- **Success looks like**: All board CRUD operations update the global state and persist to `kanban_boards` in localStorage. Reducer guards prevent invalid states.

---

## User Story

As a developer building the multi-board feature,
I need a centralized global state for the boards index,
So that the boards list stays consistent across all operations.

---

## Acceptance Criteria

### Scenario 1: Global state loads boards on app start
```gherkin
Given the kanban_boards key in localStorage contains 3 board entries
When the app initializes
Then the global state loads all 3 BoardMeta entries
And the boards list page can render them
```

### Scenario 2: ADD_BOARD action creates a new entry
```gherkin
Given the global state has 3 boards
When an ADD_BOARD action is dispatched with a new BoardMeta
Then the global state contains 4 boards
And the kanban_boards key in localStorage is updated with 4 entries
```

### Scenario 3: ADD_BOARD rejected at max limit
```gherkin
Given the global state has exactly 10 boards
When an ADD_BOARD action is dispatched
Then the action is a no-op
And the global state still contains 10 boards
```

### Scenario 4: DELETE_BOARD rejected when only 1 board
```gherkin
Given the global state has exactly 1 board
When a DELETE_BOARD action is dispatched
Then the action is a no-op
And the global state still contains 1 board
```

### Scenario 5: RENAME_BOARD rejects empty title
```gherkin
Given a board exists with title "Project Alpha"
When a RENAME_BOARD action is dispatched with an empty string as the new title
Then the action is a no-op
And the board title remains "Project Alpha"
```

### Scenario 6: UPDATE_BOARD_CARD_COUNT syncs card count
```gherkin
Given a board in the global state has totalCards of 5
When an UPDATE_BOARD_CARD_COUNT action is dispatched with totalCards of 6
Then the board's totalCards in the global state is updated to 6
And the kanban_boards key in localStorage reflects the updated count
```

---

## Additional Context & Notes

- **Assumptions**: The global reducer handles all `GlobalAction` types. Persistence to localStorage is debounced at 300ms.
- **Dependencies**: Data model types (BoardMeta, AppState).
- **Out of scope**: Board-scoped state (handled in TICKET-P2-BOARD-001). UI components (handled in TICKET-P2-BOARDS-001 through 006).

---

## Notes for AI Agents

- Create `context/BoardsContext.tsx` with:
  - `BoardsState` type: `{ boards: BoardMeta[] }`
  - `GlobalAction` union type (LOAD_BOARDS, ADD_BOARD, RENAME_BOARD, DELETE_BOARD, UPDATE_BOARD_CARD_COUNT)
  - `boardsReducer` function with guards:
    - ADD_BOARD: no-op if `boards.length >= 10`; reject empty/whitespace title; truncate title to 100 chars
    - DELETE_BOARD: no-op if `boards.length <= 1`
    - RENAME_BOARD: no-op if title is empty after trim; truncate to 100 chars; update `updatedAt`
  - `BoardsProvider` component that wraps the app
  - `useBoards()` hook for consuming the context
- Persistence: after every dispatch, write `boards` array to `kanban_boards` in localStorage (debounced 300ms).
- The context should be mounted in `App.tsx` above the router, so it is available on all routes.
- Update `types/index.ts` to add `BoardMeta` and `GlobalAction` types.
