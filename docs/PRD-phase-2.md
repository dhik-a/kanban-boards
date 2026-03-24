> **Note:** This document covers Phase 2 of the Kanban board application. Phase 2 introduces nested Tasks within Cards, a fixed 5-column board structure, and task-status filtering. It replaces the previously planned multi-board Phase 2 direction. For the foundational single-board implementation, see [PRD-phase-1.md](./PRD-phase-1.md).

# Product Requirements Document: Kanban Board App — Phase 2 (Tasks)

## Metadata

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| Project       | Kanban Board                           |
| Version       | 2.0.0                                  |
| Phase         | 2 — Tasks & Simplified Structure       |
| Status        | Draft                                  |
| Created       | 2026-03-23                             |
| Depends on    | Phase 1 (complete)                     |
| Stack         | React, TypeScript, Tailwind CSS        |
| Persistence   | localStorage                           |

---

## 1. Product Vision

### 1.1 Philosophy

This product exists for people who want the clarity of a Kanban board without the overhead of enterprise project management tools. The guiding principle is **simplicity-first**: every feature must earn its place by reducing friction, not adding configuration. If a user has to read documentation to use a feature, the feature is too complex.

Phase 2 deepens the board's usefulness by introducing **Tasks** as first-class entities nested inside Cards. A Card becomes a container for related work items, and each Task carries its own status independent of the Card's column position. This gives users the ability to track granular progress without leaving the lightweight Kanban paradigm.

### 1.2 Problem Statement

In Phase 1, a Card is an atomic unit with no internal structure. Users who want to break a larger piece of work into sub-steps have no way to do so within the app. They resort to writing checklists in the description field (unstructured text with no status tracking), or they create many fine-grained Cards that clutter the board and dilute the value of column-level organization.

### 1.3 Solution

Introduce a **Task** entity that lives inside a Card. Each Task has a title, optional description, and one of five statuses. Users manage Tasks exclusively through the Card detail modal. The board view shows a compact summary of task progress on each Card, and a new filter mechanism lets users find Cards based on the statuses of their Tasks.

Simultaneously, Phase 2 **simplifies the board structure** by locking columns to a fixed set of five (matching the five task statuses) and removing column creation, deletion, and reordering. This aligns the board's visual structure with the task lifecycle and removes configuration surface area that adds complexity without proportional value for the target audience.

### 1.4 Goals

- Allow users to decompose Cards into trackable sub-items (Tasks)
- Provide at-a-glance progress visibility on each Card in the board view
- Enable filtering the board by task status to answer questions like "show me everything that's blocked"
- Reduce configuration burden by fixing the column structure
- Maintain the zero-setup, offline-first, localStorage-backed architecture from Phase 1

### 1.5 Non-Goals (Phase 2)

- Multi-board support
- Backend API / database persistence
- User authentication
- Real-time collaboration
- Task priority, labels, or assignee fields
- Task drag-and-drop reordering (tasks ordered by creation date)
- Adding tasks directly from the board view (only via Card detail modal)
- Task due dates or time tracking
- Subtasks within Tasks (single nesting level only)

---

## 2. Target User

**Persona: Solo practitioner or small-team lead (2-5 people)**

- Uses a Kanban board for personal productivity or lightweight team coordination
- Wants to break work into steps without adopting a full project management suite
- Values speed and simplicity over configurability
- Comfortable with a browser-based tool; does not need mobile-native
- Current workaround: writes checklists in Card descriptions, or creates excessive Cards

---

## 3. Board Structure Changes

### 3.1 Fixed Five-Column Layout

Phase 2 replaces the flexible column system with a **fixed, non-configurable set of five columns**:

| Position | Column Title   | Accent Color | Semantic Meaning                        |
| -------- | -------------- | ------------ | --------------------------------------- |
| 1        | To Do          | `#94a3b8`    | Work not yet started                    |
| 2        | In Progress    | `#3b82f6`    | Work actively being done                |
| 3        | Done           | `#22c55e`    | Work completed successfully             |
| 4        | Dropped        | `#ef4444`    | Work intentionally abandoned            |
| 5        | Blocked        | `#f59e0b`    | Work stalled due to external dependency |

These columns are structural and permanent. They cannot be renamed, reordered, added, or deleted.

### 3.2 Removed Column Features

The following Phase 1 features are **removed** in Phase 2:

| Removed Feature           | Phase 1 ID | Reason                                                      |
| ------------------------- | ---------- | ----------------------------------------------------------- |
| Add new column            | C-002      | Columns are now fixed; adding creates inconsistency         |
| Edit column title         | C-003      | Titles are semantic and must not change                     |
| Delete column             | C-004      | Removing a status column breaks the task lifecycle model    |
| Reorder columns via DnD   | C-005      | Column order is meaningful and fixed                        |
| Set column accent color   | C-006      | Colors are semantically assigned to status meaning          |

**Retained Column Features:**

| Feature                        | Phase 1 ID | Notes                                          |
| ------------------------------ | ---------- | ---------------------------------------------- |
| Display columns horizontally   | C-001      | Unchanged                                      |
| Card count badge               | C-007      | Unchanged                                      |

### 3.3 Data Migration

