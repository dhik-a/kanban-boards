# TICKET-P2-008: Polish & Integration

**Priority:** P1
**PRD References:** Section 9 (All Scenarios), Section 10 (Context), Section 12 (Engineering Notes)
**Area:** UX Polish, Testing, and Integration
**Depends On:** All previous Phase 2 tickets (P2-001 through P2-007)

## Summary

Final integration and polish pass: ensure all components work together seamlessly, implement empty states with helpful messaging, verify dark mode support, run full integration tests, and ensure the board remains stable and performant with the new task features.

---

## Acceptance Criteria

### AC-1: Task Empty State Messaging
```gherkin
Given a card with no tasks is opened in the detail modal
When the modal displays the Tasks section
Then a clear message appears: "No tasks yet. Add one to break this card into steps."
And an "Add Task" input or button is visible
And the empty state is visually distinct from the rest of the modal
```

### AC-2: Board Empty State with Filter
```gherkin
Given a task status filter is active
And no cards match the filter
When the board is rendered
Then each column shows an empty state
And a message "No matching cards" is displayed
And existing "No cards" empty state from Phase 1 is NOT shown (only filter-specific message)
```

### AC-3: Zero Tasks Progress Display
```gherkin
Given a card has 0 tasks
When the card is displayed on the board
Then no task summary or progress bar is rendered
And no space is wasted on a "0/0 tasks" display
```

### AC-4: Task Status Color Consistency
```gherkin
Given tasks and columns are displayed
When TaskItem status badges are shown alongside column headers
Then colors are consistent:
  - "todo" = slate (#94a3b8) matches "To Do" column color
  - "in_progress" = blue (#3b82f6) matches "In Progress" column color
  - "done" = green (#22c55e) matches "Done" column color
  - "dropped" = red (#ef4444) matches "Dropped" column color
  - "blocked" = amber (#f59e0b) matches "Blocked" column color
```

### AC-5: Dark Mode Support
```gherkin
Given the app supports light and dark themes
When the user toggles dark mode
Then all task components render correctly:
  - TaskSummary progress bar colors appropriate for dark background
  - TaskStatusFilter checkboxes visible and readable
  - Task list styling readable (text contrast, background)
  - Progress bar fill color visible against dark column background
```

### AC-6: Card Detail Modal Scrolling (if needed)
```gherkin
Given a card has many tasks (10+)
When the card detail modal is open
Then the task list scrolls within the modal if needed
And the modal does not grow excessively tall
And Title, Description, Metadata fields remain visible at top
```

### AC-7: No Regressions in Phase 1 Features
```gherkin
Given all Phase 1 features (board, columns, cards, DnD, search, filters)
When the Phase 2 changes are applied
Then all Phase 1 functionality remains intact:
  - Board title editing works
  - Card CRUD (create, read, update, delete) works
  - Card drag-and-drop works (when no filter active)
  - Search by title works
  - Priority and label filters work
  - Clear all filters works
  - Auto-save persists changes
  - Page refresh restores state
```

### AC-8: Performance: No Lag with Many Tasks
```gherkin
Given a board with 30 cards, each with 5 tasks
When the user opens a card detail modal
Then the modal opens without lag (<100ms)
And when the user changes a task status
Then the update is immediate (no visible delay)
And the board updates the progress bar instantly
```

### AC-9: Performance: Filter Performance
```gherkin
Given a board with 30 cards and many tasks
When the user checks a task status filter
Then the board filters and displays updated results within 50ms
And no lag or stutter is visible
```

### AC-10: All Acceptance Criteria from P2-001 through P2-007 Pass
```gherkin
Given all tickets P2-001 through P2-007 have been implemented
When all their acceptance criteria are tested
Then 100% of criteria pass without failure
And all TypeScript builds succeed
```

