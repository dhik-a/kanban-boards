# TICKET-005: Column Delete & Card Count Badge

**Priority:** P1
**PRD References:** C-004, C-007, U-005
**Area:** Column Management

## Summary

Users can delete columns (with a safety confirmation), and each column header displays a badge showing the number of cards it contains. The confirmation dialog for column deletion must use the same shared confirmation component used for all destructive actions across the app, and must clearly state how many cards will be deleted.

---

## Scenarios

### Scenario 1: User initiates column deletion

```gherkin
Given a column exists on the board
When the user selects the delete option from the column menu
Then a confirmation dialog appears asking the user to confirm deletion of the column
And the confirmation dialog uses the same shared confirmation component used for all destructive actions across the app
```

### Scenario 2: Confirmation dialog shows the number of cards being deleted

```gherkin
Given a column contains 5 cards
When the user selects the delete option from the column menu
Then the confirmation dialog displays a warning that includes the column name and the number of cards (e.g., "Delete column 'In Progress'? This will permanently remove 5 cards.")
And the user can see exactly how many cards will be lost before confirming
```

### Scenario 3: Confirmation dialog for empty column deletion

```gherkin
Given a column exists with no cards
When the user selects the delete option from the column menu
Then the confirmation dialog indicates the column is empty (e.g., "Delete column 'Backlog'? This column has no cards.")
```

### Scenario 4: User confirms column deletion

```gherkin
Given the column deletion confirmation dialog is shown
When the user confirms
Then the column is removed from the board
And all cards that were in that column are also removed
```

### Scenario 5: User cancels column deletion

```gherkin
Given the column deletion confirmation dialog is shown
When the user cancels
Then the column remains on the board with all its cards intact
```

### Scenario 6: Last remaining column cannot be deleted

```gherkin
Given only one column remains on the board
When the user attempts to delete it
Then the delete option is unavailable or disabled
And the column is not removed
```

### Scenario 7: Card count badge reflects the current number of cards

```gherkin
Given a column contains cards
When the user views the board
Then the column header displays a badge showing the total number of cards in that column
```

### Scenario 8: Card count badge updates when a card is added

```gherkin
Given a column displays its card count
When a new card is added to that column
Then the badge count increments by one immediately
```

### Scenario 9: Card count badge updates when a card is moved out

```gherkin
Given a column displays its card count
When a card is moved from that column to another column
Then the source column badge count decrements by one
And the target column badge count increments by one
```

### Scenario 10: Card count badge shows zero for an empty column

```gherkin
Given a column has no cards
When the user views the board
Then the column header badge shows zero or no badge
```

---

## AI Agent Notes

- The confirmation dialog must be the same shared component used for card deletion (TICKET-003) and any other destructive action. See PRD U-005.
- The confirmation message for column deletion must dynamically include:
  - The column name
  - The exact number of cards in the column
- If the column has 0 cards, the message should reflect that (e.g., "This column has no cards.") rather than saying "0 cards will be deleted."
- The last-column guard must prevent deletion entirely (disable the option), not just show a warning.
