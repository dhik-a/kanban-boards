# TICKET-P2-001: Types & Default State

**Priority:** P0
**PRD References:** Section 4 (Data Model), Section 11.1, Section 11.3
**Area:** Foundation / Types & Defaults
**Depends On:** None

## Summary

Add Phase 2 data model types (`Task`, `TaskStatus`), update `Card` and `Column` interfaces with task-related fields, extend `AppState` to include tasks, and update default state generation to produce 5 fixed columns with empty task storage.

---

## Acceptance Criteria

### AC-1: Task Type Defined
```gherkin
Given the Task type is needed for Phase 2
When src/types/index.ts is reviewed
Then the following interface is defined:
  - Task with fields: id, title, description, status, createdAt, updatedAt
  - title: string (required, max 200 chars)
  - description: string (optional, max 1000 chars)
  - status: TaskStatus (required, defaults to "todo")
  - createdAt & updatedAt: ISO 8601 strings
```

### AC-2: TaskStatus Union Type
```gherkin
Given task statuses must align with the 5-column board structure
When TaskStatus union is defined
Then TaskStatus = "todo" | "in_progress" | "done" | "dropped" | "blocked"
```

### AC-3: Card Interface Updated
```gherkin
Given cards must reference their tasks
When Card interface is updated
Then the following field is added:
  - taskIds: string[] (ordered list of task IDs, defaults to [])
And all existing Card fields remain unchanged
```

### AC-4: Column Interface Updated
```gherkin
Given columns are now fixed in Phase 2
When Column interface is updated
Then the following field is added:
  - isFixed: boolean (set to true for all phase 2 columns)
And all existing Column fields remain unchanged
```

### AC-5: AppState Extended
```gherkin
Given AppState must store tasks
When AppState interface is updated
Then the following field is added:
  - tasks: Record<string, Task> (normalized task storage by ID)
And board and cards fields remain unchanged
```

### AC-6: Action Union Updated
```gherkin
Given Phase 2 introduces new task mutations
When Action union type is reviewed
Then the following new actions are added:
  | { type: "ADD_TASK"; payload: { cardId: string; task: Task } }
  | { type: "UPDATE_TASK"; payload: { id: string; cardId: string; updates: Partial<Omit<Task, "id" | "createdAt">> } }
  | { type: "DELETE_TASK"; payload: { taskId: string; cardId: string } }
And column mutation actions (ADD_COLUMN, DELETE_COLUMN, REORDER_COLUMNS) are removed or marked deprecated
```

### AC-7: Default State Creates 5 Fixed Columns
```gherkin
Given createDefaultState() is called (fresh install)
When the function returns
Then the returned AppState.board contains exactly 5 columns with:
  1. "To Do" — color #94a3b8, isFixed: true
  2. "In Progress" — color #3b82f6, isFixed: true
  3. "Done" — color #22c55e, isFixed: true
  4. "Dropped" — color #ef4444, isFixed: true
  5. "Blocked" — color #f59e0b, isFixed: true
And all columns have empty cardIds arrays
And the board title is "My Kanban Board"
```

### AC-8: Default State Initializes Empty Tasks
```gherkin
Given createDefaultState() is called
When the function returns
Then AppState.tasks = {} (empty object)
And each Card has taskIds: [] (empty array)
```

### AC-9: No TypeScript Errors
```gherkin
Given all changes are made to src/types/index.ts and src/utils/defaults.ts
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- Update `src/types/index.ts` with Task, TaskStatus, modified Card, Column, AppState, and Action types
- Update `src/utils/defaults.ts` createDefaultState() to return 5 fixed columns and empty tasks map
- Ensure all new types export properly for use in context and components
- The isFixed field is a structural field (boolean true) — it controls whether the Column can be mutated in the UI

---

## Testing

- Unit test: Task interface conforms to constraints (title max 200, description max 1000)
- Unit test: TaskStatus union includes all 5 statuses
- Unit test: createDefaultState() produces correct column order and colors
- Unit test: createDefaultState() produces empty tasks object
- Build test: `npm run build` passes with no TS errors

---

## Files Modified

- `src/types/index.ts` — Add Task, TaskStatus, update Card/Column/AppState/Action
- `src/utils/defaults.ts` — Update createDefaultState() for 5 fixed columns, empty tasks

## Files Created

None

---

## Blockers

None. This is the foundational ticket for Phase 2.
