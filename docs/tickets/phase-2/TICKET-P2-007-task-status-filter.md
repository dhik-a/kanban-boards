# TICKET-P2-007: Task Status Filter

**Priority:** P0
**PRD References:** Section 5.3 (Task Status Filter), Section 6.3 (Filter State Extension), Section 7.2-7.3, Section 9.6 (Scenarios)
**Area:** Filtering & Search
**Depends On:** TICKET-P2-001, TICKET-P2-002, TICKET-P2-005

## Summary

Add task status filtering to FilterContext, build TaskStatusFilter checkbox component, implement filter logic to show/hide cards based on task status matches, and integrate filter with existing search and priority filters using AND/OR logic as specified.

---

## Acceptance Criteria

### AC-1: FilterContext Extended with Task Status Filter
```gherkin
Given FilterContext manages all board filters
When FilterContext is updated for Phase 2
Then it includes:
  - taskStatusFilter: Set<TaskStatus> (empty by default, means no filter active)
  - toggleTaskStatusFilter(status: TaskStatus) function
And toggleTaskStatusFilter adds status if absent, removes if present
And isFiltering returns true when taskStatusFilter.size > 0
And clearFilters() resets taskStatusFilter to empty set
```

### AC-2: TaskStatusFilter Component Renders Checkboxes
```gherkin
Given the filter controls area is displayed
When TaskStatusFilter component is rendered
Then 5 checkboxes are displayed, one per status:
  - To Do
  - In Progress
  - Done
  - Dropped
  - Blocked
And all checkboxes are unchecked by default (no filter active)
```

### AC-3: TaskStatusFilter Checkbox Behavior
```gherkin
Given TaskStatusFilter is displayed
When the user clicks a checkbox (e.g., "Blocked")
Then toggleTaskStatusFilter("blocked") is called
And the checkbox becomes checked
And the board filters immediately to show only Cards with at least one blocked task
```

### AC-4: TaskStatusFilter Uncheck Behavior
```gherkin
Given a task status checkbox is checked (e.g., "In Progress")
When the user clicks it again
Then toggleTaskStatusFilter("in_progress") is called
And the checkbox becomes unchecked
And the filter is removed if no other statuses are checked
And the board displays all matching cards (based on remaining filters)
```

### AC-5: Filter Logic OR Among Statuses
```gherkin
Given the board has 3 cards:
  - Card A: 1 task with status "blocked"
  - Card B: 1 task with status "in_progress"
  - Card C: 1 task with status "done"
When the user checks both "Blocked" and "In Progress"
Then Cards A and B are visible (have matching tasks)
And Card C is hidden (no matching tasks)
And filter logic is: (card has task with "blocked") OR (card has task with "in_progress")
```

### AC-6: Filter Logic AND with Search Query
```gherkin
Given the board has 3 cards:
  - Card "API Integration": 1 task "blocked"
  - Card "API Testing": 1 task "done"
  - Card "UI Polish": 1 task "blocked"
When the user types "API" in search
And checks "Blocked" filter
Then only Card "API Integration" is visible
And Card "API Testing" is hidden (does not match "blocked")
And Card "UI Polish" is hidden (does not match "API" search)
And filter logic is: (title contains "API") AND (has blocked task)
```

### AC-7: Zero Tasks Hidden When Filter Active
```gherkin
Given the board has 2 cards:
  - Card A: 1 task ("todo")
  - Card B: 0 tasks (empty)
When the user checks any task status filter
Then Card B is always hidden (no tasks to filter by)
And Card A is shown if it has a matching task
```

### AC-8: Clear All Filters Resets Status Checkboxes
```gherkin
Given the user has checked "Blocked" and "In Progress" filters
And has typed "API" in search
When the user clicks "Clear all filters"
Then all task status checkboxes become unchecked
And taskStatusFilter becomes empty set
And search bar is cleared
And all cards are visible again
```

### AC-9: Drag-and-Drop Disabled During Filter
```gherkin
Given the board has any task status filter active
When a user attempts to drag a card
Then the drag operation does not initiate
And cards are not draggable
And a visual indication shows that DnD is disabled (e.g., cursor change, opacity change)
```

### AC-10: No Matching Cards State
```gherkin
Given the user has checked "Blocked" filter
And no cards on the board have blocked tasks
When the board is rendered
Then each column displays an empty state
And a message "No matching cards" is visible
```

### AC-11: Filter State Persistence (Optional P1)
```gherkin
Given the user has set task status filters
When the user closes and reopens the app
Then filter state MAY be preserved (nice-to-have, not required for MVP)
```

### AC-12: No TypeScript Errors
```gherkin
Given all filter components and logic are implemented
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- TaskStatusFilter is a controlled component that reads checked state from `filterContext.taskStatusFilter.has(status)`
- Card visibility logic checks: `taskStatusFilter.size === 0 OR card.taskIds.some(id => taskStatusFilter.has(state.tasks[id].status))`
- Cards with `taskIds.length === 0` are hidden when any filter is active
- DnD is disabled when `filterContext.isFiltering` is true (add condition to dnd-kit's draggable handler)
- Filter checkboxes are placed in the FilterControls header area, alongside SearchBar and PriorityFilter

---

## Testing

- Unit test: toggleTaskStatusFilter adds/removes status from set
- Unit test: isFiltering returns true only when taskStatusFilter.size > 0
- Unit test: clearFilters resets taskStatusFilter to empty set
- Component test: TaskStatusFilter renders 5 checkboxes, unchecked initially
- Component test: Checking checkbox calls toggleTaskStatusFilter
- Component test: Unchecking checkbox removes from filter
- Filter logic test: Single status filter shows cards with that status
- Filter logic test: Multiple status filter (OR logic) shows cards with any status
- Filter logic test: Task status + search filter (AND logic) correctly combines
- Filter logic test: Cards with zero tasks hidden when filter active
- Integration test: Check "Blocked" → board shows only blocked cards → uncheck → all cards return
- Integration test: Filter + search together (e.g., "API" + "Blocked")

---

## Files Created

- `src/components/Header/TaskStatusFilter.tsx` (NEW)

## Files Modified

- `src/context/FilterContext.tsx` — Add taskStatusFilter state and toggleTaskStatusFilter function
- `src/components/Header/FilterControls.tsx` — Add TaskStatusFilter component
- `src/components/Board/Board.tsx` — Update card visibility logic to apply task status filter
- `src/hooks/useDragDrop.ts` or `dnd-kit` usage — Disable DnD when isFiltering is true

---

## Blockers

- Depends on TICKET-P2-001 (TaskStatus type)
- Depends on TICKET-P2-002 (Reducer, state.tasks)
