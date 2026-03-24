# TICKET-P2-002: Reducer & Storage

**Priority:** P0
**PRD References:** Section 6.1-6.2 (Actions), Section 6.4 (Persistence), Section 11.7 (localStorage Keys)
**Area:** State Management & Persistence
**Depends On:** TICKET-P2-001

## Summary

Implement task action handlers in the board reducer (ADD_TASK, UPDATE_TASK, DELETE_TASK), modify DELETE_CARD to cascade-delete tasks, update storage utilities to persist tasks, and extend BoardContext to handle the new state shape.

---

## Acceptance Criteria

### AC-1: ADD_TASK Reducer Case
```gherkin
Given a user adds a task to a card
When the boardReducer receives { type: "ADD_TASK", payload: { cardId: string, task: Task } }
Then the task is added to state.tasks[task.id]
And task.id is appended to state.cards[cardId].taskIds
And state.cards[cardId].updatedAt is updated to current timestamp
And state.board.updatedAt is updated to current timestamp
And if cardId does not exist, the action is a no-op (return state unchanged)
```

### AC-2: UPDATE_TASK Reducer Case
```gherkin
Given a user updates a task
When the boardReducer receives { type: "UPDATE_TASK", payload: { id, cardId, updates } }
Then the updates are merged into state.tasks[id] (shallow merge)
And state.tasks[id].updatedAt is set to current timestamp
And state.cards[cardId].updatedAt is updated to current timestamp
And state.board.updatedAt is updated to current timestamp
And if taskId does not exist in state.tasks, the action is a no-op
```

### AC-3: DELETE_TASK Reducer Case
```gherkin
Given a user deletes a task
When the boardReducer receives { type: "DELETE_TASK", payload: { taskId, cardId } }
Then taskId is removed from state.cards[cardId].taskIds
And state.tasks[taskId] is deleted
And state.cards[cardId].updatedAt is updated to current timestamp
And state.board.updatedAt is updated to current timestamp
And if taskId does not exist, the action is a no-op
```

### AC-4: DELETE_CARD Cascades Task Deletion
```gherkin
Given a card with 3 tasks is being deleted
When the boardReducer receives { type: "DELETE_CARD", payload: { id: cardId, columnId } }
Then all task IDs in state.cards[cardId].taskIds are deleted from state.tasks
And the card is removed from the column
And no orphaned tasks remain in state.tasks
```

### AC-5: localStorage Tasks Key Added
```gherkin
Given the app must persist tasks
When storage.ts is updated
Then a new localStorage key "kanban_tasks" stores Record<string, Task>
And tasks are serialized/deserialized alongside board and cards
And the kanban_tasks key is read/written as part of saveState/loadState
```

### AC-6: saveState Persists Tasks
```gherkin
Given AppState.tasks is modified
When saveState(state) is called
Then JSON.stringify(state.tasks) is written to "kanban_tasks" key
And saveState returns null on success or an error message on failure
```

### AC-7: loadState Restores Tasks
```gherkin
Given kanban_tasks is stored in localStorage
When loadState() is called
Then the returned state includes tasks: Record<string, Task>
And minimal shape validation confirms tasks is an object (not null, array, or primitive)
And on JSON.parse error, corrupted flag is returned
```

### AC-8: BoardContext Updates resolveInitialState
```gherkin
Given AppState now includes tasks
When BoardContext.tsx resolveInitialState() is called
Then the resolved state includes tasks from loadState()
And if loadState fails, default state includes tasks: {}
And no TypeScript errors occur
```

### AC-9: useDebouncedSave Persists Task Changes
```gherkin
Given useDebouncedSave watches AppState (now including tasks)
When state.tasks changes
Then the debounced save triggers after 300ms
And the new tasks are persisted to localStorage
And on save failure, the error callback is invoked with an error message
```

### AC-10: No TypeScript Errors
```gherkin
Given all reducer and storage changes are complete
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- In boardReducer, all task actions must update board.updatedAt (not just column.updatedAt)
- DELETE_CARD must iterate over the card's taskIds before removing the card
- The UPDATE_TASK action includes cardId in payload for efficient parent lookups (do not remove tasks by ID without cardId)
- saveState and loadState may fail if localStorage is full or unavailable — return error messages, do not throw
- The tasks object is normalized (flat, keyed by ID) — do not denormalize into Cards

---

## Testing

- Unit test: ADD_TASK correctly appends task ID to card.taskIds and updates timestamps
- Unit test: UPDATE_TASK merges updates and updates timestamps
- Unit test: DELETE_TASK removes task from both taskIds array and tasks object
- Unit test: DELETE_CARD cascades task deletion (all related tasks removed)
- Unit test: saveState serializes tasks to kanban_tasks key
- Unit test: loadState deserializes tasks from kanban_tasks key
- Unit test: Corrupted kanban_tasks is caught on load
- Integration test: Full round-trip (add task → save → refresh → restore)

---

## Files Modified

- `src/context/BoardContext.tsx` — Update reducer cases, modify resolveInitialState, handle tasks in state
- `src/utils/storage.ts` — Add kanban_tasks to saveState/loadState, handle tasks serialization

## Files Created

None

---

## Blockers

- Depends on TICKET-P2-001 (types defined)
