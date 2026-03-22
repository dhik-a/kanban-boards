# TICKET-P2-MIG-002: Fresh Install Default Board

**Phase**: 2 -- Multi-Board
**Feature Area**: MIG (Migration)
**Priority**: P0
**Dependencies**: P2-BOARD-004, P2-BOARD-006
**Related Scenarios**: 20
**Related Feature IDs**: MIG-007

---

## Problem Statement

When a brand-new user opens the app for the first time (no Phase 1 data, no Phase 2 data), they should not see an empty boards list. A default board must be created automatically so that the user has an immediate starting point.

---

## Goal & Success Metrics

- **Goal**: Automatically create a default board when no existing data is found.
- **Success looks like**: First-time users see a single board ("My Board") with 3 default columns, ready to use.

---

## User Story

As a new user opening the app for the first time,
I want to see a default board already created for me,
So that I can start using the app immediately without setup.

---

## Acceptance Criteria

### Scenario 1: Fresh install creates default board
```gherkin
Given no localStorage data exists for the app (no Phase 1 keys and no Phase 2 keys)
When the app loads
Then a default board is created with title "My Board" (not "My Kanban Board")
And the board has 3 default columns: "To Do", "In Progress", "Done"
And the board has 0 cards
And the kanban_boards index contains one entry for this board
And the kanban_migrated flag is set to true
And the user sees the boards list page with one board card
```

### Scenario 2: Default board not created if multi-board data already exists
```gherkin
Given kanban_boards exists in localStorage with at least one board entry
And kanban_migrated is true
When the app loads
Then no default board is created
And the existing boards are loaded normally
```

### Scenario 3: Default board structure is valid
```gherkin
Given the app creates a default board on fresh install
When the user clicks on the default board card
Then the board page loads with 3 empty columns
And columns are titled "To Do", "In Progress", "Done"
And all Phase 1 functionality works within this board
```

---

## Additional Context & Notes

- **Assumptions**: The default board name "My Board" is hard-coded. Default columns match the same defaults used for new board creation (BM-002).
- **Dependencies**: TICKET-P2-MIG-001 (this is Step 6 of the migration flow).
- **Out of scope**: Onboarding tutorial, sample data in the default board.

---

## Notes for AI Agents

- This logic is part of the migration flow (Step 6 in `utils/migration.ts`).
- Trigger condition: `kanban_migrated` is absent AND `kanban_board` is absent AND `kanban_boards` is absent or empty.
- Create a `createDefaultBoard()` utility function in `utils/defaults.ts` that returns a `Board` and `BoardMeta` with:
  - UUID as ID
  - Title: "My Board"
  - 3 columns with UUIDs: "To Do", "In Progress", "Done", each with empty `cardIds`
  - `createdAt` and `updatedAt` set to current ISO 8601 timestamp
  - `totalCards: 0`
- Write to localStorage: `kanban_boards`, `kanban_board_{id}`, `kanban_cards_{id}` (empty `{}`), and `kanban_migrated = true`.
- Reuse the same default column factory used by board creation (TICKET-P2-BOARDS-003) to keep defaults consistent.