**Phase 2 uses a fresh-start approach:** On first load after the Phase 2 upgrade, any existing Phase 1 data is discarded and the board starts with the default Phase 2 schema (5 fixed columns, empty task map). No fuzzy column title matching or data preservation is attempted.

This simplified approach is acceptable because:
- The app is in pre-production with zero real users.
- The Phase 2 schema is sufficiently different (fixed columns, tasks as first-class entities) that a clean break is cleaner than attempting to preserve arbitrary Phase 1 structures.
- Users expect to lose demo data when upgrading pre-release software.

**Fresh Install Flow:**
1. Check for `kanban_schema_version` in localStorage. If absent or less than 2, proceed with fresh install (ignore any Phase 1 keys).
2. Create the five fixed columns with new IDs.
3. Initialize the default `AppState` with empty Cards and empty Tasks.
4. Write `kanban_schema_version: 2` to localStorage to mark the schema upgrade complete.
5. Subsequent loads check `kanban_schema_version` and skip re-initialization.

---

## 4. Data Model

### 4.1 Task (New Entity)

```typescript
type TaskStatus = "todo" | "in_progress" | "done" | "dropped" | "blocked";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

**Constraints:**
- Task title: required, max 200 characters
- Task description: optional (empty string default), max 1000 characters
- Task status: required, defaults to `"todo"` on creation
- Task status is independent of the parent Card's column position
- Tasks are ordered by `createdAt` ascending (oldest first); no manual reordering

### 4.2 Card (Modified)

```typescript
interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  taskIds: string[];     // NEW — ordered list of task IDs
  createdAt: string;
  updatedAt: string;
}
```

The only structural change to Card is the addition of `taskIds: string[]`. All other fields remain unchanged from Phase 1.

### 4.3 Column (Modified)

```typescript
interface Column {
  id: string;
  title: string;          // Now read-only from the UI perspective
  cardIds: string[];
  color: string;          // Now fixed per column, not user-configurable
  isFixed: true;          // NEW — signals that this column cannot be modified
}
```

### 4.4 AppState (Modified)

```typescript
interface AppState {
  board: Board;
  cards: Record<string, Card>;
  tasks: Record<string, Task>;   // NEW — normalized task storage by ID
}
```

### 4.5 localStorage Schema

| Key                     | Type                     | Description                              |
| ----------------------- | ------------------------ | ---------------------------------------- |
| `kanban_board`          | `Board`                  | Board structure with fixed columns       |
| `kanban_cards`          | `Record<string, Card>`   | All cards indexed by ID                  |
| `kanban_tasks`          | `Record<string, Task>`   | All tasks indexed by ID (NEW)            |
| `kanban_theme`          | `string`                 | Theme preference                         |
| `kanban_schema_version` | `number`                 | Schema version for migration detection (NEW) |

---

## 5. Features

### 5.1 Task Management

| ID     | Requirement                                                  | Priority |
| ------ | ------------------------------------------------------------ | -------- |
| T-001  | View list of tasks within Card detail modal                  | P0       |
| T-002  | Add a new task via inline form in Card detail modal          | P0       |
| T-003  | Edit task title inline in Card detail modal                  | P0       |
| T-004  | Edit task description in Card detail modal                   | P1       |
| T-005  | Change task status via dropdown/select in Card detail modal  | P0       |
| T-006  | Delete a task (with confirmation)                            | P0       |
| T-007  | Display task count summary on Card in board view             | P0       |
| T-008  | Display task progress bar on Card in board view              | P1       |
| T-009  | Tasks ordered by creation date (oldest first)                | P0       |
| T-010  | Empty state message when Card has no tasks                   | P0       |

**Task Add Flow:**
1. User clicks "Add Task" button in Card detail modal.
2. An inline text input appears at the bottom of the task list.
3. User types task title and presses Enter (or clicks a confirm button).
4. Task is created with status `"todo"` and empty description.
5. Input clears and remains visible for rapid sequential entry.
6. Pressing Escape or clicking away dismisses the input without creating a task.

**Task Status Change Flow:**
1. Each task row shows a status dropdown/selector.
2. User selects a new status from the five options.
3. Status updates immediately (optimistic).
4. No confirmation dialog needed for status changes.

**Task Delete Flow:**
1. Each task row has a delete icon/button.
2. Clicking triggers a confirmation dialog: "Delete task '[title]'? This cannot be undone."
3. On confirm, task is removed from Card's `taskIds` and from `tasks` storage.

### 5.2 Card Board View Changes

| ID     | Requirement                                                  | Priority |
| ------ | ------------------------------------------------------------ | -------- |
| V-001  | Card shows compact task summary: "X/Y tasks done"           | P0       |
| V-002  | Card shows mini progress bar (done tasks / total tasks)      | P1       |
| V-003  | Cards with zero tasks show no task summary element           | P0       |
| V-004  | Task summary counts only "done" status as completed          | P0       |

**Summary Display Logic:**
- If a Card has 0 tasks: no task summary or progress bar is rendered.
- If a Card has tasks: show "X/Y tasks" where X = count of tasks with status `"done"`, Y = total task count **excluding dropped tasks**.
- Progress bar width = (done count / total count-excluding-dropped) * 100%.
- **"Dropped" tasks are excluded entirely from the progress denominator** — they do not count toward "Y" in "X/Y tasks".
- "Blocked" tasks are included in the total count but NOT counted as done (they still count toward Y).

### 5.3 Task Status Filter

| ID     | Requirement                                                  | Priority |
| ------ | ------------------------------------------------------------ | -------- |
| F-001  | Display task status filter as a group of checkboxes          | P0       |
| F-002  | Five checkboxes, one per task status                         | P0       |
| F-003  | All checkboxes unchecked by default (no filter active)       | P0       |
| F-004  | When one or more statuses are checked, filter Cards          | P0       |
| F-005  | A Card passes the filter if it has at least one task matching any checked status | P0 |
| F-006  | Cards with zero tasks are hidden when any status filter is active | P0 |
| F-007  | Status filter combines with existing search and priority filters (AND logic) | P1 |
| F-008  | "Clear all filters" button resets status checkboxes too      | P0 |
| F-009  | Show "No matching cards" state when filters yield empty results | P0 |
| F-010  | DnD is disabled when any filter (including task status) is active | P0 |

**Filter Behavior Details:**
- Checking "Blocked" shows only Cards that contain at least one task with status `"blocked"`.
- Checking both "Blocked" and "In Progress" shows Cards that contain at least one task that is either blocked OR in progress.
- The task status filter operates with OR logic among checked statuses, but AND logic with the search query and priority filter.
- Example: if the user types "API" in search AND checks "Blocked", only Cards whose title contains "API" AND which have at least one blocked task are shown.

### 5.4 Removed Features

| Removed Feature                | Phase 1 ID | Replaced By / Reason                                |
| ------------------------------ | ---------- | ---------------------------------------------------- |
| Add Column button              | C-002      | Columns are fixed                                    |
| Column title editing           | C-003      | Titles are semantic and read-only                    |
| Delete Column                  | C-004      | Columns cannot be removed                            |
| Column drag reorder            | C-005      | Column order is fixed                                |
| Column color picker            | C-006      | Colors are semantically assigned                     |

### 5.5 Retained Phase 1 Features (Unchanged)

All other Phase 1 features continue to work as specified:
- Board title editing (B-001, B-002)
- Board auto-save and load (B-003, B-004, B-005)
- Card CRUD (K-001 through K-011)
- Card drag-and-drop between columns and within columns (D-001 through D-005)
- Search by card title (S-001)
- Filter by priority (S-002)
- Filter by label (S-003)
- Clear all filters (S-004) — extended to include task status
- No results state (S-005) — extended to cover task status filter
- All UI/UX features (U-001 through U-006)

---

## 6. State Management

### 6.1 New Actions

```typescript
type Action =
  // ... all existing Phase 1 actions, MINUS column mutation actions ...
  // Phase 1 actions REMOVED:
  //   ADD_COLUMN
  //   DELETE_COLUMN
  //   REORDER_COLUMNS
  //   UPDATE_COLUMN (color and title changes — keep for internal migration use only)

  // Phase 1 actions RETAINED:
  | { type: "SET_BOARD_TITLE"; payload: string }
  | { type: "ADD_CARD"; payload: { columnId: string; card: Card } }
  | { type: "UPDATE_CARD"; payload: { id: string; updates: Partial<Card> } }
  | { type: "DELETE_CARD"; payload: { id: string; columnId: string } }
  | { type: "MOVE_CARD"; payload: { cardId: string; sourceColumnId: string; destinationColumnId: string; sourceIndex: number; destinationIndex: number; newCardIds?: string[] } }
  | { type: "LOAD_STATE"; payload: AppState }

  // Phase 2 NEW actions:
  | { type: "ADD_TASK"; payload: { cardId: string; task: Task } }
  | { type: "UPDATE_TASK"; payload: { id: string; cardId: string; updates: Partial<Omit<Task, "id" | "createdAt">> } }
  | { type: "DELETE_TASK"; payload: { taskId: string; cardId: string } }
