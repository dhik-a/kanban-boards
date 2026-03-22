# TICKET-P2-BOARDS-002: Board Card Expand/Collapse Toggle

**Phase**: 2 -- Multi-Board
**Feature Area**: BL (Board List)
**Priority**: P1
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 3, 4
**Related Feature IDs**: BL-003, BL-004

---

## Problem Statement

Users want a quick way to see a breakdown of how cards are distributed across columns within a board, without having to navigate into the board. A collapsible detail section on the board card lets users preview the board's structure at a glance.

---

## Goal & Success Metrics

- **Goal**: Allow users to expand a board card to see column-level card counts.
- **Success looks like**: Users can toggle between collapsed (title + total count) and expanded (column names + per-column counts) views on each board card.

---

## User Story

As a Kanban user,
I want to expand a board card to see column names and their card counts,
So that I can understand the distribution of work without opening the board.

---

## Acceptance Criteria

### Scenario 1: Expand a board card
```gherkin
Given the user is on the boards list page
And a board card is in its collapsed state
When the user clicks the chevron toggle button on the card
Then the card expands to show a list of column names with per-column card counts
And the chevron icon rotates to indicate the expanded state
```

### Scenario 2: Collapse an expanded board card
```gherkin
Given a board card is in its expanded state
When the user clicks the chevron toggle button
Then the card collapses back to show only the title and total card count
And the chevron icon rotates back to its collapsed orientation
```

### Scenario 3: Expanded view shows accurate column data
```gherkin
Given a board has columns "To Do" (3 cards), "In Progress" (2 cards), "Done" (1 card)
And the board card is collapsed
When the user clicks the chevron toggle button
Then the expanded section shows "To Do - 3", "In Progress - 2", "Done - 1"
```

### Scenario 4: Board with no cards shows empty columns
```gherkin
Given a board has 3 default columns and 0 cards
When the user expands the board card
Then the expanded section shows each column name with "0" as the card count
```

### Scenario 5: Lazy-loading expanded view with error handling
```gherkin
Given the user is on the boards list page
When the user clicks the chevron to expand a board card
Then the expanded view lazily loads the full board data from localStorage
And if the board data is missing or corrupted
Then an empty columns view is displayed with a fallback message
```

---

## Additional Context & Notes

- **Assumptions**: The expanded view requires reading the full board data (`kanban_board_{id}`) to get column-level information, since `BoardMeta` only stores `totalCards`. Alternatively, column summaries can be computed when the boards list loads.
- **Dependencies**: TICKET-P2-BOARDS-001 (board card rendering).
- **Out of scope**: Persisting expand/collapse state across page reloads. Cards default to collapsed on every visit.

---

## Notes for AI Agents

- The collapsed view shows: board title, total card count, chevron icon pointing right/down.
- The expanded view adds: a list of `ColumnSummaryItem` components, each showing `column.title` and the count of `column.cardIds.length`.
- To get column data, you must read the full `Board` object from `kanban_board_{boardId}`. Consider lazy-loading this data on expand, or pre-loading it when the boards list mounts.
- The chevron icon should visually rotate (e.g., 0deg collapsed, 90deg expanded) using CSS transition.
- Each board card manages its own local expand/collapse state (not global state).
- Component hierarchy: `BoardCard` > `BoardCardCollapsed` (always visible) + `BoardCardExpanded` (conditionally rendered).
