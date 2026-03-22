# TICKET-013: Change Card Status (Column) from Detail Modal

**Type**: Improvement
**Priority:** P1
**PRD References:** K-003, D-002, C-007
**Area:** Card Management
**Persona:** Any board user managing tasks
**Epic / Theme:** Card Management / Card Detail Modal

---

### Problem Statement

Users currently must close the card detail modal and drag the card to move it between columns. This is cumbersome on mobile, inaccessible for keyboard-only users, and adds unnecessary friction when a user is already reviewing a card's details and decides it belongs in a different stage. Users need a way to change a card's column directly from the context where they are already working.

---

### Goal & Success Metrics

- **Goal**: Allow users to move a card to a different column without leaving the card detail modal.
- **Success looks like**: Users can change card status from the modal with the same reliability as drag-and-drop. The board state (card position, column counts) updates immediately and consistently.

---

### User Story

As a board user,
I want to change which column a card belongs to directly from the card detail modal,
So that I can update a card's status without closing the modal and dragging it on the board.

---

### Acceptance Criteria (Gherkin)

**Scenario 1: Status field is visible in the card detail modal**

```gherkin
Given the user has opened the card detail modal for a card in the "To Do" column
When the modal is displayed
Then a "Status" field is visible showing "To Do" as the current value
And the field presents a selector control listing all columns on the board
```

**Scenario 2: User changes the card's status to a different column**

```gherkin
Given the card detail modal is open for a card currently in the "To Do" column
And the board has columns "To Do", "In Progress", and "Done"
When the user selects "In Progress" from the status selector
Then the card is removed from the "To Do" column
And the card appears at the bottom of the "In Progress" column
And the status field in the modal updates to show "In Progress"
And the change is saved automatically without requiring an explicit save action
```

**Scenario 3: Column card count badges update immediately after status change**

```gherkin
Given the "To Do" column has 3 cards and the "Done" column has 2 cards
And the card detail modal is open for a card in "To Do"
When the user changes the status to "Done"
Then the "To Do" column badge updates to show 2
And the "Done" column badge updates to show 3
```

**Scenario 4: Selecting the current column is a no-op**

```gherkin
Given the card detail modal is open for a card in the "In Progress" column
When the user selects "In Progress" from the status selector (the same column)
Then the card remains in the "In Progress" column at its current position
And no state change or save is triggered
And the board remains unchanged
```

**Scenario 5: Status selector on a board with only one column**

```gherkin
Given the board has exactly one column named "Backlog"
And the card detail modal is open for a card in "Backlog"
When the user views the status field
Then the status field displays "Backlog" as the current value
And the selector shows "Backlog" as the only option
And no other options are available to select
```

**Scenario 6: Card is placed at the bottom of the destination column**

```gherkin
Given the "Done" column already contains 4 cards
And the card detail modal is open for a card in "To Do"
When the user changes the status to "Done"
Then the card appears as the last card in the "Done" column (position 5)
And the existing card order in "Done" is not affected
```

**Scenario 7: Status change persists after closing the modal**

```gherkin
Given the card detail modal is open for a card in "To Do"
And the user changes the status to "In Progress"
When the user closes the modal
Then the card remains in the "In Progress" column on the board
And reopening the card detail modal shows "In Progress" as the current status
```

**Scenario 8: Status change persists after page reload**

```gherkin
Given a card was moved from "To Do" to "Done" via the status selector in the modal
When the user reloads the page
Then the card appears in the "Done" column
And the card does not appear in the "To Do" column
```

**Scenario 9: Status selector reflects current column names**

```gherkin
Given the board has columns "Backlog", "Doing", and "Shipped"
And a card exists in "Backlog"
When the user opens the card detail modal
Then the status selector lists "Backlog", "Doing", and "Shipped" in the same order as the columns appear on the board
```

---

### Additional Context & Notes

- **Current workaround**: Users must close the detail modal, locate the card on the board, and drag it to the target column. On mobile or with many cards, this is especially tedious.
- **Assumptions**:
  - The status change from the modal uses the same underlying `MOVE_CARD` action as drag-and-drop, ensuring consistent behavior.
  - "Bottom of the destination column" means the card is appended to the end of the column's `cardIds` array.
- **Dependencies**:
  - TICKET-003 (Card CRUD / detail modal must exist)
  - TICKET-004 (Drag and drop / `MOVE_CARD` action must exist)
  - TICKET-005 (Card count badge must exist for badge update scenarios)
- **Out of scope**:
  - Choosing a specific position within the destination column (card always goes to the bottom)
  - Reordering cards within the same column via this selector
  - Showing column colors or card counts inside the status selector dropdown
  - Creating or managing columns from the status selector

---

### Notes for AI Agents

- **Component location**: The status selector should be added to `CardDetail.tsx` (see PRD component tree: `CardDetailModal`). It is a new field alongside `PrioritySelect`, `LabelsInput`, etc.
- **Data flow**: The modal needs access to the board's column list (`Board.columns`) to populate the selector options. It also needs to know which column currently contains this card. Derive the current column by finding which column's `cardIds` array includes the card's ID.
- **Action to dispatch**: Reuse the existing `MOVE_CARD` action:
  ```
  {
    type: "MOVE_CARD",
    payload: {
      cardId: <card ID>,
      sourceColumnId: <current column ID>,
      destinationColumnId: <selected column ID>,
      sourceIndex: <current index in source column>,
      destinationIndex: <length of destination column's cardIds array>
    }
  }
  ```
  Setting `destinationIndex` to the length of the destination `cardIds` array places the card at the bottom.
- **No-op guard**: Before dispatching `MOVE_CARD`, check if `sourceColumnId === destinationColumnId`. If true, do nothing.
- **Selector display order**: Column options in the selector must appear in the same order as `Board.columns` (the array index order), matching their visual left-to-right order on the board.
- **Auto-save**: This field follows the same auto-save pattern as priority (TICKET-003, Scenario 16). The change takes effect immediately on selection; there is no "Save" button.
- **Selector value**: Use `column.id` as the option value and `column.title` as the display label.

---

### Engineering Notes

- Consider placing the status selector near the top of the modal (above or alongside priority) since changing a card's status is a high-frequency action.
- The selector should be a standard `<select>` or a custom dropdown component consistent with the priority selector's styling.
- Since the modal already auto-saves, the `MOVE_CARD` dispatch should happen directly in the `onChange` handler of the selector -- no debounce needed for a discrete selection event.
- The modal should remain open after the status change. The card's position on the board updates behind the modal.

---

### Attachments / References

- [PRD.md](/docs/PRD.md) -- Data model (`MOVE_CARD` action), component architecture (`CardDetailModal`)
- [TICKET-003](/docs/tickets/TICKET-003-card-crud.md) -- Card detail modal, auto-save behavior
- [TICKET-004](/docs/tickets/TICKET-004-drag-and-drop.md) -- Drag-and-drop cross-column move
- [TICKET-005](/docs/tickets/TICKET-005-column-delete-and-card-count.md) -- Card count badge behavior
