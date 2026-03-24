# Code Review: TICKET-P2-007 (Task Status Filter)

**Commit:** daa21dd (feat: add task status filter to CardDetail modal)
**Date:** 2026-03-23
**Reviewer:** Principal Code Reviewer

---

## Summary

The implementation adds a **per-card task status filter** inside the CardDetail modal's TaskSection component. This allows users to filter the task list by status (todo, in_progress, done, dropped, blocked) with single-select toggle behavior. However, **this implementation diverges significantly from the ticket's acceptance criteria**, which specify a **board-level filter integrated with FilterContext** that affects overall card visibility and DnD state. The code itself is well-crafted—TypeScript-safe, accessible, and handles dark mode—but it solves a different problem than what the ticket requires.

**Verdict:** 🚫 **REJECT** — Critical scope mismatch. The implementation must be redesigned to meet the actual acceptance criteria (AC-1 through AC-10), which mandate FilterContext integration and board-level filtering logic.

---

## Critical Issues

### 📍 AC-1 Violation: FilterContext Not Extended

**Issue:** The ticket's first acceptance criterion explicitly requires:
```gherkin
Given FilterContext manages all board filters
When FilterContext is updated for Phase 2
Then it includes:
  - taskStatusFilter: Set<TaskStatus>
  - toggleTaskStatusFilter(status: TaskStatus) function
```

**Current State:** FilterContext remains unchanged. The filter state is entirely local to TaskSection as `const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | null>()`.

**Impact:** AC-1, AC-5, AC-6, AC-8, AC-9 all depend on FilterContext integration. Without this, the filter cannot:
- Coordinate with search and priority filters (AND/OR logic in AC-6)
- Disable DnD at the board level (AC-9)
- Clear all filters together (AC-8)
- Persist across modal close/reopen if ever needed

**Recommendation:** Extend FilterContext with:
- `taskStatusFilter: Set<TaskStatus>` (multi-select set, not single-select)
- `toggleTaskStatusFilter(status: TaskStatus)` that adds/removes from the set
- Update `isFiltering` logic to include `taskStatusFilter.size > 0`
- Update `clearFilters()` to reset taskStatusFilter

---

### 📍 AC-2, AC-3, AC-4 Violation: Single-Select Toggle Instead of Checkboxes

**Issue:** The ticket specifies **5 independent checkboxes** that can have **multiple statuses checked simultaneously** (multi-select). The implementation provides **5 toggle buttons with single-select behavior** (only one status can be active at a time).

**Current Code:**
```typescript
const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | null>(null);
const handleFilterClick = (status: TaskStatus) => {
  setTaskStatusFilter((prev) => (prev === status ? null : status));
};
```

**Expected Behavior (AC-5):**
```gherkin
Given the user checks both "Blocked" and "In Progress"
Then Cards A and B are visible (have matching tasks)
And filter logic is: (card has task with "blocked") OR (card has task with "in_progress")
```

**Current Behavior:** Only one status can be selected at a time. Clicking "In Progress" after "Blocked" unselects "Blocked".

**Recommendation:** Change to multi-select:
```typescript
const [taskStatusFilter, setTaskStatusFilter] = useState<Set<TaskStatus>>(new Set());
const toggleTaskStatusFilter = (status: TaskStatus) => {
  setTaskStatusFilter((prev) => {
    const next = new Set(prev);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    return next;
  });
};
// Render checkboxes, not toggle buttons
// checkbox.checked = taskStatusFilter.has(status)
```

---

### 📍 AC-7, AC-9, AC-10 Violation: No Board-Level Filtering

**Issue:** The ticket requires the filter to affect **entire board visibility**, not just tasks within a single card:
- AC-7: Cards with zero tasks should be hidden when filter is active
- AC-9: DnD must be disabled board-wide when filter is active
- AC-10: Columns should show "No matching cards" empty state

**Current Scope:** Filter only operates on tasks within the currently open card's TaskList.

**Impact:** The most critical functionality of the ticket is completely unimplemented.

**Recommendation:**
1. Update Board.tsx to filter visible cards based on taskStatusFilter
2. Update DnD disable logic: change from `!filterContext.isFiltering` to also include task status filter check
3. Each column should show empty state when filter hides all its cards

---

### 📍 AC-8 & AC-6 Violation: No Integration with Search/Priority Filters

**Issue:** The ticket specifies that task status filter must work **in combination with** search and priority filters using AND/OR logic:
- **AC-6:** (title contains "API") AND (has blocked task)
- **AC-8:** clearFilters() must reset task status filter along with search and priority

**Current State:**
- taskStatusFilter is isolated in TaskSection; it doesn't coordinate with FilterContext at all
- clearFilters() in FilterContext only resets search, priority, and label filters
- No AND/OR logic exists