```

### 6.2 Action Semantics

**ADD_TASK:**
- Adds the task to `state.tasks` keyed by `task.id`.
- Appends `task.id` to the parent Card's `taskIds` array.
- Updates Card's `updatedAt` and Board's `updatedAt`.

**UPDATE_TASK:**
- Takes both `id` (task ID) and `cardId` (parent card ID) for efficient parent lookups.
- Merges `updates` into the existing task in `state.tasks`.
- Sets task's `updatedAt` to current timestamp.
- Updates Card's `updatedAt` (via `cardId`) and Board's `updatedAt`.
- If the task ID does not exist in `state.tasks`, the action is a no-op (return current state).

**DELETE_TASK:**
- Removes `taskId` from the parent Card's `taskIds` array.
- Deletes the task from `state.tasks`.
- Updates Card's `updatedAt` and Board's `updatedAt`.
- If the task ID does not exist, the action is a no-op.

**DELETE_CARD (modified):**
- When a Card is deleted, all Tasks referenced by the Card's `taskIds` must also be deleted from `state.tasks`.

### 6.3 Filter State Extension

```typescript
interface FilterContextValue {
  // Existing Phase 1 fields:
  searchQuery: string;
  priorityFilter: PriorityFilter;
  labelFilter: string | null;
  isFiltering: boolean;

