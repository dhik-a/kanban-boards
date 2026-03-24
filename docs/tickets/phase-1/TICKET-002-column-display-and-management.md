# TICKET-002: Column Display & Management

**Priority:** P0
**PRD References:** C-001, C-002, C-003, U-004
**Area:** Column Management

## Summary

Users can view columns in a horizontal layout, add new columns, and rename existing ones inline. Empty columns display a placeholder message. The board enforces a maximum of 10 columns.

---

## Scenarios

### Scenario 1: Columns are displayed horizontally

```gherkin
Given a board exists with multiple columns
When the user views the board
Then the columns are displayed side by side in a horizontal layout
And each column shows its title
```

### Scenario 2: User adds a new column

```gherkin
Given the user is viewing the board
When the user clicks the "+ Add Column" button
Then a new column is added to the right of existing columns
And the new column has the default title "New Column"
And the column is empty with no cards
```

### Scenario 3: User renames a column by clicking the title

```gherkin
Given a column exists with a title
When the user clicks on the column title
Then the title becomes an editable text field
And the current title is pre-filled in the field
```

### Scenario 4: User confirms a column rename

```gherkin
Given the user has clicked a column title and it is in edit mode
When the user changes the text and confirms (presses Enter or clicks away)
Then the column title is updated to the new text
And the edit field is dismissed
```

### Scenario 5: User cancels a column rename

```gherkin
Given the user has clicked a column title and it is in edit mode
When the user presses Escape
Then the column title reverts to its original value
And the edit field is dismissed
```

### Scenario 6: Column title cannot exceed maximum length

```gherkin
Given the user is editing a column title
When the user types more than 50 characters
Then input beyond 50 characters is not accepted
```

### Scenario 7: Empty column title on confirm reverts to previous value

```gherkin
Given the user has clicked a column title and it is in edit mode
When the user clears all text and confirms (presses Enter or clicks away)
Then the column title reverts to its previous value
And the edit field is dismissed
And the column is not left with an empty title
```

### Scenario 8: Empty column displays a placeholder message

```gherkin
Given a column exists with no cards
When the user views the board
Then the column displays a "No cards yet" placeholder message in the card list area
And the placeholder is replaced by cards when a card is added to the column
```

### Scenario 9: Maximum column limit is enforced

```gherkin
Given the board already has 10 columns
When the user attempts to add another column (e.g., clicks "+ Add Column")
Then no new column is created
And the user is informed that the maximum of 10 columns has been reached
And the "+ Add Column" button is disabled or visually indicates the limit
```

---

## AI Agent Notes

- Default title for new columns is exactly the string "New Column".
- Empty column title validation: if the user submits an empty string (or whitespace-only), revert to the previous title. Do not allow blank column titles.
- The "No cards yet" placeholder must appear inside the column's card list area (not as a board-level message).
- Maximum column limit is 10. When the limit is reached, prevent column creation and communicate the constraint to the user.
