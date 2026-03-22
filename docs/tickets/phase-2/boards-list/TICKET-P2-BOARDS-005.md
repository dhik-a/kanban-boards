# TICKET-P2-BOARDS-005: Delete Board with Confirmation - Data Sync Between Contexts

**Phase**: 2 -- Multi-Board
**Feature Area**: BM (Board Management)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 10, 11
**Related Feature IDs**: BM-004, BM-005

---

## Problem Statement

Users need to remove boards they no longer need. Since board deletion is destructive and cannot be undone, it requires explicit confirmation to prevent accidental data loss. Additionally, the system must prevent deleting the last remaining board to maintain the invariant that at least one board always exists.

---

## Goal & Success Metrics

- **Goal**: Allow users to delete boards with a confirmation step, while preventing deletion of the last board.
- **Success looks like**: Zero instances of accidental board deletion; the minimum-1-board invariant is never violated.

---

## User Story

As a Kanban user,
I want to delete a board I no longer need,
So that I can keep my boards list clean and focused.

---

## Acceptance Criteria

### Scenario 1: Delete a board (happy path)
```gherkin
Given the user is on the boards list page
And more than 1 board exists
When the user clicks the delete action on a board card
Then a confirmation dialog appears showing "Delete '{Board Name}'? This board has {N} cards. This action cannot be undone."
When the user confirms the deletion
Then the board is removed from the boards list
And the board's localStorage keys (kanban_board_{id} and kanban_cards_{id}) are deleted
And the board's entry is removed from the kanban_boards index
And the user remains on the boards list page
```

### Scenario 2: Cancel board deletion
```gherkin
Given the confirmation dialog for board deletion is open
When the user clicks Cancel or closes the dialog
Then the dialog closes
And the board is not deleted
```

### Scenario 3: Cannot delete the last board
```gherkin
Given only 1 board exists
When the user views the boards list page
Then the delete action on the board card is disabled
And a tooltip indicates "Cannot delete the last board"
```

### Scenario 4: Confirmation dialog shows accurate info
```gherkin
Given a board named "Project Alpha" has 12 cards
When the user clicks the delete action on that board card
Then the confirmation dialog shows "Delete 'Project Alpha'? This board has 12 cards. This action cannot be undone."
```

### Scenario 5: Delete a board with zero cards
```gherkin
Given a board named "Empty Board" has 0 cards
And more than 1 board exists
When the user clicks delete and confirms
Then the confirmation dialog shows "Delete 'Empty Board'? This board has 0 cards. This action cannot be undone."
And upon confirmation the board is removed
```

### Scenario 6: Deleting a column syncs card count to boards list
```gherkin
Given a board has 5 cards and the user is viewing it
When the user deletes a column that contains cards
Then the totalCards in the kanban_boards index is updated
And the board card on the boards list reflects the new card count
```

---

## Additional Context & Notes

- **Assumptions**: Board deletion is a hard delete (no soft-delete/archive). The confirmation dialog reuses the existing `ConfirmDialog` UI component from Phase 1.
- **Dependencies**: TICKET-P2-BOARDS-001 (board card rendering).
- **Out of scope**: Board archiving (soft-delete), undo functionality, bulk deletion.

---

## Notes for AI Agents

- The delete action button (e.g., trash icon) on the board card opens the `ConfirmDialog` component.
- The dialog message template: `"Delete '{board.title}'? This board has {board.totalCards} cards. This action cannot be undone."`
- On confirm: dispatch `DELETE_BOARD` with the board ID. The reducer must enforce `boards.length > 1` guard (no-op if only 1 board).
- After dispatching, remove `kanban_board_{id}` and `kanban_cards_{id}` from localStorage. Update `kanban_boards` to remove the entry.
- The delete button should be visually disabled (grayed out, non-clickable) when `boards.length === 1`. Add a `title` attribute or tooltip for the "Cannot delete" message.
- The `DELETE_BOARD` action does NOT trigger navigation -- the user stays on the boards list.
