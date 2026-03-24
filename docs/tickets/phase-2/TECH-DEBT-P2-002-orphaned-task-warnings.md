# TECH-DEBT-P2-002: Development-Mode Warnings for Orphaned Task IDs

**Priority:** P3
**Status:** Open
**Related Ticket:** TICKET-P2-005
**Area:** State Management / Observability
**Depends On:** TICKET-P2-005

---

## Summary

Currently, if a task ID is referenced in a card's `taskIds` array but the corresponding task does not exist in `state.tasks`, TaskList silently skips rendering it with `if (!task) return null`. While this is defensive, it makes debugging reducer bugs and race conditions difficult in development.

This ticket adds console.warn in development mode to surface orphaned task ID references.

---

## Problem Statement

**Scenario:** A reducer bug leaves a stale task ID in a card's taskIds array, but the task was never added to state.tasks.

**Current behavior:** TaskList renders only the tasks that exist, silently skipping the orphaned ID. User sees fewer tasks than expected but gets no diagnostic information.

**Desired behavior:** Developer sees a console warning in development mode: `Task {taskId} referenced in card but not found in state.tasks`, making the bug obvious.

**Why:** Orphaned IDs should never occur in normal operation (ADD_TASK and DELETE_TASK keep them in sync). If they do, it indicates a reducer bug that should be caught early.

---

## Acceptance Criteria

### AC-1: Warnings in Development Mode
```gherkin
Given a TaskList is rendered in development environment
When a task ID is referenced in card.taskIds but missing from state.tasks
Then a console.warn is logged: "Task {taskId} referenced in card but not found in state.tasks"
```

### AC-2: No Warnings in Production
```gherkin
Given the code is built for production (NODE_ENV=production)
Then no console.warn statements are executed
And there is zero performance overhead
```

### AC-3: No False Warnings on Cascade Delete
```gherkin
Given a card is deleted
When the reducer cascade-deletes all its tasks
Then no orphaned task warnings are logged
And the card is cleanly removed without warning
```

### AC-4: Optional: TaskSection Guard
```gherkin
Given TaskSection attempts to render a card that has been deleted
When the card is missing from state.cards
Then TaskSection guards with `if (!card) return null`
And optionally logs a dev-mode warning if this is unexpected
```

---

## Implementation Notes

**Location:** `src/components/Task/TaskList.tsx`

**Current code:**
```typescript
taskIds.map((taskId) => {
  const task = state.tasks[taskId];
  if (!task) return null; // <- Add warning here
  return <TaskItem key={taskId} task={task} cardId={cardId} />;
})
```

**Updated code:**
```typescript
taskIds.map((taskId) => {
  const task = state.tasks[taskId];
  if (!task) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Task "${taskId}" referenced in card but not found in state.tasks. ` +
        `This may indicate a reducer bug or state corruption.`
      );
    }
    return null;
  }
  return <TaskItem key={taskId} task={task} cardId={cardId} />;
})
```

**Optional:** Add similar guard in TaskSection around the card lookup:
```typescript
const card = state.cards[cardId];
if (!card) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Card "${cardId}" not found in state. This should not happen.`);
  }
  return null;
}
```

---

## Files Modified

- `src/components/Task/TaskList.tsx` — Add dev-mode warning for missing tasks
- `src/components/Task/TaskSection.tsx` — (Optional) Add dev-mode warning for missing cards

---

## Testing

**Manual Testing:**
1. Create a task in a card
2. Patch the reducer to leave a stale taskId in the card's taskIds array without adding the task
3. Open card detail modal
4. Verify console.warn appears in development build
5. Verify no warning in production build

**No test file needed** — This is a development-mode diagnostic utility.

---

## Acceptance Checklist

- [ ] Warnings appear in development mode when task is missing
- [ ] No warnings appear in production build
- [ ] No performance impact (tree-shaking removes warnings in prod)
- [ ] No false warnings during normal cascade delete operations
- [ ] Code passes build without errors

---

## Estimated Effort

- **Implementation:** 15 minutes
- **Testing:** 15 minutes
- **Total:** 30 minutes

---

## Risk & Mitigation

**Risk:** Console.warn output could clutter dev logs if there are unrelated state issues.

**Mitigation:** Include a clear message explaining that this indicates a reducer bug. If warnings appear frequently, the root cause should be investigated in the reducer, not suppressed here.

---

## Related Tickets

- TICKET-P2-005: Task Components (implementation)
- TICKET-P2-002: Reducer & Storage (state management)
