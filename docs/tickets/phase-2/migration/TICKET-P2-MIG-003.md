# TICKET-P2-MIG-003: Migration Error Handling (Corrupted Data)

**Phase**: 2 -- Multi-Board
**Feature Area**: MIG (Migration)
**Priority**: P1
**Dependencies**: P2-BOARD-004, P2-BOARD-006
**Related Scenarios**: 22
**Related Feature IDs**: MIG-009

---

## Problem Statement

Phase 1 localStorage data could be corrupted (invalid JSON, missing fields, tampered data). The migration must handle these failures gracefully rather than crashing the app. Users should still be able to use the app with a fresh default board when migration fails.

---

## Goal & Success Metrics

- **Goal**: Gracefully handle corrupted Phase 1 data during migration by falling back to a default board.
- **Success looks like**: The app never crashes due to corrupted Phase 1 data. Errors are logged for debugging. Users can start fresh if their data is unrecoverable.

---

## User Story

As a user whose Phase 1 data has become corrupted,
I want the app to recover gracefully and give me a working board,
So that I am not blocked from using the app even if my old data is lost.

---

## Acceptance Criteria

### Scenario 1: Corrupted board JSON
```gherkin
Given the localStorage contains a kanban_board key with invalid/corrupted JSON
And no kanban_migrated flag exists
When the app loads
Then the migration logs an error to the console
And a fresh default board is created
And the corrupted kanban_board key is deleted from localStorage
And the kanban_migrated flag is set to true
```

### Scenario 2: Corrupted cards JSON (board is valid)
```gherkin
Given the localStorage contains a valid kanban_board key
And the kanban_cards key contains invalid/corrupted JSON
And no kanban_migrated flag exists
When the app loads
Then the migration proceeds using the valid board data
And an empty cards object is used in place of the corrupted data
And the board is migrated with 0 cards
And a warning is logged to the console
And the kanban_migrated flag is set to true
```

### Scenario 3: Board data missing required fields
```gherkin
Given the localStorage contains a kanban_board key with valid JSON but missing required fields (e.g., no title or no columns)
When the migration attempts to process it
Then the migration logs an error to the console
And falls back to creating a fresh default board
And the corrupted keys are cleaned up
And the kanban_migrated flag is set to true
```

### Scenario 4: localStorage quota exceeded during migration write
```gherkin
Given the Phase 1 data is valid
And localStorage is nearly full
When the migration attempts to write the new multi-board keys
Then the write fails with a quota error
And the old Phase 1 keys are NOT deleted (preserving the original data)
And an error is logged to the console
And on next app load, the migration will retry
```

---

## Additional Context & Notes

- **Assumptions**: Corrupted data is rare but must be handled defensively. The migration function should never throw an unhandled exception.
- **Dependencies**: TICKET-P2-MIG-001 (core migration logic), TICKET-P2-MIG-002 (default board creation).
- **Out of scope**: UI notification of migration failure. Data recovery beyond creating a default board. Partial migration of recoverable fields from corrupted data.

---

## Notes for AI Agents

- Wrap all `JSON.parse()` calls in try/catch blocks.
- Validate the parsed board object has required fields: `title` (string), `columns` (array). If validation fails, treat as corrupted.
- For cards: if `JSON.parse()` fails, use `{}` and proceed with the board data (partial migration is acceptable for cards).
- For board: if `JSON.parse()` fails or validation fails, skip migration of old data and create a default board instead.
- Wrap all `localStorage.setItem()` calls in try/catch for quota errors. If a write fails mid-migration, do NOT delete the old keys (atomic intent).
- Use `console.error()` for critical failures and `console.warn()` for recoverable issues (like missing cards).
- The migration function should be structured as: try { migrate } catch { log error, create default board, clean up }.
