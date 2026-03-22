# TICKET-P2-BOARDS-004: Rename Board Inline

**Phase**: 2 -- Multi-Board
**Feature Area**: BM (Board Management)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 8, 9
**Related Feature IDs**: BM-003, BM-007, BM-008

---

## Problem Statement

Users need to rename boards as projects evolve. The rename interaction should be quick and inline on the board card, matching the existing UX pattern used for column title editing in Phase 1.

---

## Goal & Success Metrics

- **Goal**: Allow users to rename a board directly from the boards list page using inline editing.
- **Success looks like**: Users can rename boards in-place without opening a modal, and the change persists immediately.

---

## User Story

As a Kanban user,
I want to rename a board by editing its title directly on the board card,
So that I can keep my board names up to date without navigating away.

---

## Acceptance Criteria

### Scenario 1: Rename a board inline (happy path)
```gherkin
Given the user is on the boards list page
When the user clicks the rename action on a board card
Then the board title becomes an editable text input pre-filled with the current title
When the user changes the title to "Project Beta" and presses Enter
Then the board title is updated to "Project Beta" on the card and in localStorage
```

### Scenario 2: Rename confirmed by clicking away (blur)
```gherkin
Given a board title is in inline-edit mode
And the user has changed the title to "New Name"
When the user clicks outside the input (blur)
Then the board title is updated to "New Name" on the card and in localStorage
```

### Scenario 3: Rename rejects empty title
```gherkin
Given a board title is in inline-edit mode
When the user clears the title and presses Enter
Then the title reverts to its previous value
And the board is not renamed
```

### Scenario 4: Rename rejects whitespace-only title
```gherkin
Given a board title is in inline-edit mode
When the user types only spaces and presses Enter
Then the title reverts to its previous value
And the board is not renamed
```

### Scenario 5: Rename respects max length (100 characters)
```gherkin
Given a board title is in inline-edit mode
When the user types a name exceeding 100 characters
Then the input prevents further typing beyond 100 characters
Or the title is truncated to 100 characters on confirm
```

### Scenario 6: Cancel rename via Escape key
```gherkin
Given a board title is in inline-edit mode
When the user presses Escape
Then the title reverts to its previous value
And inline-edit mode is exited
```

---

## Additional Context & Notes

- **Assumptions**: The inline-edit UX matches the column title editing pattern from Phase 1 (click to activate, Enter/blur to confirm, Escape to cancel).
- **Dependencies**: TICKET-P2-BOARDS-001 (board card rendering).
- **Out of scope**: Renaming a board from within the board page (via breadcrumb). That is addressed separately in the navigation tickets.

---

## Notes for AI Agents

- The rename action button (e.g., pencil icon) on the board card triggers inline-edit mode.
- In inline-edit mode, the board title text is replaced by a text input, pre-filled with the current title and auto-selected.
- On confirm (Enter or blur): trim the input value. If empty after trimming, revert. Otherwise, dispatch `RENAME_BOARD` with the new title.
- On cancel (Escape): revert to previous title, exit edit mode.
- The `RENAME_BOARD` action updates both the `kanban_boards` index and sets `updatedAt` to the current timestamp.
- The board-specific key `kanban_board_{id}` should also have its title updated for consistency.
- Input should have `maxLength={100}` attribute.
