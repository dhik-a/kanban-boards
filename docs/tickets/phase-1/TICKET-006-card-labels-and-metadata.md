# TICKET-006: Card Labels & Metadata Display

**Priority:** P1
**PRD References:** K-007, K-010, K-011
**Area:** Card Management

## Summary

Users can add and remove free-text labels on cards. Labels are displayed as colored chips on the card face, with colors deterministically derived from the label text. Cards also show their creation date in a human-readable format. Duplicate labels on the same card are prevented.

---

## Scenarios

### Scenario 1: User adds a label to a card

```gherkin
Given the card detail view is open
When the user types a label name and confirms
Then the label is added to the card
And the label appears as a chip on the card face in the column
```

### Scenario 2: User removes a label from a card

```gherkin
Given a card has one or more labels
And the card detail view is open
When the user removes a label
Then that label is no longer associated with the card
And the label chip is removed from the card face
```

### Scenario 3: Labels are displayed as chips on the card face

```gherkin
Given a card has labels
When the user views the board
Then the card displays each label as a distinct colored chip
```

### Scenario 4: Maximum label count is enforced

```gherkin
Given a card already has 5 labels
When the user attempts to add a sixth label
Then the label is not added
And the user is informed that the maximum number of labels has been reached
```

### Scenario 5: Label text cannot exceed maximum length

```gherkin
Given the user is adding a label
When the user types more than 20 characters
Then input beyond 20 characters is not accepted
```

### Scenario 6: Card displays its creation date

```gherkin
Given a card was created 3 days ago
When the user opens the card detail view
Then the creation date is displayed as relative time (e.g., "3 days ago")
```

### Scenario 7: Creation date format for older cards

```gherkin
Given a card was created more than 7 days ago
When the user opens the card detail view
Then the creation date is displayed in "MMM DD, YYYY" format (e.g., "Mar 15, 2026")
```

### Scenario 8: Label color is deterministically derived from label text

```gherkin
Given a user adds a label with the text "urgent"
When the label chip is displayed on the card face
Then the label chip color is derived deterministically from the label text (e.g., via a hash function mapped to a fixed color palette)
And the same label text always produces the same color, across all cards and sessions
```

### Scenario 9: Duplicate labels on the same card are prevented

```gherkin
Given a card already has a label "bug"
When the user attempts to add another label with the text "bug" (case-insensitive)
Then the duplicate label is not added
And the user is informed that this label already exists on the card
```

---

## Notes

- **`updatedAt` field:** The `updatedAt` timestamp is stored in the card data model but is not displayed anywhere in Phase 1. It is reserved for future use (e.g., "Last modified" display, sorting by recent activity).
- **Creation date display rules:**
  - Within the last 7 days: use relative time (e.g., "3 days ago", "just now", "1 day ago")
  - Older than 7 days: use "MMM DD, YYYY" format (e.g., "Mar 15, 2026")

---

## AI Agent Notes

- Label chip colors must be deterministic: hash the label text string to an index in a fixed color palette (e.g., 10-12 predefined colors). The same label text must always produce the same color regardless of which card it appears on.
- Duplicate label detection is case-insensitive. "Bug", "bug", and "BUG" are all considered the same label.
- The `updatedAt` field must be maintained in the data model (updated on every card change) but not rendered in the UI in Phase 1.
- Creation date formatting: use relative time for dates within 7 days, absolute "MMM DD, YYYY" format otherwise.