  // Phase 2 NEW:
  taskStatusFilter: Set<TaskStatus>;   // empty set = no filter

  // Existing setters:
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: PriorityFilter) => void;
  setLabelFilter: (label: string | null) => void;
  clearFilters: () => void;

  // Phase 2 NEW:
  toggleTaskStatusFilter: (status: TaskStatus) => void;
}
```

- `isFiltering` must now also return `true` when `taskStatusFilter.size > 0`.
- `clearFilters` must also reset `taskStatusFilter` to an empty set.

### 6.4 Persistence Strategy

Unchanged from Phase 1 (debounced localStorage writes) with two additions:
- `state.tasks` is serialized/deserialized alongside `state.board` and `state.cards`.
- A `kanban_schema_version` key is checked on load to determine whether migration is needed.

---

## 7. Component Architecture

### 7.1 Updated Component Tree

```
App
+-- Header
|   +-- BoardTitle (editable)
|   +-- SearchBar
|   +-- FilterControls
|   |   +-- PriorityFilter (existing)
|   |   +-- TaskStatusFilter (NEW)
|   |   +-- ClearFiltersButton
|   +-- ThemeToggle
+-- Board
|   +-- Column (x5, fixed)
|   |   +-- ColumnHeader
|   |   |   +-- ColumnTitle (read-only now)
|   |   |   +-- CardCount
|   |   +-- CardList (droppable)
|   |   |   +-- CardItem (draggable, repeated)
|   |   |       +-- CardTitle
|   |   |       +-- PriorityBadge
|   |   |       +-- LabelChips
|   |   |       +-- TaskSummary (NEW)
|   |   |           +-- TaskCountText ("3/5 tasks")
|   |   |           +-- TaskProgressBar
|   |   +-- AddCardButton
+-- CardDetailModal
|   +-- TitleInput
|   +-- DescriptionInput
|   +-- PrioritySelect
|   +-- LabelsInput
|   +-- TaskSection (NEW)
|   |   +-- TaskList (NEW)
|   |   |   +-- TaskItem (repeated) (NEW)
|   |   |       +-- TaskTitleInput (inline edit)
|   |   |       +-- TaskStatusSelect
|   |   |       +-- TaskDeleteButton
|   |   +-- AddTaskForm (NEW)
|   |   +-- TaskEmptyState (NEW)
|   +-- MetadataDisplay (dates)
|   +-- DeleteButton
+-- ConfirmDialog
```

### 7.2 New Components

| Component          | Location                              | Purpose                                            |
| ------------------ | ------------------------------------- | -------------------------------------------------- |
| `TaskSummary`      | `src/components/Card/TaskSummary.tsx`  | Compact "X/Y tasks" + progress bar on board cards  |
| `TaskSection`      | `src/components/Task/TaskSection.tsx`  | Container for task list + add form in Card detail   |
| `TaskList`         | `src/components/Task/TaskList.tsx`     | Renders ordered list of TaskItem components         |
| `TaskItem`         | `src/components/Task/TaskItem.tsx`     | Single task row: title, status select, delete       |
| `AddTaskForm`      | `src/components/Task/AddTaskForm.tsx`  | Inline input for creating new tasks                 |
| `TaskEmptyState`   | `src/components/Task/TaskEmptyState.tsx`| "No tasks yet" message with prompt                 |
| `TaskStatusFilter` | `src/components/Header/TaskStatusFilter.tsx` | Checkbox group for 5 task statuses           |

### 7.3 Modified Components

| Component          | Change                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `CardItem`         | Add `TaskSummary` child when card has tasks                           |
| `CardDetail`       | Add `TaskSection` below existing fields                               |
| `ColumnHeader`     | Remove edit-title functionality; title is now read-only               |
| `Column`           | Remove delete and color-change menu items                             |
| `Board`            | Remove `AddColumnButton`; always render exactly 5 columns             |
| `FilterControls`   | Add `TaskStatusFilter` component                                      |
| `FilterContext`    | Add `taskStatusFilter` state and `toggleTaskStatusFilter`             |
| `BoardContext`     | Add task-related reducer cases; extend DELETE_CARD; add tasks to state |

---

## 8. File Structure (Phase 2 Changes)

```
src/
+-- components/
|   +-- Board/
|   |   +-- Board.tsx              (modified: remove AddColumn, fix 5 columns)
|   |   +-- Column.tsx             (modified: remove column menu actions)
|   |   +-- ColumnHeader.tsx       (modified: read-only title)
|   |   +-- AddColumn.tsx          (DELETED or unused)
|   |   +-- index.ts
|   +-- Card/
|   |   +-- CardItem.tsx           (modified: add TaskSummary)
|   |   +-- CardDetail.tsx         (modified: add TaskSection)
|   |   +-- TaskSummary.tsx        (NEW)
|   |   +-- AddCard.tsx
|   |   +-- index.ts
|   +-- Task/                      (NEW directory)
|   |   +-- TaskSection.tsx        (NEW)
|   |   +-- TaskList.tsx           (NEW)
|   |   +-- TaskItem.tsx           (NEW)
|   |   +-- AddTaskForm.tsx        (NEW)
|   |   +-- TaskEmptyState.tsx     (NEW)
|   |   +-- index.ts               (NEW)
|   +-- Header/
|   |   +-- Header.tsx
|   |   +-- SearchBar.tsx
|   |   +-- FilterControls.tsx     (modified: add TaskStatusFilter)
|   |   +-- TaskStatusFilter.tsx   (NEW)
|   |   +-- index.ts
|   +-- UI/
|       +-- (unchanged)
+-- context/
|   +-- BoardContext.tsx            (modified: tasks in state, new actions)
|   +-- FilterContext.tsx           (modified: taskStatusFilter)
|   +-- ThemeContext.tsx
+-- hooks/
|   +-- useLocalStorage.ts
|   +-- useDebouncedSave.ts
+-- types/
|   +-- index.ts                   (modified: Task type, TaskStatus, updated Card)
+-- utils/
|   +-- defaults.ts                (modified: 5 fixed columns, empty tasks map)
|   +-- storage.ts                 (modified: read/write tasks, schema version)
|   +-- migration.ts               (NEW: Phase 1 -> Phase 2 data migration)
+-- App.tsx
+-- main.tsx
+-- index.css
```

---

## 9. User Stories & Acceptance Criteria

### 9.1 Viewing Tasks in a Card

**User Story:**
As a user, I want to see the tasks within a Card when I open its detail modal, so that I can understand the breakdown of work for that Card.

**Scenario 1: Card with existing tasks**
```gherkin
Given a Card exists with 3 tasks (statuses: "todo", "in_progress", "done")
When the user clicks on the Card to open the detail modal
Then the modal displays a "Tasks" section below the Card description
And the section shows 3 task rows ordered by creation date (oldest first)
And each task row displays the task title, current status, and a delete button
```

**Scenario 2: Card with no tasks**
```gherkin
Given a Card exists with zero tasks
When the user clicks on the Card to open the detail modal
Then the modal displays a "Tasks" section with the message "No tasks yet. Add one to break this card into steps."
And an "Add Task" button or input is visible below the empty state message
```

**Scenario 3: Task summary on board card**
```gherkin
Given a Card exists with 5 tasks where 2 have status "done"
When the user views the board
Then the Card displays "2/5 tasks" below the card title area
And a progress bar shows 40% filled
```

**Scenario 4: Board card with no tasks shows no summary**
```gherkin
Given a Card exists with zero tasks
When the user views the board
Then the Card does not display any task summary or progress bar
```

### 9.2 Adding a Task in Card Detail

**User Story:**
As a user, I want to add tasks to a Card from the detail modal, so that I can break down the Card's work into smaller steps.

**Scenario 1: Successfully add a task**
```gherkin
Given the user has the Card detail modal open
When the user clicks "Add Task"
And types "Write unit tests" in the task title input
And presses Enter
Then a new task titled "Write unit tests" is created with status "todo"
And the task appears at the bottom of the task list
And the input field clears and remains visible for adding another task
And the board card's task summary updates to reflect the new count
```

**Scenario 2: Dismiss add task without creating**
```gherkin
Given the user has the task title input visible in the Card detail modal
And the input is empty
When the user presses Escape or clicks outside the input
Then no task is created
And the input is dismissed
```

**Scenario 3: Attempt to add a task with empty title**
```gherkin
Given the user has the task title input visible
And the input field is empty or contains only whitespace
When the user presses Enter
Then no task is created
And the input remains visible with focus retained
```

**Scenario 4: Attempt to add a task with title exceeding 200 characters**
```gherkin
Given the user has typed more than 200 characters in the task title input
When the user presses Enter
Then the title is truncated to 200 characters
And the task is created with the truncated title
```

**Scenario 5: Rapid sequential task creation**
```gherkin
Given the user has just created a task by pressing Enter
When the input clears
Then the input retains focus
And the user can immediately type and press Enter to create another task
```

### 9.3 Changing Task Status

**User Story:**
As a user, I want to change a task's status within the Card detail modal, so that I can track which sub-steps are complete, blocked, or dropped.

**Scenario 1: Change task status from "todo" to "in_progress"**
```gherkin
Given the Card detail modal is open with a task in "todo" status
When the user selects "In Progress" from the task's status dropdown
Then the task's status updates to "in_progress" immediately
And the board card's task summary updates accordingly
And no confirmation dialog is shown
```

**Scenario 2: Change task status to "done"**
```gherkin
Given a Card has 3 tasks with 1 already "done"
And the Card detail modal is open
When the user changes a second task's status to "done"
Then the board card summary updates from "1/3 tasks" to "2/3 tasks"
And the progress bar updates from 33% to 67%
```

**Scenario 3: Change task status to "blocked"**
```gherkin
Given the Card detail modal is open with a task in "in_progress" status
When the user selects "Blocked" from the task's status dropdown
Then the task's status updates to "blocked"
And the task row displays a visual indicator of the blocked state (e.g., amber/yellow accent)
```

**Scenario 4: Change task status to "dropped"**
```gherkin
Given a Card has 2 tasks, both "todo"
When the user changes one task's status to "dropped"
Then the board card summary shows "0/1 tasks" (dropped tasks excluded from total)
And the progress bar shows 0%
And the dropped task no longer counts toward the progress denominator
```

**Scenario 5: All tasks marked as "done"**
```gherkin
Given a Card has 3 tasks and the user marks the last remaining task as "done"
Then the board card summary shows "3/3 tasks"
And the progress bar shows 100% filled
```

### 9.4 Editing Task Details

**User Story:**
As a user, I want to edit a task's title and description, so that I can refine my sub-steps as the work evolves.

**Scenario 1: Edit task title inline**
```gherkin
Given the Card detail modal is open with a task titled "Draft spec"
When the user clicks on the task title text
Then the title becomes an editable text input with the current value
When the user changes the text to "Draft technical spec" and presses Enter or clicks away
Then the task title updates to "Draft technical spec"
```

**Scenario 2: Edit task description**
```gherkin
Given the Card detail modal is open
When the user clicks on a task to expand its detail (or clicks an edit icon)
Then a description text area appears
When the user types a description and clicks away
Then the task description is saved
```

**Scenario 3: Cancel task title edit**
```gherkin
Given the user is editing a task title
When the user presses Escape
Then the edit is cancelled and the original title is restored
```

### 9.5 Deleting a Task

**User Story:**
As a user, I want to delete a task from a Card, so that I can remove sub-steps that are no longer relevant.

**Scenario 1: Delete a task with confirmation**
```gherkin
Given the Card detail modal is open with a task titled "Set up CI"
When the user clicks the delete button on the task row
Then a confirmation dialog appears with the message "Delete task 'Set up CI'? This cannot be undone."
When the user clicks "Delete"
Then the task is removed from the task list
And the board card's task summary updates to reflect the new count
```

**Scenario 2: Cancel task deletion**
```gherkin
Given the confirmation dialog is showing for task deletion
When the user clicks "Cancel"
Then the dialog closes
And the task remains in the list unchanged
```

**Scenario 3: Delete last task in a Card**
```gherkin
Given a Card has exactly 1 task
When the user deletes that task
Then the task list shows the empty state message "No tasks yet. Add one to break this card into steps."
And the board card no longer displays a task summary or progress bar
```

### 9.6 Filtering by Task Status

**User Story:**
As a user, I want to filter the board by task status, so that I can quickly find Cards that have blocked, in-progress, or other specific tasks.

**Scenario 1: Filter by a single task status**
```gherkin
Given the board has 3 Cards:
  - Card A with tasks: 1 "blocked", 1 "done"
  - Card B with tasks: 2 "in_progress"
  - Card C with no tasks
