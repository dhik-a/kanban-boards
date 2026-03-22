# TICKET-P2-BOARDS-003: Create New Board

**Phase**: 2 -- Multi-Board
**Feature Area**: BM (Board Management)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 5, 6, 7
**Related Feature IDs**: BM-001, BM-002, BM-006, BM-007, BM-008

---

## Problem Statement

Users need the ability to create new boards to organize work across different projects or contexts. Without board creation, the multi-board feature has no utility beyond the initial board.

---

## Goal & Success Metrics

- **Goal**: Allow users to create new boards via a modal, up to a maximum of 10.
- **Success looks like**: Board creation time (click Create to card visible) is under 300ms. Users can create boards and see them immediately on the boards list.

---

## User Story

As a Kanban user,
I want to create a new board by providing a name,
So that I can start organizing work for a new project.

---

## Acceptance Criteria

### Scenario 1: Create a new board (happy path)
```gherkin
Given the user is on the boards list page
And fewer than 10 boards exist
When the user clicks the "+ New Board" button
Then a modal appears with a text input labeled "Board Name" and Create/Cancel buttons
When the user types "Project Alpha" and clicks Create
Then a new board is created with 3 default columns ("To Do", "In Progress", "Done") and 0 cards
And the modal closes
And the new board card appears on the boards list
And the user remains on the boards list page (no auto-navigation into the board)
```

### Scenario 2: Board creation limit enforced (10 boards max)
```gherkin
Given the user has exactly 10 boards
When the user views the boards list page
Then the "+ New Board" button is disabled
And a tooltip or message indicates "Maximum of 10 boards reached"
```

### Scenario 3: Board creation with empty name rejected
```gherkin
Given the new board modal is open
When the user submits with an empty or whitespace-only name
Then the board is not created
And the input shows a validation error: "Board name cannot be empty"
```

### Scenario 4: Board title max length enforced
```gherkin
Given the new board modal is open
When the user types a name exceeding 100 characters
Then the input prevents further typing beyond 100 characters
Or the title is truncated to 100 characters on submission
```

### Scenario 5: Cancel board creation
```gherkin
Given the new board modal is open
When the user clicks Cancel
Then the modal closes
And no board is created
```

### Scenario 6: Create board via Enter key
```gherkin
Given the new board modal is open
And the user has typed "Project Alpha" in the name field
When the user presses Enter
Then the board is created as in the happy path
And the modal closes
```

---

## Additional Context & Notes

- **Current workaround**: In Phase 1, there is only one board. Users cannot separate concerns.
- **Assumptions**: New boards always initialize with 3 default columns: "To Do", "In Progress", "Done". Default column colors are assigned by the system.
- **Dependencies**: None (standalone feature on boards list page).
- **Out of scope**: Board templates, board duplication, custom initial columns.

---

## Notes for AI Agents

- The `+ New Board` button renders as a card-like element in the grid, visually distinct from board cards.
- When creating a board, generate a UUID for the board ID. Set `createdAt` and `updatedAt` to the current ISO 8601 timestamp.
- Default columns: `[{ title: "To Do" }, { title: "In Progress" }, { title: "Done" }]`, each with a generated UUID and empty `cardIds: []`.
- Dispatch `ADD_BOARD` global action. The reducer must enforce `boards.length < 10` guard.
- Persist: append to `kanban_boards`, create `kanban_board_{id}` and `kanban_cards_{id}` (empty object) in localStorage.
- The modal should auto-focus the text input on open.
- The `+ New Board` button should be disabled (not hidden) when 10 boards exist.