**Recommendation:** Integrate into FilterContext and update Board.tsx's filter logic to apply all three filters combined:
```typescript
// Pseudocode
const visibleCards = allCards.filter(card => {
  // Search: card title or description matches
  const matchesSearch = searchQuery === "" || cardMatches(card, searchQuery);
  // Priority: card has selected priority (if any)
  const matchesPriority = priorityFilter === null || card.priority === priorityFilter;
  // Task status: card has at least one task with selected status (if any)
  const hasMatchingTask = taskStatusFilter.size === 0 ||
    card.taskIds.some(id => taskStatusFilter.has(state.tasks[id].status));

  return matchesSearch && matchesPriority && hasMatchingTask;
});
```

---

## Major Issues

### 📍 Dark Mode Color Convention Inconsistency

**Location:** TaskSection.tsx, line 103 and 135

**Issue:** The ticket's reference (P2-006 findings) established that muted secondary text should use `text-slate-400 dark:text-slate-500`. The code violates this in two places:

Line 103 (section label):
```typescript
className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase..."
//                                                    ^^^^^^^^^^^^^^
// Should be: dark:text-slate-500
```

Line 107-111 (task count):
```typescript
className="ml-1.5 font-normal normal-case text-slate-400 dark:text-slate-500"
// ✓ Correct — follows the convention
```

Line 135 (inactive filter button):
```typescript
: "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300..."
//                                                ^^^^^^^^^^^^^^
// Should be: dark:text-slate-500 for text? Or is this intentional for button state?
```

**Impact:** In dark mode, text on line 103 will be too bright (poor contrast on dark-bg), and line 135 text will be inconsistent with other muted text.

**Recommendation:** Align with established convention:
- Line 103: Change to `dark:text-slate-500`
- Line 135: Consider if inactive button text should also follow the `text-slate-400 dark:text-slate-500` pattern, or if the current choice is intentional for visual feedback

---

### 📍 No Test Coverage

**Location:** Entire feature

**Issue:** No unit or component tests exist for:
- TaskSection filter state management
- TaskList filtering logic
- UI interactions (button clicks, filtered count display)
- Edge cases (empty filtered results, all tasks filtered out)

The ticket specifies 11 test cases (lines 152-165 in TICKET-P2-007-task-status-filter.md), none of which are implemented.

**Impact:** Without tests, regressions during refactor (to meet AC requirements) cannot be caught. Filter logic is easy to break.

**Recommendation:** Create tests after refactoring to meet AC requirements:
- Unit: `toggleTaskStatusFilter` behavior (add/remove from set)
- Component: Checkbox rendering and click behavior
- Filter logic: Single status → shows matching tasks, multiple statuses → OR logic, no tasks → empty message
- Integration: Filter + search (AND logic)

---

### 📍 Filter Scope Confusion in Comments

**Location:** TaskSection.tsx, lines 56-69

**Issue:** The JSDoc comment states:
```typescript
/**
 * AC-1 layout:
 *   1. "Tasks" section label (with count)
 *   2. Status filter buttons (only when card has tasks — P2-007)
 *   3. TaskList (if card has tasks, filtered by active status) OR TaskEmptyState
 *   4. AddTaskForm — always visible for creating new tasks
 *
 * P2-007 filter behaviour:
 *   - Single-select; clicking the active filter clears it (shows all).
 *   - Filter resets when CardDetail closes (ephemeral local state).
 *   - Does NOT affect the board-level isFiltering flag — DnD is unaffected.
 */
```

The comment explicitly acknowledges that the implementation does NOT integrate with board-level filtering and DnD, yet the ticket's AC-9 requires exactly that. This comment reveals the engineer understood the scope mismatch but proceeded with a simpler implementation.

**Impact:** Misleading—AC-1 in the comment refers to TaskSection layout, but the ticket's AC-1 refers to FilterContext structure. This creates confusion about what was actually required.

**Recommendation:** Remove this misleading comment and replace with accurate documentation of the actual scope once redesigned.

---

## Minor Issues & Suggestions

### 📍 STATUS_FILTER_OPTIONS Color Consistency

**Location:** TaskSection.tsx, lines 21-52

**Issue:** The `activeClass` colors are defined inline but should align with TaskItem.tsx's `STATUS_OPTIONS` badges. Spot-check of colors:

TaskItem.tsx (line 28-29):
```typescript
badgeClass: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
```

TaskSection.tsx (line 26):
```typescript
activeClass: "bg-slate-200 text-slate-700 border-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500"
```

**Observation:** The colors are slightly different (slate-200 vs slate-100 background, slate-700 vs slate-600 text). This might be intentional for "active button" vs "badge" visual distinction, but it's not documented.

**Recommendation:** Either:
1. Extract both to a shared `STATUS_COLORS` constant
2. Add a comment explaining why active button colors differ from badge colors
3. Or align them if the difference was unintended

---

### 📍 useMemo Dependency Array in TaskList

**Location:** TaskList.tsx, lines 40-46

**Code:**
```typescript
const visibleTasks = useMemo<Task[]>(
  () =>
    statusFilter === null
      ? allTasks
      : allTasks.filter((task) => task.status === statusFilter),
  [allTasks, statusFilter]  // ✓ Correct
);
```

**Observation:** ✅ Dependency array is correct. Memoization is appropriate to avoid re-filtering on every render. This is well-done.

---

### 📍 Empty State Message Clarity

