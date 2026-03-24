---
name: Phase 2 Architecture & Patterns
description: Recurring architectural decisions, state management patterns, and component composition strategies established in Phase 2 implementation
type: project
---

## State Management Pattern

**Normalized state structure** is central to this codebase:
- Board state is split: `board` (structure) + `cards` (normalized by ID) + `tasks` (normalized by ID)
- Actions include `cardId` or `taskId` to enable O(1) lookups and prevent data duplication
- No card-level task arrays contain full Task objects—only IDs, which are dereferenced in components
- This design makes moves and cascading deletes tractable without touching every entity

**Why:** Enables efficient card movement, cascading delete on card removal (via CardContext reducer), and O(1) lookups in component renders.

## Reducer Patterns

**Mutation validation in reducer:**
- Guard against missing parent entities: `if (!existingCard) return state` (ADD_TASK)
- Return state unchanged if validation fails—no null/undefined returns
- Use `withUpdatedAt()` helper to advance board.updatedAt on every mutation
- Cascade delete on parent deletion (DELETE_CARD removes all child tasks)

**Why:** Prevents orphaned data, ensures consistent timestamps, avoids crashes from missing parents.

## Component Composition Pattern

**Container → List → Item hierarchy is standard:**
- TaskSection (container): fetches from context, decides rendering logic (empty state vs list)
- TaskList (list): maps IDs to Items, O(1) lookups, guards against missing tasks
- TaskItem (item): single row CRUD, local state for edit mode
- AddTaskForm (input): controlled component, validation in submitHandler, not in reducer

**Why:** Clear responsibility split, reusable at each level, makes testing granular.

## Inline Edit Pattern for Tasks

**Local state + render condition for edit mode:**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(task.title);

return isEditing ? <input /> : <button onClick={() => setIsEditing(true)} />;
```

**Keyboard handling:**
- Enter → save (via dispatch)
- Escape → cancel (revert local state, exit edit mode)
- Blur → save (same as Enter)
- Ctrl+A not needed (input comes pre-selected via rAF + useEffect)

**Why:** Keeps edit UX local, doesn't pollute global state, avoids expensive re-renders of sibling items.

## Keyboard UX Conventions

**Escape behavior is context-sensitive:**
- AddTaskForm: Escape while empty → collapse; Escape while typed → clear input, keep form open
- TaskItem: Escape → cancel edit without saving
- Generally: Escape = cancel or dismiss, context matters

**Enter behavior is consistent:**
- AddTaskForm: Enter with valid input → create, clear, retain focus
- TaskItem: Enter while editing → save, exit edit mode
- AddTaskForm: Enter with empty → no-op, retain focus

**Focus management:**
- Use `requestAnimationFrame()` when DOM must be ready before focusing
- Store ref once, reuse throughout component lifecycle
- Optional chaining `inputRef.current?.focus()` for safety

**Why:** Users expect these patterns from native form elements, making app feel native.

## Accessibility Standards

**Every interactive element must have:**
1. Clear `aria-label` describing the action (especially buttons)
2. `aria-hidden="true"` on decorative icons
3. Focus management (visible focus ring via focus-visible)
4. For dialogs: `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
5. For sections: `aria-labelledby` linking to section title

**ConfirmDialog integration for destructive actions:**
- Always use ConfirmDialog for delete/destructive operations
- Title: "Delete [entity]?"
- Message: Include entity name and "This cannot be undone"
- Cancel button defaults to focus (safer for destructive actions)
- Escape cancels and stops propagation to parent Modal

**Why:** Ensures app is usable by keyboard-only and screen-reader users, meets WCAG AA.

## Dark Mode Strategy

**Every color must have dark: variant:**
- Text: `text-slate-700 dark:text-slate-200`
- Background: `bg-white dark:bg-slate-600`
- Borders: `border-slate-300 dark:border-slate-500`
- Badges/highlights: Use opacity for darks (e.g., `dark:bg-blue-900/40`)

**Contrast verification:**
- Light mode: Black text on light backgrounds, light text on dark overlays
- Dark mode: Light text on dark backgrounds, enough contrast for readability
- Focus rings always visible in both modes

**Why:** Application must be usable in low-light environments, improves accessibility.

## Type Safety

**Strict TypeScript conventions:**
- No `any` types
- Union types for enums (e.g., `TaskStatus = "todo" | "in_progress" | ...`)
- Partial<T> for update payloads (not every field must be provided)
- Exhaustiveness checks in reducers (`const _exhaustive: never = action`)
- All prop interfaces clearly defined

**Why:** Catch errors at compile time, makes refactoring safer.

## Barrel Exports

**Pattern:** `/components/Task/index.ts` exports all Task components
```typescript
export { TaskSection } from "./TaskSection";
export { TaskList } from "./TaskList";
export { TaskItem } from "./TaskItem";
export { AddTaskForm } from "./AddTaskForm";
export { TaskEmptyState } from "./TaskEmptyState";
```

**Usage:** `import { TaskSection, TaskList } from "components/Task"`

**Why:** Simplifies imports, groups related exports, makes refactoring easier.

## Timestamp Convention

**All dates use ISO 8601 format:**
```typescript
const now = new Date().toISOString(); // "2026-03-23T13:16:04.000Z"
```

**Consistent across:**
- Task creation (AddTaskForm)
- Card updates (CardDetail)
- Reducer mutations (boardReducer)

**Why:** Language-agnostic format, sorts correctly as strings, works across timezones.

## Form Submission Patterns

**Three approaches seen so far:**

1. **Controlled component with Enter handler** (AddTaskForm):
   - Local state: inputValue
   - Validation in handler: trim, length checks, empty check
   - Dispatch on valid Enter
   - No form element needed

2. **Inline edit with blur + Enter** (TaskItem):
   - Local state: isEditing, editValue
   - Both blur and Enter save the same way
   - Escape cancels
   - Revert to original on empty

3. **Modal field blur** (CardDetail):
   - Local state initialized from card
   - Blur handler runs validation + dispatch
   - No Enter submission needed (blur is primary trigger)

**Why:** Depends on interaction pattern. Inline forms use Enter; modal fields use blur.

## Loading & Error States

**No explicit loading states currently:**
- State mutations are synchronous (reducer runs immediately)
- Persistence is debounced in background (via useDebouncedSave)
- No spinner shown for task mutations
- Save error banner shown if localStorage fails

**Why:** User feedback is immediate (optimistic updates), and network latency is not a concern for local state.

## Tech Debt Patterns

**Common tech debt identified:**
1. Missing unit/integration tests for interactive components
2. No dev-mode console warnings for state corruption (orphaned IDs)
3. Edge case UX for "empty submit" scenarios (different feedback approaches per component)
4. No observable audit trail for debugging state issues

**Why:** Phase 1 & 2 focused on feature delivery. Testing and observability come in Polish (P2-008).

## Future Extensibility

**Patterns established for adding more Task features:**
- Task description field: likely follows AddTaskForm pattern (local state → dispatch)
- Task assignee/due date: follow status dropdown pattern (select + immediate dispatch)
- Task subtasks: would follow TaskList pattern (normalized in state, rendered as list)
- Task history/audit: would use action log from reducer