### AC-11: Full Integration Test Path
```gherkin
Given a fresh install (no data)
When the following actions are performed in sequence:
  1. User creates Card A "Design API"
  2. User adds Task 1 "Schema design" (todo)
  3. User adds Task 2 "Review API" (todo)
  4. User marks Task 1 as "done"
  5. User marks Task 2 as "blocked"
  6. User closes and reopens the app
  7. User filters by "Blocked" status
  8. User clicks Card A and verifies tasks
Then:
  - Card A shows "1/2 tasks" on the board
  - Progress bar shows 50%
  - Filter by "Blocked" shows Card A
  - App refresh preserves all task data
  - Card detail shows both tasks with correct statuses
```

### AC-12: Card Deletion with Tasks
```gherkin
Given a card with 4 tasks is displayed
When the user deletes the card (confirms)
Then the card is removed from the board
And all 4 tasks are deleted from storage
And no orphaned tasks remain
And the board updates correctly
```

### AC-13: Documentation & Code Comments
```gherkin
Given the code is complex (tasks, filters, progress calculation)
When a developer reviews the code
Then key functions have clear comments:
  - Progress calculation logic (why dropped excluded)
  - Filter logic (OR vs AND)
  - Reducer cases (timestamp updates)
And the code is maintainable without excessive explanation
```

### AC-14: No TypeScript Errors
```gherkin
Given all Phase 2 implementation is complete
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors and zero warnings
```

### AC-15: Browser Compatibility
```gherkin
Given the app is built for modern browsers
When tested on Chrome, Firefox, Safari (latest)
Then all task features work correctly:
  - Inline edit
  - Status dropdowns
  - Checkboxes
  - Confirmation dialogs
  - Progress bars
  - Filtering
```

---

## Implementation Notes

- Use existing ConfirmDialog component from Phase 1 for all confirmations (task delete, card delete)
- Empty state messages should be consistent with existing Phase 1 empty state UX
- Progress bar animation: use CSS transitions if possible (no JavaScript animation required)
- Filter performance: do not add memoization unless profiling shows bottleneck
- Test in actual browser, not just in test runner, to catch rendering issues

---

## Testing Checklist

- [ ] Run full integration test path (AC-11) manually in browser
- [ ] Test card deletion cascades task deletion (AC-12)
- [ ] Test dark mode renders correctly (AC-5)
- [ ] Test with 30+ cards and many tasks (AC-8, AC-9)
- [ ] Verify all Phase 1 features still work (AC-7)
- [ ] Run `npm run build` (AC-14)
- [ ] Test on Chrome, Firefox, Safari (AC-15)
- [ ] Verify no console errors or warnings
- [ ] Check mobile responsiveness (not explicit AC, but good to verify)

---

## Files Modified (Primarily verification, minimal new code)

- `src/App.tsx` — Verify integration
- `src/context/BoardContext.tsx` — Verify reducer completeness
- `src/components/Board/Board.tsx` — Verify filter integration
- All Task components — Verify empty states, colors, styling

## Files Created

None (all core components created in previous tickets)

---

## Blockers

- Depends on all previous Phase 2 tickets (P2-001 through P2-007)

---

## Definition of Done

- [ ] All AC-1 through AC-15 pass
- [ ] All previous tickets' ACs still pass (no regressions)
- [ ] Full integration test path works end-to-end
- [ ] Build succeeds with zero errors
- [ ] Code is reviewed for clarity and maintainability
- [ ] Phase 2 is marked "Complete" in PRD

---

## Notes for QA

Please verify:
1. **Task creation**: Create 5 tasks rapidly in sequence, verify all created
2. **Status changes**: Change task statuses and verify progress bar updates
3. **Filtering**: Check each status filter individually, then in combinations
4. **Deletion**: Delete tasks and cards, verify cascading deletion
5. **Persistence**: Make changes, refresh, verify all restored
6. **Edge cases**: Card with all dropped tasks, card with zero tasks, empty board with filter active
7. **Dark mode**: Toggle theme and verify readability
8. **Mobile**: Test on mobile viewport (if applicable)
