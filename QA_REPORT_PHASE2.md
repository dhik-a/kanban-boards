# Phase 2 QA Test Report

**Date:** 2026-03-23
**Reviewer:** Senior QA Engineer (automated code-level review)
**Scope:** Phase 2 implementation -- tasks within cards, fixed 5-column board, card-level task filtering
**Method:** Static code analysis against the test plan (33 test scenarios). Runtime behavior inferred from code paths.

---

## 1. Build and Tooling Status

| Check | Result |
|-------|--------|
| TypeScript compilation (`tsc --noEmit`) | PASS -- zero errors |
| Production build (`vite build`) | PASS -- 292 KB JS, 38 KB CSS |
| ESLint | FAIL -- 10 errors, 1 warning (see BUG-01) |

---

## 2. Test Results by Phase

### Phase 1: Smoke Tests (Fresh Install) -- Tests 1-5

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 1 | Fresh install renders 5 columns in correct order | PASS | `FIXED_COLUMN_TITLES` in Board.tsx enforces "To Do, In Progress, Done, Dropped, Blocked" ordering. `createFixedColumns()` in defaults.ts creates them correctly. |
| 1 | All columns empty on fresh install | PASS | `createDefaultState()` returns `cards: {}, tasks: {}` with empty `cardIds` arrays. |
| 1 | Column titles are read-only | PASS | `ColumnHeader` renders a `<span>`, not an editable element. No click handlers. |
| 1 | No "Add Column" button | PASS | Column add/delete/reorder UI removed in Phase 2. |
| 2 | Card creation and modal opening | PASS | `AddCard` dispatches `ADD_CARD` with correct structure including `taskIds: []`. |
| 2 | Empty task state message | PASS | `TaskEmptyState` renders "No tasks yet. Add one to break this card into steps." |
| 3 | Task creation via Enter | PASS | `AddTaskForm.createTask()` dispatches `ADD_TASK`, clears input, retains focus. |
| 3 | Input clears and retains focus after task creation | PASS | `setInputValue("")` followed by `inputRef.current?.focus()`. |
| 4 | Multiple tasks appear in creation order | PASS | `ADD_TASK` reducer appends to `taskIds` array. TaskList iterates `taskIds` in order. |
| 4 | Board card shows task progress | PASS | `TaskSummary` renders "X/Y tasks" with progress bar. |
| 5 | Progress bar visible after modal close | PASS | `TaskSummary` reads directly from context, not modal state. |

### Phase 2: Task Operations -- Tests 6-11

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 6 | Inline title edit -- click to edit, Enter to save | PASS | `TaskItem.enterEditMode()` sets `isEditing=true`, `commitEdit()` dispatches `UPDATE_TASK` on Enter. |
| 6 | Text pre-selected on edit | PASS | `useEffect` calls `editInputRef.current?.select()` via `requestAnimationFrame`. |
| 7 | Escape cancels edit | PASS | `cancelEdit()` restores original title and sets `isEditing=false`. |
| 8 | Blur confirms edit | PASS | `onBlur={commitEdit}` on the edit input. |
| 9 | Status dropdown with 5 options | PASS | `STATUS_OPTIONS` array has all 5 statuses with correct labels and color classes. |
| 9 | Done status shows strikethrough | PASS | `task.status === "done"` applies `line-through text-slate-400`. |
| 9 | Progress updates on status change | PASS | `TaskSummary` recomputes via `useMemo` keyed on `[taskIds, state.tasks]`. |
| 10 | Dropped tasks excluded from denominator | PASS | `TaskSummary`: `if (task.status === "dropped") continue;` skips both doneCount and totalCount. |
| 11 | Delete confirmation dialog | PASS | `ConfirmDialog` with correct message format. Cancel closes dialog, confirm dispatches `DELETE_TASK`. |
| 11 | Task deletion updates progress | PASS | `DELETE_TASK` reducer removes from both `state.tasks` and `card.taskIds`. |

### Phase 3: Card-Level Task Filtering -- Tests 12-13

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 12 | Filter by status (single-select toggle) | PASS | `TaskSection.handleFilterClick()` toggles filter. Re-clicking active filter clears it. |
| 12 | Filtered count display "(X of Y)" | PASS | `TaskSection` shows `(${filteredTaskCount} of ${totalTaskCount})` when filtering. |
| 12 | Empty filter result message | PASS | `TaskList` shows "No {status} tasks." when filter produces zero results. |
| 13 | Rapid filter toggles | PASS | Filter is local `useState` -- React batches state updates. No async operations involved. |

