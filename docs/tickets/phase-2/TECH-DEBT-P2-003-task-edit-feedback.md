# TECH-DEBT-P2-003: TaskItem Empty Edit Feedback

**Priority:** P3
**Status:** Open
**Related Ticket:** TICKET-P2-005
**Area:** Task Components / UX Polish
**Depends On:** TICKET-P2-005

---

## Summary

When a user enters inline edit mode on a TaskItem, clears the entire title, and presses Enter, the change silently reverts to the original title with no visual or audible feedback. This creates confusion: did my input work? Is the task broken?

This ticket explores three approaches to provide better feedback:
1. **Toast notification** — brief message appears when user tries to save empty title
2. **Disabled Enter** — prevent Enter key when input is empty (most effective)
3. **Keep silent revert** — current behavior (simplest, matches AddTaskForm)

---

## Problem Statement

**Current behavior:**
1. User clicks task title to edit: "Implement API"
2. User selects all and deletes text (input now empty)
3. User presses Enter, expecting to save
4. Title silently reverts to "Implement API" with no feedback
5. User is confused: "Did something happen? Is the field broken?"

**Desired behavior:**
The user should receive clear feedback that:
- Empty task titles are not allowed
- The original title is unchanged
- They can try again or press Escape to cancel

---

## Solution Options

### Option A: Toast Notification (Recommended)
```typescript
const commitEdit = () => {
  const trimmed = editValue.trim();
  if (trimmed && trimmed !== task.title) {
    dispatch({...});
  } else if (!trimmed) {
    setEditValue(task.title);
    // Show brief toast: "Task title cannot be empty"
    addToast("Task title cannot be empty", "warning");
  }
  setIsEditing(false);
};
```

**Pros:** Clear feedback, matches application patterns, respects user's edit work (shows error, doesn't auto-dismiss)
**Cons:** Requires injecting ToastContext

---

### Option B: Disable Enter When Empty (Best UX)
```typescript
const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    if (!editValue.trim()) {
      e.preventDefault();
      return; // silently prevent, user gets no feedback but knows Enter didn't work
    }
    e.preventDefault();
    commitEdit();
  } else if (e.key === "Escape") {
    e.preventDefault();
    cancelEdit();
  }
};
```

**Pros:** Proactive UX (prevents invalid state), no extra component injection, matches web form conventions
**Cons:** Silent prevention (user must infer meaning)

---

### Option C: Keep Silent Revert (Current)
No changes. Matches AddTaskForm's behavior of silently rejecting empty input on Enter.

**Pros:** Simplest, consistent with AddTaskForm
**Cons:** No feedback, potential user confusion

---

## Recommendation

**Implement Option B (Disable Enter) as first choice**, falling back to Option C (silent revert) if UI tooling doesn't support it well.

**Rationale:**
- Most consistent with form UX conventions (native HTML forms prevent invalid submission)
- No additional complexity or component injection
- Users quickly learn that empty input + Enter = no-op
- If this proves confusing in user testing, elevate to Option A (toast notification)

---

## Acceptance Criteria

### AC-1: Empty Input Handling (Option B)
```gherkin
Given TaskItem is in edit mode with empty input
When the user presses Enter
Then the Enter key is ignored (preventDefault)
And the input stays in edit mode
And no UPDATE_TASK is dispatched
```

### AC-2: Non-Empty Valid Input Still Works
```gherkin
Given TaskItem is in edit mode with "New title"
When the user presses Enter
Then UPDATE_TASK is dispatched
And the task title is updated
And edit mode exits
```

### AC-3: Escape Still Works
```gherkin
Given TaskItem is in edit mode with any input
When the user presses Escape
Then edit mode is cancelled
And the original title is shown
And no UPDATE_TASK is dispatched
```

### AC-4: Consistency with AddTaskForm
```gherkin
Given both AddTaskForm and TaskItem are in use
When the user attempts to save empty content
Then both components behave consistently
```

---

## Alternative: Toast Notification (Option A)

If Option B is not sufficient:

### AC-5: Toast on Empty Submit
```gherkin
Given TaskItem is in edit mode with empty input
When the user presses Enter
Then a toast notification appears: "Task title cannot be empty"
And the input reverts to read-only with the original title
And no UPDATE_TASK is dispatched
```

### AC-6: Toast Dismissal
```gherkin
Given a toast notification is showing
When the user closes it or waits for auto-dismiss
Then the toast disappears
```

---

## Implementation Notes

**Location:** `src/components/Task/TaskItem.tsx:131-139`

**Option B implementation:**
```typescript
const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    if (!editValue.trim()) {
      // Silently ignore Enter if input is empty
      e.preventDefault();
      return;
    }
    e.preventDefault();
    commitEdit();
  } else if (e.key === "Escape") {
    e.preventDefault();
    cancelEdit();
  }
};
```

**Option A implementation:**
```typescript
const commitEdit = () => {
  const trimmed = editValue.trim();
  if (trimmed && trimmed !== task.title) {
    dispatch({...});
  } else if (!trimmed) {
    setEditValue(task.title);
    // Inject ToastContext and show warning
    addToast("Task title cannot be empty", "warning");
  }
  setIsEditing(false);
};
```

---

## Files Modified

- `src/components/Task/TaskItem.tsx` — Update `handleTitleKeyDown()` (Option B) or `commitEdit()` (Option A)

---

## Testing

**Manual:**
1. Open a card detail
2. Click to edit a task title
3. Clear the entire input
4. Press Enter → verify no change, input still in edit mode
5. Type a new title and press Enter → verify it saves
6. Click to edit again, press Escape → verify revert without warning

**Automated:** Add to TaskItem test suite:
- Test that empty input + Enter = no dispatch
- Test that non-empty input + Enter = dispatch + save

---

## Acceptance Checklist (Choose One)

### Option B (Disable Enter)
- [ ] Empty input prevents Enter submission
- [ ] Valid input still saves on Enter
- [ ] Escape still cancels
- [ ] Behavior is consistent with standard form UX
- [ ] No additional component injection

### Option A (Toast Notification)
- [ ] Empty input submission shows warning toast
- [ ] Toast message is clear: "Task title cannot be empty"
- [ ] Toast auto-dismisses or can be closed
- [ ] Original title is shown after warning
- [ ] No additional reducer or context modifications

---

## Estimated Effort

- **Option B:** 15 minutes (add preventDefault guard)
- **Option A:** 30 minutes (inject ToastContext, add logic)
- **Option C:** 0 minutes (no change)

---

## Related Tickets

- TICKET-P2-005: Task Components (implementation)
- TICKET-P2-006: Task Summary & Progress
- TICKET-P2-008: Polish & Integration (candidate for inclusion)

---

## Future Considerations

If user testing reveals that the chosen approach causes confusion, consider:
- Add visual feedback (error styling, red border) when input is empty in edit mode
- Show a tooltip on hover: "Title cannot be empty"
- Sync this behavior with AddTaskForm for complete consistency
