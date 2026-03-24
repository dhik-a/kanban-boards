# TECH-DEBT-P2-001: Unit & Integration Tests for Task Components

**Priority:** P2
**Status:** Open
**Related Ticket:** TICKET-P2-005
**Area:** Task Components / Testing
**Depends On:** TICKET-P2-005

---

## Summary

Task components (TaskItem, TaskList, AddTaskForm, TaskSection) currently have zero automated test coverage. TICKET-P2-005 implementation notes explicitly list 8+ test scenarios, but none are implemented. This creates risk of regressions in core CRUD and keyboard interaction flows.

---

## Problem Statement

- Task creation, editing, deletion flows are untested
- No regression coverage for keyboard interactions (Escape, Enter, Tab)
- Edge cases (empty title, >200 char truncation, whitespace-only input) cannot be validated automatically
- State mutations (inline edit, status change, delete confirmation) lack verification
- Accessibility features (aria labels, keyboard nav) unverified by tests

**Risk:** Future PRs may inadvertently break task management without detection by CI/CD.

---

## Acceptance Criteria

### AC-1: TaskItem Tests
```gherkin
Given TaskItem is rendered with a task
When the user clicks on the task title
Then edit mode activates and input has focus
And pressing Enter saves the title
And pressing Escape cancels without saving
And blur event also saves the title
And status dropdown updates the task immediately
And delete button opens confirmation dialog
And confirming deletion dispatches DELETE_TASK
```

### AC-2: AddTaskForm Tests
```gherkin
Given AddTaskForm is rendered
When the user types a task title and presses Enter
Then ADD_TASK is dispatched with the correct task object
And the input clears and retains focus
When the user presses Enter with empty input
Then no task is created
And the input remains focused
When the user types >200 characters
Then the title is truncated to 200 chars on create
When the input is empty and user presses Escape
Then the form collapses
When the input has content and user presses Escape
Then the input clears but form stays open
```

### AC-3: TaskList Tests
```gherkin
Given TaskList is rendered with taskIds
When the tasks exist in state.tasks
Then all tasks are rendered as TaskItem in order
When a task ID is missing from state
Then that task is skipped (guard returns null)
```

### AC-4: TaskSection Tests
```gherkin
Given TaskSection is rendered for a card with no tasks
Then TaskEmptyState is displayed
When the card has tasks
Then TaskList is rendered with ordered tasks
And AddTaskForm is always shown below
```

### AC-5: Test Coverage
```gherkin
Given all test files are implemented
When coverage is run
Then task components have ≥80% line coverage
```

---

## Testing Strategy

**Framework:** Vitest + React Testing Library (existing project setup)

**Test Files to Create:**
1. `src/components/Task/TaskItem.test.tsx` (~150 lines)
2. `src/components/Task/AddTaskForm.test.tsx` (~150 lines)
3. `src/components/Task/TaskList.test.tsx` (~80 lines)
4. `src/components/Task/TaskSection.test.tsx` (~100 lines)

**Test Patterns:**
- Render with mock BoardContext provider
- Mock dispatch and verify action payloads
- Use userEvent for keyboard interactions
- Test both light and dark mode (if applicable)
- Cover all AC scenarios from TICKET-P2-005

---

## Implementation Notes

- All tests must mock BoardContext and inject a test dispatch function
- Use `screen.getByRole()` for accessibility compliance (ensures aria labels are present)
- Test Escape/Enter behavior explicitly in both components
- Verify focus management with `document.activeElement`
- Test edge cases: empty strings, whitespace, long titles, special characters

---

## Files Modified

- Create `src/components/Task/TaskItem.test.tsx`
- Create `src/components/Task/AddTaskForm.test.tsx`
- Create `src/components/Task/TaskList.test.tsx`
- Create `src/components/Task/TaskSection.test.tsx`

---

## Acceptance Checklist

- [ ] All TaskItem interactions tested (edit, status, delete, confirmation)
- [ ] All AddTaskForm behaviors tested (create, validation, escape, focus)
- [ ] TaskList rendering and guards tested
- [ ] TaskSection empty state and composition tested
- [ ] Coverage report shows ≥80% for Task components
- [ ] All tests pass locally: `npm run test`
- [ ] No console warnings or errors in test output

---

## Estimated Effort

- **Analysis:** 30 minutes
- **Implementation:** 2-3 hours
- **Review & refinement:** 1 hour
- **Total:** 3.5-4 hours

---

## Related Tickets

- TICKET-P2-005: Task Components (implementation)
- TICKET-P2-006: Task Summary & Progress
- TICKET-P2-008: Polish & Integration