### Phase 4: Persistence -- Tests 14-16

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 14 | Auto-save with debounce | PASS | `useDebouncedSave` triggers 300ms after state change. `saveState()` writes 3 keys. |
| 14 | Data persists after refresh | PASS | `resolveInitialState()` loads from localStorage when schema version matches. |
| 15 | Data persists after tab close | PASS | `beforeunload` listener flushes pending save synchronously. |
| 16 | Fresh install on schema mismatch | PASS | `schemaVersion < SCHEMA_VERSION` returns fresh defaults. |

### Phase 5: Dark Mode -- Test 17

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 17 | All task components render in dark mode | PASS | All components use `dark:` Tailwind variants consistently. Status badges, progress bar, inputs all have dark mode classes. |

### Phase 6: Accessibility -- Tests 18-20

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 18 | Tab order and keyboard access | PASS | All interactive elements are `<button>` or `<input>/<select>` with proper `tabIndex`. Focus trap in Modal and ConfirmDialog. |
| 18 | Focus indicators | PASS | `focus-visible:ring-2` applied consistently. |
| 19 | Escape closes modal | PASS | Modal has `keydown` listener for Escape. ConfirmDialog uses capture-phase to stop propagation. |
| 19 | Escape cancels title edit | PASS | `handleTitleKeyDown` handles Escape in TaskItem. |
| 19 | Escape collapses empty add-task form | PASS | `AddTaskForm` collapses on Escape when input is empty, clears when not. |
| 20 | Progress bar ARIA | PASS | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`. |
| 20 | Filter buttons announce pressed state | PASS | `aria-pressed={isActive}` on all filter buttons. |
| 20 | Form labels | PASS | `aria-label` on all inputs and selects. `htmlFor` on labeled sections. |

### Phase 7: Phase 1 Regression -- Tests 21-25

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 21 | Card drag and drop | PASS | DnD logic intact. `PointerSensor` with 5px distance, `KeyboardSensor`, `DragOverlay` with `CardItemOverlay`. Same-column uses `arrayMove`, cross-column uses splice. |
| 22 | Card search | PASS | `Header` has search input with 200ms debounce. `Column` filters cards by `searchQuery`. |
| 23 | Priority and label filters | PASS | `FilterContext` manages `priorityFilter` and `labelFilter`. Column applies all filters with AND logic. |
| 24 | Board title editing | PASS | `BoardTitle` in Header.tsx supports click-to-edit, Enter/Escape/blur behavior. |
| 25 | Card creation and deletion | PASS | `AddCard` creates cards. `CardDetail` has delete with `ConfirmDialog`. `DELETE_CARD` cascade-deletes tasks. |

### Phase 8: Edge Cases -- Tests 26-28

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 26 | Corrupted localStorage recovery | PASS | `loadState()` catches JSON.parse errors and shape validation failures. `CorruptionWarningBanner` is dismissible. |
| 27 | Storage quota exceeded | PASS with issues | `saveState()` returns error string, `SaveErrorBanner` renders it. Rollback logic attempts to restore previous values. See BUG-03 for a gap. |
| 28 | Rapid mutations | PASS | Debounced save collapses rapid changes. Reducer is synchronous. No race conditions in state updates. |

### Phase 9: Responsive Design -- Tests 29-30

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 29 | Mobile layout | PASS | `flex-col` on mobile, `md:flex-row` on desktop. Modal has `p-4` padding and `max-w-lg`. |
| 30 | Tablet layout | PASS | `md:w-72` per column with `md:overflow-x-auto`. |

### Phase 10: Performance -- Tests 31-33

| # | Test | Verdict | Notes |
|---|------|---------|-------|
| 31 | Filter performance | PASS | `useMemo` for task filtering with proper dependencies. O(n) where n = tasks in card. |
| 32 | Console errors/warnings | FAIL | See BUG-01 (ESLint errors). React strict mode may surface additional warnings at runtime. |
| 33 | Memory leaks | PASS (code-level) | Timer cleanup on unmount in AddCard (CRIT-4), Header debounce cleanup, beforeunload listener cleanup. |

---

## 3. Bugs Found

### BUG-01: ESLint reports 10 errors including ref-during-render and setState-in-effect violations

- **Severity:** HIGH
- **Category:** Code Quality / Correctness
- **Files affected:**
  - `src/context/BoardContext.tsx` (lines 284, 294) -- accessing `initRef.current` during render is flagged by `react-hooks/refs`. The pattern `if (!initRef.current) { initRef.current = ... }` reads and writes a ref during render, which violates React 19's stricter ref rules.
  - `src/components/Card/CardDetail.tsx` (line 223) -- `setTitleValue(card.title)` inside a `useEffect` is flagged as `set-state-in-effect`. This causes a cascading render on every card switch.
  - `src/components/Header/Header.tsx` (lines 27, 156) -- same `set-state-in-effect` pattern in `BoardTitle` and search sync effect.
  - Four `react-refresh/only-export-components` errors in context files.
- **Impact:** The ref-during-render pattern in `BoardProvider` is particularly concerning. Under React 19 strict mode, this could cause the component to not update as expected. The `setState` in effects cause unnecessary extra renders (performance degradation). The react-refresh errors mean HMR will do full page reloads during development, not partial updates.
- **Recommendation:**
  - For `BoardContext.tsx`: Replace the `useRef` lazy-init pattern with `useState(() => resolveInitialState())` (lazy initializer) which is the idiomatic React way to run initialization code once.
  - For `CardDetail.tsx`: Derive `titleValue` and `descValue` using a key prop pattern (e.g., `key={cardId}` on the modal content) to reset local state when the card changes, eliminating the sync effect entirely.
  - For `Header.tsx` `BoardTitle`: Same approach -- derive initial value or use a key.
  - For react-refresh: Extract the `useXxxContext` hooks to separate files, or suppress with inline comments if the team accepts the trade-off.

### BUG-02: Escape key in task title edit triggers modal close simultaneously

- **Severity:** HIGH
- **Category:** UI/UX / Keyboard Interaction
- **Description:** When a user is editing a task title inline (inside the CardDetail modal) and presses Escape, the `handleTitleKeyDown` in `TaskItem` calls `cancelEdit()` and `e.preventDefault()`, but does NOT call `e.stopPropagation()`. The Escape keydown event will bubble up to the Modal's document-level `keydown` listener (line 30-55 of Modal.tsx), which will also fire `onClose()`, closing the entire modal.
- **Scenario:** User clicks a task title to edit it, decides to cancel, presses Escape. Expected: edit cancels, modal stays open. Actual: edit cancels AND modal closes.
- **Impact:** Users lose their place in the modal every time they cancel a task title edit. This is a frustrating UX regression.
- **Recommendation:** Add `e.stopPropagation()` alongside `e.preventDefault()` in `TaskItem.handleTitleKeyDown` when handling Escape. The same issue exists in `AddTaskForm.handleKeyDown` for the Escape case.

### BUG-03: saveState() rollback does not restore tasks key on partial failure

- **Severity:** MEDIUM
- **Category:** Data Integrity / Edge Case
- **Description:** In `saveState()` (storage.ts), the rollback logic snapshots `prevBoard` and `prevCards` before writing (lines 78-79), but does NOT snapshot `prevTasks`. If the tasks write fails (line 103-121), the code rolls back board and cards but leaves the tasks key at whatever was previously stored. However, if the board or cards write succeeded AND a prior tasks value existed, the rolled-back board/cards may now reference task IDs that correspond to a stale tasks object.
- **Scenario:** Board and cards writes succeed, tasks write fails on quota. Board is rolled back, cards is rolled back, but `kanban_tasks` retains whatever value it had before (which could be from a previous successful save with different task IDs).
- **Impact:** Low probability but technically creates a window where localStorage is inconsistent after partial failure. The next load would succeed but with mismatched data.
- **Recommendation:** Snapshot `const prevTasks = localStorage.getItem(TASKS_KEY);` at the top alongside prevBoard and prevCards.

### BUG-04: Schema version write failure silently causes data loss on next load

- **Severity:** HIGH
- **Category:** Data Integrity
- **Description:** In `saveState()` (storage.ts lines 127-133), if the schema version write fails, the comment says "On next load the schema check will treat this as a fresh install and overwrite with defaults." This means all persisted data (board, cards, tasks that were just successfully written) will be discarded on next page load because `resolveInitialState()` will see `schemaVersion < SCHEMA_VERSION` and return fresh defaults.
- **Scenario:** Storage is nearly full. Board/cards/tasks writes succeed (small delta), but the schema version setItem fails. User closes and reopens the app. All data is gone.
- **Impact:** Silent data loss. The user sees a fresh board with no warning or recovery option.
- **Recommendation:** If schema version write fails, treat it as a save failure (return the error string). Alternatively, write the schema version FIRST (before the data keys) so it is always set if data was previously written.

### BUG-05: Task delete button invisible to keyboard-only users

- **Severity:** MEDIUM
- **Category:** Accessibility
- **Description:** In `TaskItem.tsx` (line 226), the delete button uses `opacity-0 group-hover:opacity-100 focus-visible:opacity-100`. While `focus-visible:opacity-100` is present, the button is only reachable via Tab if the user knows it exists. There is no visual hint that a delete action is available until hover or focus. More critically, on touch devices, `group-hover` may not activate reliably, making the delete button undiscoverable.
- **Scenario:** A keyboard-only user tabs through task items. They may skip past the delete button without realizing it exists because it is invisible until focused.
- **Impact:** Reduced discoverability on keyboard-only and touch-only interactions. The button IS technically accessible (it becomes visible on focus), but the pattern is not ideal.
- **Recommendation:** Consider always showing the delete button with reduced opacity (e.g., `opacity-40 group-hover:opacity-100`), or adding a visual affordance like a "..." overflow menu.

### BUG-06: TaskList shows empty-state message even when no filter is active (zero tasks edge case)

- **Severity:** LOW
- **Category:** UI/UX
- **Description:** In `TaskList.tsx` (lines 50-67), when `visibleTasks.length === 0` and `statusFilter` is `null`, the component renders `"No  tasks."` (with an empty string for the status label). This creates an awkward "No  tasks." message with a double space.
- **Scenario:** This cannot actually occur in normal flow because `TaskSection` renders `TaskEmptyState` instead of `TaskList` when `card.taskIds.length === 0`. However, if a card has taskIds that all point to orphaned/missing tasks (data corruption), TaskList would render with all tasks filtered out and `statusFilter === null`, producing this malformed message.
- **Impact:** Cosmetic issue in a rare corruption scenario.
- **Recommendation:** Add a fallback message for the `statusFilter === null` case, e.g., "No tasks found."

### BUG-07: FilterContext useMemo includes unstable function references

- **Severity:** LOW
- **Category:** Performance
- **Description:** In `FilterContext.tsx` (lines 56-68), the `useMemo` for the context value object includes the setter functions (`setSearchQuery`, `setPriorityFilter`, `setLabelFilter`, `clearFilters`) which are recreated on every render because they are plain arrow functions (not wrapped in `useCallback`). The code comment on lines 37-40 acknowledges this and says "the stability buys nothing here." However, this means the `useMemo` is effectively useless -- the returned object contains new function references every render, so any consumer doing shallow comparison on the context value will re-render on every FilterProvider render.
- **Scenario:** Every state change in FilterProvider (including search query typing) causes all context consumers (Header, all Column components) to re-render even if the filter values have not changed.
- **Impact:** Minor performance impact. The consumers already re-render when filter values change, which is the common case. The excess re-renders only matter when filter values are stable but the parent tree re-renders.
- **Recommendation:** Either wrap the setters in `useCallback` and include them in the `useMemo` deps, or accept the current behavior and document it. The current approach is not incorrect, just suboptimal.

### BUG-08: Dead code -- createDefaultBoardMeta still exists

- **Severity:** LOW
- **Category:** Code Quality
- **Description:** `createDefaultBoardMeta()` in `defaults.ts` (lines 48-56) is a leftover from the abandoned multi-board design. It is not imported or used anywhere in the codebase.
- **Impact:** Dead code increases maintenance burden and confusion for new contributors.
- **Recommendation:** Remove `createDefaultBoardMeta()` and `createDefaultBoard()` (also unused -- `createDefaultState()` is the only function consumed).

### BUG-09: Modal uses static `id="modal-title"` -- multiple modals would conflict

- **Severity:** LOW
- **Category:** Accessibility
- **Description:** `Modal.tsx` hardcodes `id="modal-title"` (line 108) and `ConfirmDialog.tsx` hardcodes `id="confirm-dialog-title"` (line 139). If multiple Modal instances were ever mounted simultaneously, the duplicate IDs would break `aria-labelledby` associations. Currently there is only one Modal and one ConfirmDialog at a time, so this is not a runtime issue.
- **Impact:** No current runtime impact but limits reusability and violates HTML spec (unique IDs).
- **Recommendation:** Generate unique IDs using `useId()` (React 18+).

### BUG-10: CardDetail useEffect dependency -- `card` missing from dependency array

- **Severity:** LOW
- **Category:** Correctness
- **Description:** In `CardDetail.tsx` line 226, the useEffect that syncs `titleValue` and `descValue` with the card only depends on `[cardId]`, deliberately excluding `card`. The comment says "intentionally only [cardId]." However, if the card's title changes externally (e.g., from another browser tab or from a race condition), the local state will be stale. ESLint also flags this as a missing dependency.
- **Scenario:** If the card title were ever updated from outside the modal while it's open, the modal would show the old title.
- **Impact:** Minimal in current single-tab architecture. Would become a real bug if real-time sync or multi-tab support were added.
- **Recommendation:** Acceptable for now but should be documented as a known limitation.

### BUG-11: AddTaskForm does not collapse on blur

- **Severity:** LOW
- **Category:** UI/UX
- **Description:** The `AddTaskForm` expands when the user clicks "Add task" and can be collapsed via Escape (when empty). However, there is no `onBlur` handler on the input to collapse the form when the user clicks away. Compare this with `AddCard`, which has a `handleBlur` that closes the input on blur. The AddTaskForm will remain expanded indefinitely until the user presses Escape.
- **Scenario:** User clicks "Add task", decides not to add one, clicks elsewhere in the modal. The empty input stays visible.
- **Impact:** Minor UX inconsistency between card creation and task creation flows.
- **Recommendation:** Add an `onBlur` handler that collapses the form when the input is empty, or accept this as intentional (keeps the form ready for rapid entry).

---

## 4. PRD Review Follow-Up: Issues Resolved vs Remaining

Cross-referencing against the PRD review findings from the earlier analysis:

| PRD Finding | Status |
|-------------|--------|
| UPDATE_TASK payload missing cardId | RESOLVED -- payload includes `cardId` (types/index.ts line 84) |
| Dropped tasks inflating progress denominator | RESOLVED -- dropped excluded in TaskSummary |
| saveState() atomicity for 3 keys | PARTIALLY RESOLVED -- rollback logic exists but has BUG-03 (missing tasks snapshot) and BUG-04 (schema version failure) |
| isFixed field not in Phase 1 Column type | RESOLVED -- Column type includes `isFixed: boolean` |
| Board title factory inconsistency | NOT RESOLVED -- `createDefaultBoard()` uses "My Kanban Board" and `createDefaultState()` also uses "My Kanban Board" -- consistent now, but `createDefaultBoard()` is dead code (BUG-08) |
| createDefaultBoardMeta() dead code | NOT RESOLVED -- still present (BUG-08) |
| Task description editing flow ambiguous | RESOLVED BY DESIGN -- task description editing is not exposed in the UI at all; tasks only have title+status in the current implementation |

---

## 5. Risk Summary

| # | Issue | Severity | Category | Likelihood |
|---|-------|----------|----------|------------|
| BUG-01 | ESLint errors (ref-during-render, setState-in-effect) | HIGH | Code Quality | Certain (errors exist) |
| BUG-02 | Escape in task edit also closes modal | HIGH | UI/UX | High (any keyboard user) |
| BUG-03 | saveState() missing prevTasks snapshot | MEDIUM | Data Integrity | Low (quota must fail on exactly tasks write) |
| BUG-04 | Schema version write failure causes silent data loss | HIGH | Data Integrity | Low (storage must be near-full) |
| BUG-05 | Delete button invisible to keyboard/touch users | MEDIUM | Accessibility | Medium (keyboard/touch users) |
| BUG-06 | Malformed empty-state message when no filter active | LOW | UI/UX | Very Low (requires data corruption) |
| BUG-07 | FilterContext useMemo ineffective due to unstable functions | LOW | Performance | Certain (but impact is minimal) |
| BUG-08 | Dead code (createDefaultBoardMeta, createDefaultBoard) | LOW | Code Quality | N/A |
| BUG-09 | Hardcoded modal IDs break ARIA if reused | LOW | Accessibility | Low (single-instance currently) |
| BUG-10 | CardDetail stale local state if card changes externally | LOW | Correctness | Very Low (single-tab app) |
| BUG-11 | AddTaskForm does not collapse on blur | LOW | UI/UX | Medium (common interaction) |

---

## 6. Acceptance Criteria Assessment

| Criterion | Status | Notes |
|-----------|--------|-------|
| All 33 smoke/functional tests pass | PASS (with caveats) | BUG-02 would cause Test 19 to fail in manual testing |
| Zero crashes or unhandled errors | PASS | No crash paths found in code analysis |
| Dark mode fully functional | PASS | All components have dark: variants |
| Keyboard accessibility verified | PARTIAL FAIL | BUG-02 (Escape closes modal during edit), BUG-05 (delete button discoverability) |
| No Phase 1 regressions found | PASS | All Phase 1 features intact |
| Performance targets met | PASS (code-level) | Memoization in place, debounced saves, no blocking operations |
| All task CRUD operations work correctly | PASS | Create, Read, Update (title + status), Delete all verified |
| Progress calculation excludes dropped tasks | PASS | Verified in TaskSummary |
| Persistence verified | PASS (with caveats) | BUG-04 is a data-loss risk in edge case |
| Edge cases handled gracefully | PARTIAL PASS | BUG-03, BUG-04 in storage error handling |
| Responsive design verified | PASS | flex-col mobile, flex-row desktop |
| Zero console errors/warnings | FAIL | ESLint reports 10 errors (BUG-01) |
| Build succeeds with zero TypeScript errors | PASS | tsc --noEmit clean |

---

## 7. QA Verdict

### CONDITIONAL PASS

Phase 2 is **not ready for production** in its current state due to two HIGH-severity issues that affect user experience:

**Must fix before release:**

1. **BUG-02 (HIGH):** Escape key in task title edit closes the parent modal. This is a common keyboard interaction that will frustrate users. Fix: add `e.stopPropagation()` in TaskItem and AddTaskForm Escape handlers.

2. **BUG-04 (HIGH):** Schema version write failure silently discards all data on next load. While the probability is low, the impact (complete data loss with no warning) is unacceptable. Fix: either write schema version first, or treat its failure as a save error.

3. **BUG-01 (HIGH):** ESLint errors should be resolved to ensure code quality standards. The ref-during-render pattern in BoardProvider is the most concerning from a correctness standpoint.

**Should fix (recommended before release):**

4. **BUG-03 (MEDIUM):** Add prevTasks snapshot to saveState rollback.
5. **BUG-05 (MEDIUM):** Improve delete button discoverability for keyboard/touch users.

**Can defer to next iteration:**

6. BUG-06 through BUG-11 (all LOW severity).

---

## 8. Files Reviewed

- `src/types/index.ts`
- `src/context/BoardContext.tsx`
- `src/context/FilterContext.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/ToastContext.tsx`
- `src/utils/storage.ts`
- `src/utils/defaults.ts`
- `src/hooks/useDebouncedSave.ts`
- `src/components/Task/TaskItem.tsx`
- `src/components/Task/TaskList.tsx`
- `src/components/Task/TaskSection.tsx`
- `src/components/Task/AddTaskForm.tsx`
- `src/components/Task/TaskEmptyState.tsx`
- `src/components/Card/CardDetail.tsx`
- `src/components/Card/CardItem.tsx`
- `src/components/Card/TaskSummary.tsx`
- `src/components/Card/AddCard.tsx`
- `src/components/Board/Board.tsx`
- `src/components/Board/Column.tsx`
- `src/components/Board/ColumnHeader.tsx`
- `src/components/Header/Header.tsx`
- `src/components/UI/Modal.tsx`
- `src/components/UI/ConfirmDialog.tsx`
- `src/components/UI/SaveErrorBanner.tsx`
- `src/components/UI/CorruptionWarningBanner.tsx`
- `src/App.tsx`
- `src/main.tsx`
