# TICKET-P2-BOARD-002: Search and Filter Scoped to Active Board

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV (Navigation) / Within-Board
**Priority**: P0
**Dependencies**: P2-BOARD-001
**Related Scenarios**: 23
**Related Feature IDs**: NAV-010

---

## Problem Statement

In Phase 2, search and filter must remain scoped to the currently active board. Users should only see results from the board they are viewing, not from other boards. This is a behavioral requirement -- the search and filter UI is unchanged from Phase 1, but the scoping must be explicit now that multiple boards exist.

---

## Goal & Success Metrics

- **Goal**: Ensure search and filter operations only query cards within the active board.
- **Success looks like**: Searching for a term on Board A never returns results from Board B. Filter state resets when switching boards.

---

## User Story

As a Kanban user searching for cards,
I want search results to only show cards from the board I am currently viewing,
So that I am not confused by results from other boards.

---

## Acceptance Criteria

### Scenario 1: Search scoped to current board
```gherkin
Given the user is viewing Board A which contains a card titled "Fix login bug"
And Board B contains a card titled "Fix payment bug"
When the user types "Fix" in the search bar
Then only "Fix login bug" from Board A is shown in the results
And cards from Board B are not searched or displayed
```

### Scenario 2: Filter scoped to current board
```gherkin
Given the user is viewing Board A which has 2 high-priority cards and 1 low-priority card
And Board B has 5 high-priority cards
When the user filters by "high" priority
Then only the 2 high-priority cards from Board A are displayed
And Board B's cards are not included
```

### Scenario 3: Search state resets between boards
```gherkin
Given the user is viewing Board A with search term "bug" active
When the user navigates to the boards list and then into Board B
Then the search bar on Board B is empty
And all of Board B's cards are visible (no filter applied)
```

---

## Additional Context & Notes

- **Assumptions**: Since `FilterContext` is scoped inside `BoardPage`, filter state naturally resets when the component unmounts and remounts for a different board.
- **Dependencies**: TICKET-P2-BOARD-001 (board-scoped state).
- **Out of scope**: Cross-board search (explicitly out of scope per PRD).

---

## Notes for AI Agents

- No changes to the search/filter logic itself are needed. The scoping is achieved architecturally by mounting `FilterContext` inside `BoardPage`.
- When `BoardPage` unmounts (user navigates away), the `FilterContext` state is destroyed. When `BoardPage` mounts for a new board, `FilterContext` initializes with default (empty) state.
- The `cards` used by search/filter come from `BoardContext`, which only contains cards for the active board. This naturally prevents cross-board search.
- Verify that `FilterContext` does not persist filter state to localStorage. If it does in Phase 1, that behavior should be removed or scoped per board.
