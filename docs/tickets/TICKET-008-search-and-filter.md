# TICKET-008: Search & Filter

**Priority:** P1
**PRD References:** S-001, S-002, S-003, S-004, S-005
**Area:** Search and Filter

## Summary

Users can search cards by title and filter by priority level or label. All filters can be cleared at once. A meaningful empty state is shown when no results match. Search scope is intentionally limited to card titles only. Drag-and-drop is disabled while search or filters are active.

---

## Scenarios

### Scenario 1: User searches for cards by title

```gherkin
Given the board has cards with various titles
When the user types a keyword in the search bar
Then only cards whose titles contain the keyword are shown
And non-matching cards are hidden across all columns
```

### Scenario 2: Search is case-insensitive

```gherkin
Given a card exists with the title "Fix Login Bug"
When the user searches for "fix login"
Then the card is shown in the results
```

### Scenario 3: Clearing the search restores all cards

```gherkin
Given the user has typed a search keyword
When the user clears the search input
Then all cards are visible again across all columns
```

### Scenario 4: User filters cards by priority

```gherkin
Given the board has cards with different priorities
When the user selects a priority filter (e.g., "High")
Then only cards with that priority level are shown
And cards with other priority levels are hidden
```

### Scenario 5: User filters cards by label

```gherkin
Given the board has cards with various labels
When the user selects a label filter
Then only cards that have that label are shown
```

### Scenario 6: Search and priority filter can be combined

```gherkin
Given the user has an active search keyword and a priority filter selected
When viewing the board
Then only cards that match both the keyword and the priority are shown
```

### Scenario 7: User clears all active filters

```gherkin
Given the user has an active search and/or filter applied
When the user clicks the "Clear All" button
Then all filters are removed
And all cards are visible again
```

### Scenario 8: No results state is shown per-column when filters match nothing

```gherkin
Given the user has applied a search or filter
And some columns have no cards matching the criteria
When viewing the board
Then all columns remain visible with their headers and chrome
And each column with zero matching cards displays a "No matching cards" message inside the column
And columns with matching cards show only the matching cards
```

### Scenario 9: Board-wide no results when nothing matches anywhere

```gherkin
Given the user has applied a search or filter
And no cards on the entire board match the criteria
When viewing the board
Then all columns are still displayed with their headers
And each column shows its individual "No matching cards" message
```

### Scenario 10: Drag-and-drop is disabled when search or filter is active

```gherkin
Given the user has an active search keyword or filter applied
When the user attempts to drag a card
Then the card cannot be dragged
And drag-and-drop interactions are disabled for all cards
And normal drag-and-drop resumes when all filters are cleared
```

---

## Notes

- **Search scope is title-only:** This is a deliberate limitation for Phase 1. Search does not match against card descriptions, labels, or other metadata. This keeps the search implementation simple and performant. Expanding search scope (e.g., to descriptions or labels) is a candidate for Phase 2.
- **Search debounce:** Filtering updates in real-time as the user types, debounced at 200ms for performance. The UI should not re-filter on every keystroke but wait until the user pauses typing for 200ms.

---

## AI Agent Notes

- Search matches card titles only (not descriptions or labels). This is intentional, not a bug.
- Search debounce is 200ms (distinct from the 300ms persistence debounce in TICKET-001).
- When search/filter is active: all columns remain visible. Non-matching cards are hidden. Columns with zero matches show a "No matching cards" message inside the column body. There is no single board-level "no results" banner.
- Drag-and-drop must be completely disabled when any search/filter is active. Re-enable only when all filters/search are cleared.
