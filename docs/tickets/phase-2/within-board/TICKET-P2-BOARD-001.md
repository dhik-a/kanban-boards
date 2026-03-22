# TICKET-P2-BOARD-001: Board-Scoped State and Data Loading

**Phase**: 2 -- Multi-Board
**Feature Area**: BM / NAV (Board Management + Navigation)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 12, 15, 24
**Related Feature IDs**: NAV-002, NAV-007

---

## Problem Statement

In Phase 1, the board state is global and always loaded. In Phase 2, board data must be loaded dynamically when a user navigates to a specific board and unloaded when they leave. Each board has its own localStorage keys, and the board-scoped state (columns, cards, filters) must be isolated per board.

---

## Goal & Success Metrics

- **Goal**: Load and unload board-specific data based on the active route, with board-scoped context providers.
- **Success looks like**: Board data loads in under 50ms from localStorage. Navigating between boards shows the correct data for each. No data leaks between boards.

---

## User Story

As a Kanban user navigating between boards,
I want each board to load its own data independently,
So that my actions in one board do not affect another.

---

## Acceptance Criteria

### Scenario 1: Board data loads on navigation
```gherkin
Given a board with ID "abc123" exists with 3 columns and 5 cards
When the user navigates to "/boards/abc123"
Then the board data is loaded from kanban_board_abc123 in localStorage
And the cards are loaded from kanban_cards_abc123 in localStorage
And the board page displays the correct 3 columns and 5 cards
```

### Scenario 2: Board data is isolated between boards
```gherkin
Given Board A has columns "To Do" and "Done" with 3 cards
And Board B has columns "Backlog", "Active", "Complete" with 7 cards
When the user views Board A
Then only Board A's columns and cards are displayed
When the user navigates to Board B
Then only Board B's columns and cards are displayed
And no data from Board A is visible
```

### Scenario 3: Board-scoped state resets on navigation
```gherkin
Given the user is viewing Board A with an active search filter for "bug"
When the user navigates back to the boards list
And then navigates into Board B
Then Board B has no active search filters
And the search bar is empty
```

### Scenario 4: Board data persists to correct localStorage keys
```gherkin
Given the user is viewing Board A with ID "abc123"
When the user adds a new card to a column
Then the card data is saved to kanban_cards_abc123 in localStorage
And the board structure is saved to kanban_board_abc123 in localStorage
And no other board's localStorage keys are modified
```

---

## Additional Context & Notes

- **Assumptions**: The `BoardContext` provider wraps the `BoardPage` component and loads/unloads data based on the `boardId` URL parameter. The `FilterContext` is also scoped to the board page.
- **Dependencies**: TICKET-P2-NAV-001 (routing), localStorage schema changes.
- **Out of scope**: Caching previously loaded boards in memory. Each navigation re-reads from localStorage.

---

## Notes for AI Agents

- Create/update `context/BoardsContext.tsx` for the global boards index (list of `BoardMeta[]`).
- Update `context/BoardContext.tsx` to accept a `boardId` prop and load data from `kanban_board_{boardId}` and `kanban_cards_{boardId}`.
- The `BoardContext` should be mounted inside `BoardPage` and unmounted when leaving the board route.
- `FilterContext` should also be scoped inside `BoardPage` so filters reset on board switch.
- State architecture: `GlobalContext` (boards list, theme) wraps the entire app. `BoardContext` (active board + cards) wraps only the board page. `FilterContext` (search, priority, labels) wraps only the board page.
- On `BoardAction` dispatch, persist changes to `kanban_board_{boardId}` and `kanban_cards_{boardId}` with 300ms debounce.
- On card add/delete, also dispatch `UPDATE_BOARD_CARD_COUNT` to the global context to keep `BoardMeta.totalCards` in sync.
