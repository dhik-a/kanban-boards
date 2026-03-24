# TICKET-010: Advanced Polish (Column Reorder, Color, DnD Overlay, Keyboard DnD, Animations, Toasts)

**Priority:** P2
**PRD References:** C-005, C-006, D-004, D-005, U-003, U-006
**Area:** UI / UX, Drag and Drop, Column Management

## Summary

Quality-of-life and polish features: column drag-and-drop reordering, column accent colors, drag overlay preview, keyboard-accessible drag-and-drop, smooth animations, and toast notifications.

---

## Scenarios

### Scenario 1: User reorders columns via drag and drop

```gherkin
Given the board has multiple columns
When the user drags a column header and drops it in a new position
Then the column moves to that position
And all cards within the column move with it
```

### Scenario 2: User sets a column accent color

```gherkin
Given the user opens the column settings menu
When the user selects a color from the color picker
Then the column header displays the selected accent color
```

### Scenario 3: Column accent color persists after refresh

```gherkin
Given the user has set a custom accent color on a column
When the user refreshes the page
Then the column retains the selected accent color
```

### Scenario 4: Drag overlay shows a preview of the dragged card

```gherkin
Given the user is dragging a card
When the card is lifted and in transit
Then a semi-transparent preview of the card follows the user's cursor
And the original card position shows a placeholder
```

### Scenario 5: User can drag and drop cards using only the keyboard

```gherkin
Given a card is focused via keyboard navigation
When the user activates drag mode with the keyboard (e.g., Space)
And uses arrow keys to navigate to a new position
And confirms placement (e.g., Space or Enter)
Then the card moves to the selected position
```

### Scenario 6: Card movement is visually animated

```gherkin
Given the user drags a card to a new position
When the card is dropped
Then the card animates smoothly into its new position
And surrounding cards animate to fill the vacated space
```

### Scenario 7: Toast notification appears after a key action

```gherkin
Given the user performs a key action (e.g., creates, deletes, or moves a card)
When the action completes
Then a brief toast notification appears confirming the action
And the toast auto-dismisses after 4 seconds
And the user can manually dismiss the toast by clicking it before the auto-dismiss timer expires
```

### Scenario 8: Toast notification appears after column deletion

```gherkin
Given the user confirms deletion of a column
When the column is removed
Then a toast notification confirms the column was deleted
```

---

## Notes

- Toast auto-dismiss duration is 4 seconds.
- Toasts must be manually dismissible by clicking (in addition to auto-dismiss).
- Multiple toasts may stack if several actions happen in quick succession; older toasts remain visible until their individual timers expire.

---

## AI Agent Notes

- Toast duration: 4000ms auto-dismiss. Clicking a toast dismisses it immediately.
- Toast stacking: if multiple actions trigger toasts rapidly, stack them vertically (newest on top or bottom, be consistent). Each toast has its own independent 4-second timer.