**Location:** TaskList.tsx, lines 50-68

**Code:**
```typescript
if (visibleTasks.length === 0) {
  const statusLabels: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    dropped: "Dropped",
    blocked: "Blocked",
  };
  const label = statusFilter ? statusLabels[statusFilter] : "";
  return (
    <p role="status" aria-live="polite">
      No {label} tasks.
    </p>
  );
}
```

**Observation:** ✅ Message is clear ("No Blocked tasks"), and the `aria-live="polite"` is good for accessibility. However, the logic `statusFilter ? statusLabels[statusFilter] : ""` is redundant because we know `statusFilter !== null` at this point (it's checked before calling this code in TaskSection). The ternary is safe but unnecessary.

**Suggestion (optional):** Simplify to `const label = statusLabels[statusFilter];` since we've already confirmed statusFilter is non-null.

---

### 📍 Unnecessary Code in TaskSection Heading

**Location:** TaskSection.tsx, lines 106-112

**Code:**
```typescript
{hasTasks && (
  <span className="ml-1.5 font-normal normal-case text-slate-400 dark:text-slate-500">
    {isFiltering
      ? `(${filteredTaskCount} of ${totalTaskCount})`
      : `(${totalTaskCount})`}
  </span>
)}
```

**Observation:** ✅ Correct logic and good dark mode colors. The "X of Y" format matches the ticket spec. Minor note: If no tasks exist, the heading still shows "Tasks" without any count, which is fine. When filter is active and produces zero results, it shows "(0 of X)", which is accurate.

---

## Positive Observations

1. **TypeScript Safety:** All types are properly defined. No `any` types or unsafe casts. TaskStatus discriminated union is used correctly.

2. **Accessibility:**
   - ✅ `role="group"` and `aria-label` on filter buttons container
   - ✅ `aria-pressed={isActive}` correctly indicates button state
   - ✅ `role="status"` and `aria-live="polite"` on empty state message
   - ✅ `aria-labelledby="tasks-section-label"` on the section
   - ✅ Focus management: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500` is appropriate

3. **Dark Mode Support:** All button styles include dark mode variants (e.g., `dark:bg-slate-700`, `dark:text-blue-300`). The activeClass colors are well-thought-out for readability in both light and dark modes (e.g., blue-900/40 with 40% opacity for dark mode transparency).

4. **Code Clarity:** The implementation is easy to follow. Variable names are descriptive (`isFiltering`, `filteredTaskCount`, `taskStatusFilter`). Comments explain the P2-007 scoping decision clearly (though the decision itself doesn't match the ticket).

5. **Build Success:** ✅ `npm run build` passes with zero TypeScript errors and no console warnings. Bundle size (292 KB gzipped) is reasonable.

6. **Component Composition:** TaskSection properly delegates filtering logic to TaskList via the `statusFilter` prop. Good separation of concerns.

7. **Defensive Coding:** The `if (!card) return null` guard at line 78 prevents crashes from missing card data.

---

## Verdict

### 🚫 **REJECT** — Do Not Merge

**Reason:** The implementation solves a **different problem** than what the ticket specifies. It provides a **per-card modal filter** instead of the **board-level FilterContext-integrated filter** that the ticket requires (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10).

**Required Changes (Critical):**

1. **Extend FilterContext** with `taskStatusFilter: Set<TaskStatus>` and `toggleTaskStatusFilter()`
2. **Change from single-select to multi-select** checkbox behavior
3. **Implement board-level card filtering** in Board.tsx based on taskStatusFilter
4. **Integrate with search + priority filters** using AND logic
5. **Disable DnD when taskStatusFilter.size > 0**
6. **Show empty state per column** when filter hides all cards
7. **Add comprehensive test coverage** (11 test cases per ticket spec)

**Optional Before Merge:**

- Fix dark mode text colors (lines 103, 135) to follow `dark:text-slate-500` convention
- Simplify statusLabels lookup in TaskList (remove unnecessary ternary)
- Extract color constants to avoid duplication between TaskItem and TaskSection

**Recommendation:** This work should be redesigned as a new commit(s) that actually implements the ticket's AC. The current implementation can be kept as inspiration for the UI layer (button/checkbox styling), but the state management and filtering logic must be rewritten to meet the spec.

---

## Readiness for P2-008

**Status:** ⛔ **Blocked** — This ticket must be completed correctly before P2-008 can begin, as P2-008 likely depends on a working FilterContext-based system.

---

## Tech Debt & Future Work

1. **TECH-DEBT-P2-004:** Task status filter should have integration/E2E tests covering:
   - Multi-select filter interaction (checking multiple statuses)
   - AND logic between search + priority + status filters
   - DnD disabling during filter
   - Empty state per column
   - Filter clearing

2. **TECH-DEBT-P2-005:** Consider whether filter state should persist to localStorage (AC-11 is optional but listed). If so, add to storage layer.

3. **Documentation:** Update ADR or inline docs to explain the filter logic architecture once redesigned. Currently, the split between FilterContext (search, priority, label) and per-component logic (task status) is confusing.

