# TICKET-P2-003: Migration & Fresh Install

**Priority:** P0
**PRD References:** Section 3.3 (Data Migration), Section 11.4, Section 12.2 (Testing)
**Area:** Data Migration & Initialization
**Depends On:** TICKET-P2-001, TICKET-P2-002

## Summary

Implement fresh-start migration logic that discards any Phase 1 data and initializes Phase 2 schema. Set `kanban_schema_version` flag to prevent re-migration on subsequent loads. No Phase 1 data preservation or fuzzy column matching is required.

---

## Acceptance Criteria

### AC-1: Schema Version Check on Load
```gherkin
Given the app loads for any session
When resolveInitialState() is called in BoardContext
Then it checks localStorage for "kanban_schema_version" key
And if the key is absent or has value < 2, fresh install logic is triggered
And if the key exists and equals 2, the schema is already migrated (use normal load)
```

### AC-2: Fresh Install Creates Default State
```gherkin
Given kanban_schema_version is absent or < 2
When resolveInitialState() initializes fresh
Then createDefaultState() is called to generate Phase 2 default board
And any Phase 1 keys (kanban_board, kanban_cards) are ignored (not read, not preserved)
And a fresh empty AppState is returned with:
  - 5 fixed columns (To Do, In Progress, Done, Dropped, Blocked)
  - Empty cards object
  - Empty tasks object
```

### AC-3: Schema Version Flag Set After Fresh Install
```gherkin
Given a fresh install has completed
When the board is initialized
Then saveState() writes "kanban_schema_version" = 2 to localStorage
And subsequent loads will not trigger re-initialization (AC-1)
```

### AC-4: Subsequent Loads Skip Re-initialization
```gherkin
Given kanban_schema_version = 2 exists in localStorage
And the normal board/cards/tasks data exists
When resolveInitialState() is called
Then it loads the persisted board, cards, tasks normally
And does not overwrite with fresh defaults
```

### AC-5: Graceful Handling of Corrupted Data
```gherkin
Given localStorage contains invalid/corrupted JSON
When loadState() is called during fresh install
Then the corrupted flag is detected
And the app displays a warning: "Your saved board data was corrupted. Starting fresh."
And the warning can be dismissed
And the fresh board is initialized normally
```

### AC-6: No Phase 1 Data Preservation
```gherkin
Given the app is being upgraded from Phase 1 to Phase 2
When a user with existing Phase 1 data loads the app
Then the Phase 1 data is completely discarded
And no migration of cards, columns, or tasks occurs
And the user sees a fresh empty Phase 2 board
And this behavior is acceptable because: app is pre-production, zero users, destructive upgrades expected
```

### AC-7: No TypeScript Errors
```gherkin
Given all migration logic is implemented
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- Fresh install should call createDefaultState() directly (no parameter passing needed)
- The kanban_schema_version key must be written AFTER the fresh board is initialized and saved
- Phase 1 keys (kanban_board, kanban_cards) should be explicitly ignored — do not delete them (user can refresh manually if needed)
- Corruption detection in loadState() is sufficient — no additional recovery logic needed beyond displaying a warning
- The schema version check must happen in resolveInitialState() before any data is read or restored

---

## Testing

- Unit test: Fresh install (no localStorage) creates default 5-column board
- Unit test: Fresh install sets kanban_schema_version = 2
- Unit test: Subsequent load with kanban_schema_version = 2 loads persisted data normally
- Unit test: kanban_schema_version = 1 or absent triggers fresh install
- Unit test: Corrupted Phase 1 data does not crash fresh install
- Integration test: Fresh install → add card → refresh → card persists (schema version prevents re-init)
- Integration test: Phase 1 data upgrade path (phase 1 data present, fresh install triggers, phase 1 data ignored)

---

## Files Modified

- `src/context/BoardContext.tsx` — Add kanban_schema_version check in resolveInitialState()
- `src/utils/storage.ts` — Update saveState() to write kanban_schema_version after fresh init
- `src/components/Header.tsx` or `src/App.tsx` — Show corruption warning banner (if corrupted flag detected)

## Files Created

None (migration.ts is optional for this ticket; logic is in BoardContext)

---

## Blockers

- Depends on TICKET-P2-001 (types) and TICKET-P2-002 (reducer/storage)
