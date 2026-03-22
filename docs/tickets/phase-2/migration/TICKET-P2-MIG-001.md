# TICKET-P2-MIG-001: Phase 1 Data Auto-Migration

**Phase**: 2 -- Multi-Board
**Feature Area**: MIG (Migration)
**Priority**: P0
**Dependencies**: P2-BOARD-004, P2-BOARD-006
**Related Scenarios**: 19, 21
**Related Feature IDs**: MIG-001, MIG-002, MIG-003, MIG-004, MIG-005, MIG-006, MIG-008

---

## Problem Statement

Existing Phase 1 users have board and card data stored under the old single-board localStorage keys (`kanban_board` and `kanban_cards`). When they upgrade to Phase 2, this data must be automatically migrated into the new multi-board schema with zero data loss. Without migration, existing users would lose all their work.

---

## Goal & Success Metrics

- **Goal**: Automatically migrate Phase 1 data into the Phase 2 multi-board schema on first app load.
- **Success looks like**: 100% of Phase 1 data is preserved. Migration executes in under 100ms. Users see their existing board on the boards list with all data intact.

---

## User Story

As an existing Phase 1 user upgrading to Phase 2,
I want my board and card data to be automatically migrated,
So that I do not lose any work and can immediately use the new multi-board features.

---

## Acceptance Criteria

### Scenario 1: Phase 1 data auto-migrated on first load
```gherkin
Given the user has Phase 1 data in localStorage (kanban_board and kanban_cards keys)
And no kanban_migrated flag exists
When the app loads
Then the Phase 1 board is migrated as the first board in the new multi-board schema
And a kanban_boards index entry is created with the correct title and card count
And kanban_board_{id} and kanban_cards_{id} keys are created with the original data
And the old kanban_board and kanban_cards keys are deleted
And the kanban_migrated flag is set to true
And the user sees their existing board on the boards list page with all data intact
```

### Scenario 2: Migration preserves all data fields
```gherkin
Given the Phase 1 board has title "My Board", 3 columns with specific ordering, and 7 cards with priorities, labels, and descriptions
When the migration runs
Then the migrated board retains the exact title "My Board"
And all 3 columns are preserved in their original order
And all 7 cards are preserved with their original priorities, labels, descriptions, and timestamps
And the card-to-column assignments remain identical
```

### Scenario 3: Migration does not re-run
```gherkin
Given the kanban_migrated flag is set to true in localStorage
And the old kanban_board key does not exist
When the app loads
Then no migration logic executes
And the app loads the multi-board data from kanban_boards as normal
```

### Scenario 4: Migration reuses existing board ID
```gherkin
Given the Phase 1 board has an existing ID field
When the migration runs
Then the new multi-board entry uses that same ID
And the localStorage keys are kanban_board_{existingId} and kanban_cards_{existingId}
```

### Scenario 5: Migration handles board without ID
```gherkin
Given the Phase 1 board data does not have an ID field
When the migration runs
Then a new UUID is generated for the board
And the migration completes successfully using the generated ID
```

---

## Additional Context & Notes

- **Current workaround**: None. Without migration, Phase 1 users would see an empty boards list after upgrading.
- **Assumptions**: Migration runs synchronously before the React tree renders, so users never see a flash of empty state.
- **Dependencies**: None (this runs before any UI code).
- **Out of scope**: UI notification of migration success. The migration is silent -- users simply see their data in the new format.

---

## Notes for AI Agents

- Create `utils/migration.ts` with a synchronous migration function.
- Create `hooks/useMigration.ts` that calls the migration function on app initialization.
- Migration steps (in order):
  1. Read `kanban_migrated` from localStorage. If `true`, return early.
  2. Read `kanban_board` from localStorage. If absent, go to fresh install logic (separate ticket).
  3. Parse the JSON. If parse fails, go to error handling (separate ticket).
  4. Read and parse `kanban_cards`. If absent or fails, use `{}`.
  5. Determine board ID: reuse `parsedBoard.id` if it exists, otherwise generate UUID.
  6. Compute `totalCards = Object.keys(parsedCards).length`.
  7. Write `kanban_boards` = `[{ id, title: parsedBoard.title, totalCards, createdAt: parsedBoard.createdAt || now, updatedAt: parsedBoard.updatedAt || now }]`.
  8. Write `kanban_board_{id}` = `parsedBoard` (ensure `id` field is set).
  9. Write `kanban_cards_{id}` = `parsedCards`.
  10. Delete `kanban_board` and `kanban_cards`.
  11. Write `kanban_migrated` = `true`.
- The migration must run before the React tree renders. Consider calling it in `App.tsx` initialization or as a top-level call in `main.tsx`.
- All localStorage operations should use try/catch for quota errors.
