# TICKET-P2-005: Task Components

**Priority:** P0
**PRD References:** Section 5.1 (Task Management), Section 7.2-7.3 (Components), Section 9.2-9.5 (Scenarios)
**Area:** Task UI
**Depends On:** TICKET-P2-001, TICKET-P2-002

## Summary

Build all task-related components for the Card detail modal: TaskSection (container), TaskList (render list), TaskItem (single task row with inline editing), and AddTaskForm (inline task creation). Implement inline title editing, status selection, and task deletion with confirmation.

---

## Acceptance Criteria

### AC-1: TaskSection Container
```gherkin
Given the Card detail modal is open
When the TaskSection component is rendered
Then it displays a "Tasks" section label
And below it renders TaskList (if tasks exist)
And below that renders AddTaskForm for creating new tasks
And if the card has no tasks, TaskEmptyState is shown instead
```

### AC-2: TaskList Renders Ordered Tasks
```gherkin
Given a card has 3 tasks
When TaskList renders
Then it displays all 3 tasks in creation order (oldest first)
And each task is rendered by TaskItem component
```

### AC-3: TaskItem Title Inline Edit
```gherkin
Given TaskItem displays a task with title "Draft spec"
When the user clicks on the task title
Then the title becomes an editable text input with the current value selected
And the input field has focus
When the user types "Draft technical spec" and presses Enter
Then the task's title is updated via dispatch UPDATE_TASK
And the input reverts to read-only display mode
And the updated title is shown
```

### AC-4: TaskItem Title Edit Escape to Cancel
```gherkin
Given the user is editing a task title
When the user presses Escape
Then the edit is cancelled
And the input is replaced with the original title text
And no UPDATE_TASK action is dispatched
```

### AC-5: TaskItem Title Edit Blur to Confirm
```gherkin
Given the user is editing a task title
When the user clicks outside the input (blur event)
Then the edit is confirmed
And the task title is updated
And the input reverts to read-only display
```

### AC-6: TaskItem Status Dropdown
```gherkin
Given TaskItem displays a task status
When TaskItem renders
Then a status dropdown/select is displayed
And the dropdown shows 5 options: "To Do", "In Progress", "Done", "Dropped", "Blocked"
And the current status is selected/highlighted
When the user selects a different status
Then the task status is updated immediately via dispatch UPDATE_TASK
And no confirmation dialog is required
And the dropdown updates to show the new status
```

### AC-7: TaskItem Delete Button
```gherkin
Given TaskItem displays a task
When the user clicks the delete button/icon
Then a confirmation dialog appears with message: "Delete task '[title]'? This cannot be undone."
When the user confirms deletion
Then the task is deleted via dispatch DELETE_TASK
And the task is removed from the list
And the board card's task summary updates
```

### AC-8: TaskItem Delete Confirmation Cancel
```gherkin
Given the deletion confirmation dialog is showing
When the user clicks "Cancel"
Then the dialog closes
And the task remains in the list unchanged
```

### AC-9: AddTaskForm Empty State
```gherkin
Given a card has no tasks
When TaskEmptyState is displayed
Then it shows message: "No tasks yet. Add one to break this card into steps."
And an "Add Task" button or input prompt is visible below
```

### AC-10: AddTaskForm Creates Task
```gherkin
Given the user is in AddTaskForm with an empty input
When the user types "Write unit tests"
And presses Enter
Then a new task is created with:
  - title: "Write unit tests"
  - description: "" (empty)
  - status: "todo"
And the task is added to the card via dispatch ADD_TASK
And the input field clears
And the input remains focused for rapid sequential entry
```

### AC-11: AddTaskForm Validation
```gherkin
Given the user has the AddTaskForm input focused
When the user presses Enter with an empty or whitespace-only input
Then no task is created
And the input remains visible with focus retained
```

### AC-12: AddTaskForm Title Length Limit
```gherkin
Given the user types 250 characters in the AddTaskForm input
When the user presses Enter
Then the title is truncated to 200 characters
And the task is created with the truncated title
```

### AC-13: AddTaskForm Escape to Cancel
```gherkin
Given the AddTaskForm input has focus and is empty
When the user presses Escape
Then the input is dismissed (collapsed/hidden)
And no task is created
```

### AC-14: AddTaskForm Rapid Successive Creation
```gherkin
Given the user has just created a task by pressing Enter
When the input clears and retains focus
Then the user can immediately type and press Enter to create another task
And multiple tasks can be created rapidly without clicking
```

### AC-15: Task Status Color Coding
```gherkin
Given tasks are displayed in the list
When TaskItem is rendered with different status values
Then visual indicators (color badges or text styling) distinguish status:
  - "todo" = slate color (#94a3b8)
  - "in_progress" = blue color (#3b82f6)
  - "done" = green color (#22c55e)
  - "dropped" = red color (#ef4444)
  - "blocked" = amber color (#f59e0b)
```

### AC-16: No TypeScript Errors
```gherkin
Given all task components are implemented
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- TaskSection takes `cardId` as a prop to fetch the card's tasks from context
- TaskList maps over taskIds and looks up task data from context.state.tasks
- TaskItem uses local state for inline edit mode (edit: boolean, editValue: string)
- AddTaskForm is a controlled component with local input state
- All task mutations (ADD_TASK, UPDATE_TASK, DELETE_TASK) are dispatched via BoardContext
- Confirmation dialogs use the existing ConfirmDialog component (Phase 1)
- No task description editing UI in this ticket (Phase 1 scope limitation for inline edit)

---

## Testing

- Component test: TaskItem renders task title, status, delete button
- Component test: TaskItem inline edit mode activates on title click
- Component test: TaskItem inline edit saves on Enter, cancels on Escape
- Component test: TaskItem status dropdown updates task immediately
- Component test: AddTaskForm creates task on Enter with valid title
- Component test: AddTaskForm rejects empty title
- Component test: AddTaskForm truncates title > 200 chars
- Component test: AddTaskForm dismisses on Escape (empty) or blur
- Integration test: Create task → verify appears in list → delete → verify removed

---

## Files Created

- `src/components/Task/TaskSection.tsx` (NEW)
- `src/components/Task/TaskList.tsx` (NEW)
- `src/components/Task/TaskItem.tsx` (NEW)
- `src/components/Task/AddTaskForm.tsx` (NEW)
- `src/components/Task/TaskEmptyState.tsx` (NEW)
- `src/components/Task/index.ts` (NEW)

## Files Modified

- `src/components/Card/CardDetail.tsx` — Import and add TaskSection to modal

---

## Blockers

- Depends on TICKET-P2-001 (Task type)
- Depends on TICKET-P2-002 (Reducer actions)
