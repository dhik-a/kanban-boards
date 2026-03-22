# TICKET-P2-BOARD-003: Phase 1 Features Work Within Each Board

**Phase**: 2 -- Multi-Board
**Feature Area**: Within-Board
**Priority**: P0
**Dependencies**: P2-BOARD-001
**Related Scenarios**: 24
**Related Feature IDs**: N/A (regression/integration)

---

## Problem Statement

Phase 2 restructures state management and routing, which could break existing Phase 1 functionality. All column and card management features (add, edit, delete, reorder, drag-and-drop) must continue to work identically within each board. This ticket ensures no regressions are introduced.

---

## Goal & Success Metrics

- **Goal**: All Phase 1 features remain fully functional within the Phase 2 board view.
- **Success looks like**: Every Phase 1 interaction works identically inside `/boards/:boardId`. Changes persist to the correct board-specific localStorage keys.

---

## User Story

As a Kanban user working within a board,
I want all existing features (columns, cards, drag-and-drop, search, filter) to work as before,
So that the multi-board upgrade does not break my workflow.

---

## Acceptance Criteria

### Scenario 1: All Phase 1 features work within a board
```gherkin
Given the user is viewing a board at "/boards/{boardId}"
When the user performs any Phase 1 action (add/edit/delete columns, add/edit/delete/drag cards, search, filter)
Then the action works identically to Phase 1 behavior
And changes are persisted to the board-specific localStorage keys (kanban_board_{boardId} and kanban_cards_{boardId})
```

### Scenario 2: Card count syncs to boards list after card operations
```gherkin
Given the user is viewing a board with 5 cards
When the user adds a new card
Then the board's totalCards in the kanban_boards index is updated to 6
When the user navigates back to the boards list
Then the board card shows "6" as the total card count
```

### Scenario 3: Card count syncs after card deletion
```gherkin
Given the user is viewing a board with 5 cards
When the user deletes a card
Then the board's totalCards in the kanban_boards index is updated to 4
When the user navigates back to the boards list
Then the board card shows "4" as the total card count
```

### Scenario 4: Column operations persist correctly
```gherkin
Given the user is viewing Board A
When the user adds a new column titled "Review"
And the user reorders columns via drag-and-drop
Then the column changes are saved to kanban_board_{boardAId}
And navigating away and back to Board A shows the updated column layout
```

### Scenario 5: Card drag-and-drop persists correctly
```gherkin
Given the user is viewing Board A with a card in "To Do" column
When the user drags the card to the "Done" column
Then the card move is saved to kanban_board_{boardAId} and kanban_cards_{boardAId}
And navigating away and back to Board A shows the card in "Done"
```

### Scenario 6: Theme toggle works globally across boards
```gherkin
Given the user sets the theme to "dark" while viewing Board A
When the user navigates to the boards list
Then the dark theme is still active
When the user navigates into Board B
Then the dark theme is still active
```

---

## Additional Context & Notes

- **Assumptions**: Phase 1 components (Board, Column, CardItem, etc.) remain largely unchanged. The primary change is that they now read from and write to board-scoped context instead of a global single-board context.
- **Dependencies**: TICKET-P2-BOARD-001 (board-scoped state), TICKET-P2-NAV-001 (routing).
- **Out of scope**: New within-board features. This ticket is purely about ensuring Phase 1 parity.

---

## Notes for AI Agents

- The Phase 1 `Board`, `Column`, `CardItem`, `CardDetail`, `AddColumn`, `AddCard` components should require minimal changes. The key change is that their context provider now receives data from the board-scoped `BoardContext` instead of a global context.
- On card add: dispatch `ADD_CARD` (board-scoped) + `UPDATE_BOARD_CARD_COUNT` (global) with `totalCards + 1`.
- On card delete: dispatch `DELETE_CARD` (board-scoped) + `UPDATE_BOARD_CARD_COUNT` (global) with `totalCards - 1`.
- Theme toggle writes to `kanban_theme` (unchanged from Phase 1). It is global, not board-scoped.
- Verify that drag-and-drop (dnd-kit) still works after the component tree is restructured with route-level and context-level wrappers.
- This ticket is a regression test target. Consider writing integration tests that exercise each Phase 1 feature within the new Phase 2 board view.
