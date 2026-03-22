# TICKET-P2-BOARDS-006: Empty State for Boards List

**Phase**: 2 -- Multi-Board
**Feature Area**: BL (Board List)
**Priority**: P1
**Dependencies**: None
**Related Scenarios**: N/A (defensive)
**Related Feature IDs**: BL-007

---

## Problem Statement

Although the system enforces a minimum of 1 board at all times, there is a defensive need to handle the edge case where the boards list is empty (e.g., due to a localStorage corruption or manual key deletion). Without a proper empty state, users would see a blank page with no way to recover.

---

## Goal & Success Metrics

- **Goal**: Display a helpful empty state on the boards list page when no boards exist, allowing users to create one.
- **Success looks like**: Users never encounter a blank, unusable boards list page regardless of data state.

---

## User Story

As a Kanban user,
I want to see a helpful message and a way to create a board if my boards list is somehow empty,
So that I can recover from unexpected data states without confusion.

---

## Acceptance Criteria

### Scenario 1: Empty state displayed when no boards exist
```gherkin
Given there are no boards in localStorage (kanban_boards is empty or missing)
When the user navigates to "/"
Then an empty state message is displayed (e.g., "No boards yet. Create your first board to get started.")
And the "+ New Board" button is prominently displayed and enabled
```

### Scenario 2: Empty state disappears after board creation
```gherkin
Given the boards list is showing the empty state
When the user creates a new board
Then the empty state message disappears
And the new board card is displayed
```

---

## Additional Context & Notes

- **Assumptions**: Under normal operation, this state should not occur because the migration logic (MIG-007) creates a default board for fresh installs, and the delete logic (BM-005) prevents deleting the last board.
- **Dependencies**: TICKET-P2-BOARDS-003 (board creation).
- **Out of scope**: Automatic recovery or re-creation of a default board from the UI layer. The empty state simply shows a message and the create button.

---

## Notes for AI Agents

- Check `boards.length === 0` in the `BoardsListPage` component. If true, render the empty state instead of the board card grid.
- The empty state should include an illustration or icon (optional), a text message, and the `+ New Board` button.
- The `+ New Board` button in the empty state should behave identically to the normal `+ New Board` button (opens the creation modal).
- This is a defensive UI; it guards against manual localStorage tampering or unforeseen bugs.