When the user checks the "Blocked" status filter checkbox
Then only Card A is visible on the board
And Card B and Card C are hidden
```

**Scenario 2: Filter by multiple task statuses (OR logic)**
```gherkin
Given the board has 3 Cards:
  - Card A with tasks: 1 "blocked"
  - Card B with tasks: 1 "in_progress"
  - Card C with tasks: 1 "done"
When the user checks both "Blocked" and "In Progress" filter checkboxes
Then Card A and Card B are visible
And Card C is hidden
```

**Scenario 3: Task status filter combined with search (AND logic)**
```gherkin
Given the board has 3 Cards:
  - Card "API Integration" with tasks: 1 "blocked"
  - Card "API Testing" with tasks: 1 "done"
  - Card "UI Polish" with tasks: 1 "blocked"
When the user types "API" in the search bar
And checks the "Blocked" status filter checkbox
Then only "API Integration" is visible
And "API Testing" is hidden (no blocked tasks)
And "UI Polish" is hidden (does not match search)
```

**Scenario 4: Cards with no tasks are hidden when status filter is active**
```gherkin
Given the board has 2 Cards:
  - Card A with 1 task ("todo")
  - Card B with 0 tasks
When the user checks any task status filter checkbox
Then Card B is hidden regardless of which status is checked
```

**Scenario 5: Clear all filters resets task status checkboxes**
```gherkin
Given the user has checked "Blocked" and "In Progress" status filters
And has typed "API" in the search bar
When the user clicks "Clear all filters"
Then all task status checkboxes are unchecked
And the search bar is cleared
And all Cards are visible again
```

**Scenario 6: No matching cards**
```gherkin
Given no Cards on the board have tasks with status "blocked"
When the user checks the "Blocked" status filter checkbox
Then each column displays an empty state
And a message "No matching cards" is visible
```

**Scenario 7: DnD disabled during filtering**
```gherkin
Given the user has any task status filter checkbox checked
When the user attempts to drag a Card
Then the drag operation does not initiate
And Cards are not draggable
```

### 9.7 Fixed Column Structure

**User Story:**
As a user, I want a pre-defined set of columns that match the work lifecycle, so that I don't have to configure the board structure myself.

**Scenario 1: Fresh install shows 5 fixed columns**
```gherkin
Given the user opens the app for the first time (no localStorage data)
When the board loads
Then 5 columns are displayed: "To Do", "In Progress", "Done", "Dropped", "Blocked"
And no "Add Column" button is visible
And column titles are not editable
```

**Scenario 2: Column headers are read-only**
```gherkin
Given the board is displayed with 5 fixed columns
When the user clicks on a column title
Then nothing happens (no edit mode, no cursor change)
And no column context menu is available
```

**Scenario 3: Fresh install (no Phase 1 data)**
```gherkin
Given the user is loading the app for the first time (no localStorage)
When the app loads
Then the board displays 5 fixed columns: "To Do", "In Progress", "Done", "Dropped", "Blocked"
And all columns are empty
And `kanban_schema_version` is set to 2 in localStorage
```

**Scenario 4: Upgrade from Phase 1 to Phase 2**
```gherkin
Given the user has Phase 1 localStorage data (Phase 1 app version)
When the app loads Phase 2 for the first time (no `kanban_schema_version` key)
Then any Phase 1 data is discarded
And the board displays a fresh 5-column board with 5 fixed columns
And the board is empty (no cards)
And `kanban_schema_version` is set to 2 in localStorage
```

### 9.8 Deleting a Card with Tasks

**Scenario 1: Delete Card that contains tasks**
```gherkin
Given a Card has 4 tasks
When the user deletes the Card (confirms deletion)
Then the Card is removed from the column
And all 4 tasks belonging to that Card are removed from storage
And the tasks do not leak into orphaned state
```

---

## 10. Additional Context & Notes

### 10.1 Current Workaround
Users currently write ad-hoc checklists in the Card description field using plain text like `- [ ] Do thing`. This provides no status tracking, no filtering, and no visual progress indication.

### 10.2 Assumptions
- Phase 1 is fully implemented and stable before Phase 2 development begins.
- The five-column fixed structure is the correct abstraction for the target user. If user feedback strongly requests customizable columns, this decision can be revisited in a future phase.
- Task ordering by creation date is sufficient. If users request manual ordering, it can be added later without schema changes (add an `order` field to Task).
- The "Dropped" and "Blocked" columns are valuable even for solo users (e.g., parking work that is waiting on an external dependency).

### 10.3 Dependencies
- Phase 1 implementation must be complete: Board, Column, Card, DnD, Search, Priority Filter, localStorage persistence.
- Data migration utility must run on first Phase 2 load.
- No new external libraries are expected. The existing stack (React, TypeScript, Tailwind, dnd-kit, lucide-react, uuid) should suffice.

### 10.4 Out of Scope
- Multi-board support (deferred to a future phase or deprioritized)
- Backend/database (Phase 3)
- Task-level priority, labels, or assignees
- Task drag-and-drop reordering
- Quick-add tasks from the board view (only via Card detail modal)
- Subtasks within tasks
- Task due dates
- Notification or reminder system
- Cross-tab localStorage sync

---

## 11. Notes for AI Agents

This section provides precise implementation guidance for AI coding agents working on this ticket.

### 11.1 Type Changes
- Add `TaskStatus` as a union type: `"todo" | "in_progress" | "done" | "dropped" | "blocked"`.
- Add the `Task` interface to `src/types/index.ts`.
- Add `taskIds: string[]` to the existing `Card` interface.
- Add `tasks: Record<string, Task>` to the `AppState` interface.
- Add `ADD_TASK`, `UPDATE_TASK`, and `DELETE_TASK` to the `Action` union type.
- Remove `ADD_COLUMN`, `DELETE_COLUMN`, `REORDER_COLUMNS` from the `Action` union (or mark as deprecated if migration needs them temporarily).

### 11.2 Reducer Changes
- The `DELETE_CARD` case must iterate over `state.cards[id].taskIds` and delete each task from `state.tasks` before removing the card.
- All three new task actions must update `board.updatedAt`.
- Guard `UPDATE_TASK` and `DELETE_TASK` against missing task IDs (return state unchanged).

### 11.3 Default State
- `createDefaultState()` in `src/utils/defaults.ts` must produce 5 fixed columns with the exact titles, colors, and ordering specified in Section 3.1.
- The default `tasks` map is `{}`.
- Each default Card must have `taskIds: []`.

### 11.4 Migration Logic
- On first load, check `kanban_schema_version` in localStorage.
- If absent or less than 2: ignore any Phase 1 data (`kanban_board`, `kanban_cards` keys) and initialize a fresh Phase 2 `AppState` with default 5 columns and empty tasks.
- Write `kanban_schema_version: 2` to localStorage after fresh init.
- Subsequent loads check `kanban_schema_version` and skip re-initialization if present and value is 2 or higher.
- No fuzzy column title matching or phase 1 data preservation is required.

### 11.5 Filter Logic
- In `FilterContext.tsx`, store `taskStatusFilter` as a `Set<TaskStatus>`.
- `toggleTaskStatusFilter(status)` should add the status if absent, remove it if present.
- The `isFiltering` derivation must include `taskStatusFilter.size > 0`.
- Card visibility logic (likely in `Board.tsx` or a custom hook): a card passes the task status filter if `taskStatusFilter.size === 0` OR `card.taskIds.some(id => taskStatusFilter.has(state.tasks[id].status))`. Cards with zero tasks are hidden when any task status filter is active.

### 11.6 Component Behavior
- `TaskSummary` receives `taskIds: string[]` and reads task data from context. If `taskIds.length === 0`, render nothing (return `null`).
- `TaskItem` shows the task title as editable text. Click to enter edit mode, Enter or blur to save, Escape to cancel.
- `TaskStatusSelect` is a `<select>` or custom dropdown. Options: "To Do", "In Progress", "Done", "Dropped", "Blocked" with corresponding `TaskStatus` values.
- `AddTaskForm`: controlled input. On Enter with non-empty trimmed value, dispatch `ADD_TASK`. On Escape or blur with empty value, collapse the form.
- `TaskStatusFilter` renders 5 checkboxes. Each checkbox's `checked` state is derived from `taskStatusFilter.has(status)`. `onChange` calls `toggleTaskStatusFilter(status)`.

### 11.7 localStorage Keys
- `kanban_tasks` stores `Record<string, Task>`.
- `kanban_schema_version` stores a number (currently `2`).
- All existing keys (`kanban_board`, `kanban_cards`, `kanban_theme`) remain unchanged in purpose.

### 11.8 Visual Design Guidance
- Task status badges should use the same color scheme as column headers: todo=slate, in_progress=blue, done=green, dropped=red, blocked=amber.
- Progress bar: use a thin horizontal bar (4px height) with green fill for the done percentage. Gray background for remaining.
- Task list in Card detail: each row should be compact (single line for title + status + delete), similar to a todo-list UX pattern.

---

## 12. Engineering Notes

### 12.1 Performance Considerations
- Task lookups are O(1) via the normalized `state.tasks` map. Avoid denormalizing tasks into Card objects.
- The task status filter requires iterating over each visible Card's `taskIds` on every filter change. For the expected scale (tens of Cards, each with single-digit Tasks), this is negligible. No memoization needed unless profiling indicates otherwise.
- The `TaskSummary` component on board Cards should be lightweight. Compute done/total counts inline; do not subscribe to individual task state changes.

### 12.2 Testing Strategy
- Unit test the reducer for all three new task actions, including edge cases (missing IDs, empty taskIds).
- Unit test the fresh-start logic: verify that Phase 1 data is ignored, default 5-column board is created, schema_version is set to 2.
- Unit test filter logic: single status, multiple statuses, combined with search, cards with no tasks.
- Unit test progress calculation: verify that dropped tasks are excluded from the denominator, blocked tasks are included.
- Component test `TaskItem` for inline edit, status change, and delete flows.
- Component test `AddTaskForm` for creation, validation, escape-to-cancel.

### 12.3 Suggested Implementation Order
1. **Types**: Update `src/types/index.ts` with Task, TaskStatus, modified Card and AppState, new Action variants.
2. **Migration**: Build `src/utils/migration.ts` and integrate into `resolveInitialState()`.
3. **Defaults**: Update `createDefaultState()` for 5 fixed columns and tasks map.
4. **Reducer**: Add task action cases to `boardReducer`; modify `DELETE_CARD`; remove column mutation cases.
5. **Storage**: Update `loadState`/`saveState` to handle `kanban_tasks` and `kanban_schema_version`.
6. **Filter Context**: Add `taskStatusFilter` and `toggleTaskStatusFilter`.
7. **Board/Column**: Remove AddColumn, lock column headers to read-only, remove column menu.
8. **TaskSection + children**: Build the new Task components for Card detail modal.
9. **CardDetail**: Integrate TaskSection.
10. **TaskSummary**: Build and integrate into CardItem.
11. **TaskStatusFilter**: Build and integrate into FilterControls.
12. **Board filter logic**: Wire task status filter into card visibility.
13. **Polish**: Empty states, visual indicators, progress bar styling.

---

## 13. Success Metrics

| Metric                                          | Target                          |
| ----------------------------------------------- | ------------------------------- |
| Users can add a task within 2 interactions       | Add Task click + Enter          |
| Task status change latency                       | < 50ms (perceived instant)      |
| Data migration preserves 100% of Phase 1 cards  | Zero data loss on upgrade       |
| Filter response time                             | < 100ms                         |
| First Contentful Paint                           | < 1.5s (unchanged from Phase 1) |
| Lighthouse Performance Score                     | > 90 (unchanged from Phase 1)   |
| No increase in localStorage payload > 2x        | Tasks add minimal overhead      |

---

## 14. Future Considerations

| Feature                          | Notes                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| Task manual reordering           | Add `order: number` field to Task; enable DnD within task list |
| Task assignee                    | Requires user model; deferred to Phase 3+                     |
| Task priority                    | Could mirror Card priority; evaluate user demand first        |
| Bulk task status change          | "Mark all as done" action on Card level                       |
| Task templates                   | Pre-populate Cards with standard task sets                    |
| Multi-board                      | May revisit if user feedback warrants it                      |

---

## Appendix: Status Color Reference

| TaskStatus     | Display Label   | Hex Color  | Tailwind Class Suggestion |
| -------------- | --------------- | ---------- | ------------------------- |
| `todo`         | To Do           | `#94a3b8`  | `text-slate-400`          |
| `in_progress`  | In Progress     | `#3b82f6`  | `text-blue-500`           |
| `done`         | Done            | `#22c55e`  | `text-green-500`          |
| `dropped`      | Dropped         | `#ef4444`  | `text-red-500`            |
| `blocked`      | Blocked         | `#f59e0b`  | `text-amber-500`          |
