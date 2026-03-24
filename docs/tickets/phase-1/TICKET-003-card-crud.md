# TICKET-003: Card CRUD

**Priority:** P0
**PRD References:** K-001, K-002, K-003, K-004, K-005, K-006, K-008, K-009, U-005
**Area:** Card Management

## Summary

Users can create, view, edit, and delete cards. Each card has a title, description, priority, and a priority indicator displayed on the card face. Destructive actions (card deletion) require a confirmation dialog that uses a shared, consistent confirmation component. Card detail modal auto-saves changes on every field edit.

---

## Scenarios

### Scenario 1: User adds a card to a column

```gherkin
Given the user is viewing a column
When the user clicks the "+ Add Card" button at the bottom of the column
Then a text input appears for the card title
```

### Scenario 2: User confirms card creation by pressing Enter

```gherkin
Given the card title input is active in a column
When the user types a title and presses Enter
Then a new card is created with that title
And the card appears at the bottom of the column
And the card is assigned a default priority of "medium"
And the input is cleared and remains open for another entry
```

### Scenario 3: User cancels card creation via Escape

```gherkin
Given the card title input is active in a column
When the user presses Escape
Then no card is created
And the input field is dismissed
```

### Scenario 4: User opens a card detail view

```gherkin
Given a card exists in a column
When the user clicks on the card
Then a detail view opens showing the card's full information
And the title, description, and priority are visible
```

### Scenario 5: User edits the card title

```gherkin
Given the card detail view is open
When the user changes the title field
Then the card title is saved automatically upon the field losing focus or the user finishing the edit
And the updated title is reflected on the card in the column
```

### Scenario 6: User edits the card description

```gherkin
Given the card detail view is open
When the user types in the description field
Then the card description is saved automatically upon the field losing focus or the user finishing the edit
```

### Scenario 7: User sets card priority

```gherkin
Given the card detail view is open
When the user selects a priority level (low, medium, or high)
Then the card's priority is updated immediately (auto-saved)
And a color-coded priority indicator is shown on the card face in the column
```

### Scenario 8: Priority indicator is visible on the card

```gherkin
Given a card has a priority set
When the user views the board
Then the card displays a visual indicator reflecting its priority level
And each priority level has a distinct color (e.g., low = green, medium = yellow, high = red)
```

### Scenario 9: User deletes a card

```gherkin
Given the card detail view is open
When the user clicks the delete button
Then a confirmation dialog appears asking the user to confirm deletion
And the confirmation dialog uses the same shared confirmation component used for all destructive actions across the app
```

### Scenario 10: User confirms card deletion

```gherkin
Given the delete confirmation dialog is shown
When the user confirms the deletion
Then the card is permanently removed from the column
And the detail view is closed
```

### Scenario 11: User cancels card deletion

```gherkin
Given the delete confirmation dialog is shown
When the user cancels
Then the card remains in its column
And the detail view remains open
```

### Scenario 12: Card title cannot be empty

```gherkin
Given the card title input is active
When the user attempts to submit with an empty title
Then the card is not created
And the user sees an indication that a title is required
```

### Scenario 13: Card title cannot exceed maximum length

```gherkin
Given the user is entering a card title
When the user types more than 100 characters
Then input beyond 100 characters is not accepted
```

### Scenario 14: Card description cannot exceed maximum length

```gherkin
Given the user is editing a card description in the detail view
When the user types more than 2000 characters
Then input beyond 2000 characters is not accepted
And the user is informed of the character limit (e.g., a character counter showing remaining characters)
```

### Scenario 15: Quick-add card receives default priority

```gherkin
Given the user creates a card via the quick-add input
When the card is created with only a title
Then the card is assigned "medium" as its default priority
And the priority indicator on the card face reflects "medium"
```

### Scenario 16: Card detail modal auto-saves on every field change

```gherkin
Given the card detail view is open
When the user changes any field (title, description, or priority)
Then the change is saved automatically without requiring an explicit save button
And the saved state is reflected immediately on the board
```

### Scenario 17: Closing the card detail modal does not discard changes

```gherkin
Given the card detail view is open
And the user has made changes to one or more fields
When the user presses Escape or clicks outside the modal
Then the modal closes
And all changes are preserved (since they were already auto-saved)
```

### Scenario 18: Quick-add input closes on blur with empty title

```gherkin
Given the card title quick-add input is active and empty
When the user clicks away from the input (blur)
Then no card is created
And the input field is dismissed
```

### Scenario 19: Quick-add input creates card on blur with non-empty title

```gherkin
Given the card title quick-add input is active
And the user has typed a non-empty title
When the user clicks away from the input (blur)
Then a new card is created with that title
And the card appears at the bottom of the column
```

### Scenario 20: Quick-add input stays open after creating a card

```gherkin
Given the card title quick-add input is active
When the user types a title and presses Enter to create a card
Then the card is created
And the input remains open and cleared, ready for another card title
And the input closes only when the user presses Escape or clicks away with an empty input
```

---

## AI Agent Notes

- The confirmation dialog for card deletion must use the same shared/consistent confirmation component used across the app (same component as column deletion in TICKET-005). See PRD U-005.
- Card detail modal uses auto-save semantics: every field change is persisted immediately. There is no explicit "Save" button. Closing the modal (Escape or click-outside) simply dismisses it; nothing is lost.
- Default priority for new cards (both quick-add and any other creation path) is "medium".
- Card description max length is 2000 characters. Enforce at the input level.
- Quick-add input lifecycle: stays open after card creation (for batch creation), closes on Escape, closes on blur if empty. If blur occurs with a non-empty title, create the card first, then dismiss.
