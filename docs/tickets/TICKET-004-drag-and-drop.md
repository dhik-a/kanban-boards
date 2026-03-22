# TICKET-004: Drag and Drop

**Priority:** P0
**PRD References:** D-001, D-002, D-003
**Area:** Drag and Drop

## Summary

Users can drag cards to reorder them within a column or move them to a different column. A visual drop indicator guides the placement.

---

## Scenarios

### Scenario 1: User reorders a card within the same column

```gherkin
Given a column contains multiple cards
When the user drags a card and drops it above or below another card in the same column
Then the card moves to the new position
And the order of other cards adjusts accordingly
```

### Scenario 2: User moves a card to a different column

```gherkin
Given cards exist in at least two columns
When the user drags a card and drops it onto a different column
Then the card is removed from the source column
And the card appears in the target column at the dropped position
```

### Scenario 3: Visual drop indicator appears during drag

```gherkin
Given the user is dragging a card
When the user hovers over a valid drop target
Then a visual indicator (e.g., a highlighted line or placeholder) shows where the card will land
```

### Scenario 4: Card returns to original position when dropped outside a valid target

```gherkin
Given the user is dragging a card
When the user releases the card outside any column or invalid area
Then the card returns to its original position
And no changes are made to the board
```

### Scenario 5: Drag does not open the card detail view

```gherkin
Given the user drags a card and drops it on a valid target
When the drag interaction completes
Then the card detail view is not opened
```
