# TICKET-P2-006: Task Summary & Progress Display

**Priority:** P0
**PRD References:** Section 5.2 (Card Board View), Section 7.2-7.3 (TaskSummary component), Section 9.1 (Scenarios)
**Area:** Board View & Task Visualization
**Depends On:** TICKET-P2-001, TICKET-P2-002, TICKET-P2-005

## Summary

Build TaskSummary component that displays a compact task progress summary ("X/Y tasks") and optional progress bar on each board card. Calculate progress excluding dropped tasks from the denominator. Show no summary for cards with zero tasks.

---

## Acceptance Criteria

### AC-1: TaskSummary Component Structure
```gherkin
Given a card is displayed on the board
When CardItem is rendered with the card
Then TaskSummary component is placed below the card title
And TaskSummary shows task progress information
```

### AC-2: No Summary for Zero Tasks
```gherkin
Given a card has zero tasks (taskIds: [])
When TaskSummary renders
Then no progress summary or progress bar is displayed
And the component returns null (does not render any element)
```

### AC-3: Summary Display Format
```gherkin
Given a card has 5 tasks where 2 are "done" and 1 is "dropped"
When TaskSummary renders
Then the text displays: "2/4 tasks" (dropped excluded from denominator)
And the progress bar shows 50% filled (2 done / 4 active)
```

### AC-4: Progress Calculation Excludes Dropped
```gherkin
Given a card has 4 tasks:
  - Task 1: status "done"
  - Task 2: status "todo"
  - Task 3: status "dropped"
  - Task 4: status "blocked"
When TaskSummary calculates progress
Then denominator = 3 (excludes dropped task)
And numerator = 1 (only "done" counts)
And displayed text = "1/3 tasks"
And progress bar width = (1/3) * 100% = 33%
```

### AC-5: Blocked Tasks Count Toward Denominator
```gherkin
Given a card has 2 tasks:
  - Task 1: status "done"
  - Task 2: status "blocked"
When TaskSummary renders
Then the summary shows "1/2 tasks" (blocked IS counted in denominator)
And the progress bar shows 50%
```

### AC-6: All Done Tasks
```gherkin
Given a card has 3 tasks all with status "done"
When TaskSummary renders
Then the summary shows "3/3 tasks"
And the progress bar shows 100% filled
And the progress bar color indicates completion (green)
```

### AC-7: All Dropped Tasks (Edge Case)
```gherkin
Given a card has 3 tasks all with status "dropped"
When TaskSummary renders
Then the summary should not display (0/0 edge case)
Or display "0/0 tasks" if edge case handling allows it
And the progress bar shows 0%
```

### AC-8: Progress Bar Styling
```gherkin
Given TaskSummary renders a progress bar
When the bar is displayed
Then it has:
  - Height: 4px (thin bar)
  - Background: light gray (#e5e7eb or Tailwind gray-200)
  - Fill color: green (#22c55e or Tailwind green-400)
  - Fill width: (done count / denominator) * 100%
  - Responsive width (full card width minus padding)
```

### AC-9: Progress Text Color
```gherkin
Given TaskSummary displays the text "X/Y tasks"
When rendered
Then the text uses a muted color (not bold)
And font size is small (sm in Tailwind scale)
And the text is positioned below the card title
```

### AC-10: Real-time Updates
```gherkin
Given a user is viewing the board
When a task status is changed (e.g., task marked as done)
Then TaskSummary updates immediately
And the progress bar animates/refreshes without page reload
```

### AC-11: Dark Mode Support
```gherkin
Given the app is in dark mode
When TaskSummary is rendered
Then colors are appropriate for dark background:
  - Progress bar background: darker gray
  - Progress bar fill: green (adjusted for contrast)
  - Text color: light gray (appropriate contrast)
```

### AC-12: No TypeScript Errors
```gherkin
Given TaskSummary is fully implemented
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- TaskSummary is a pure component — it receives `taskIds: string[]` as a prop
- Task data is looked up from context.state.tasks
- Progress calculation: `done = tasks.filter(t => t.status === "done").length`, `total = tasks.filter(t => t.status !== "dropped").length`
- If total === 0 (all dropped), return null or handle gracefully
- Progress bar width is calculated inline: `(done / total) * 100` or "0%" if total is 0
- Use Tailwind for styling: `h-1` for bar height, `bg-gray-200` for background, `bg-green-400` for fill

---

## Testing

- Unit test: TaskSummary with 0 tasks returns null
- Unit test: TaskSummary with 5 tasks (2 done, 1 dropped, 2 other) shows "2/4 tasks"
- Unit test: Progress percentage calculation (1/3 = 33%, 2/4 = 50%, etc.)
- Unit test: Dropped tasks excluded from denominator
- Unit test: Blocked tasks included in denominator
- Unit test: Edge case all dropped tasks (0/0 handling)
- Component test: TaskSummary renders with correct text and bar width
- Integration test: Create task → board card shows "1/?" → mark done → shows "1/1" and 100% bar
- Visual test: Progress bar displays correctly on light and dark themes

---

## Files Created

- `src/components/Card/TaskSummary.tsx` (NEW)

## Files Modified

- `src/components/Card/CardItem.tsx` — Add TaskSummary component after card title/description

---

## Blockers

- Depends on TICKET-P2-001 (Task type, AppState.tasks)
- Depends on TICKET-P2-002 (Reducer, state management)
