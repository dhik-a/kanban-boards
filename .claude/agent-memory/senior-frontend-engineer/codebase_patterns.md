---
name: Codebase Patterns
description: Architectural patterns, conventions, and component structure discovered in this codebase
type: project
---

## State Management
- Single `BoardContext` with `useReducer` + `boardReducer` pattern in `src/context/BoardContext.tsx`
- `FilterContext` in `src/context/FilterContext.tsx` for search/priority/label filters (separate from board state)
- `ToastContext` for notifications
- State shape: `AppState = { board: Board, cards: Record<string, Card>, tasks: Record<string, Task> }`

## Persistence
- `src/utils/storage.ts` handles localStorage read/write
- Keys: `kanban_board`, `kanban_cards`, `kanban_tasks`, `kanban_schema_version`
- `useDebouncedSave` hook in `src/hooks/useDebouncedSave.ts` handles debounced saves
- Atomic rollback pattern on multi-key writes

## Reducer Pattern
- Exhaustiveness check via `const _exhaustive: never = action` in default case
- `withUpdatedAt` helper updates board.updatedAt on every mutation
- All state spreads must include all AppState fields (board, cards, tasks)

## Component Structure
- `src/components/Board/` — Board, Column, ColumnHeader
- `src/components/Card/` — CardItem, CardDetail, CardItemOverlay, TaskSummary, AddCard
- `src/components/Task/` — TaskSection, TaskList, TaskItem, TaskEmptyState, AddTaskForm
- `src/components/UI/` — ConfirmDialog, Modal, Toast, SaveErrorBanner, CorruptionWarningBanner

## Task Component Architecture (Phase 2)
- `TaskSection` — owns per-modal task status filter (local state, NOT FilterContext)
- `TaskSummary` — board card chip showing `X/Y tasks` + progress bar (dropped excluded from denominator)
- `TaskList` — renders `TaskItem` list, handles filter-empty inline message
- `TaskItem` — inline title edit, status select (color-coded badge overlay pattern), delete with ConfirmDialog
- `AddTaskForm` — collapsed "Add task" button that expands to input; Enter creates, Esc toggles collapse

## Important Patterns
- Task status filter is local to modal (useState in TaskSection), not in FilterContext — DnD unaffected
- Status badge uses invisible `<select>` overlaid on a colored `<span>` for visual customization
- All destructive actions use `ConfirmDialog` with default focus on Cancel button

## Build & Tooling
- Stack: React + TypeScript + Tailwind CSS + dnd-kit + Vite
- Build command: `npm run build` (runs `tsc -b && vite build`)
- No test runner configured (no `npm test` script)
- Lint: `npm run lint` (eslint)
- TypeScript strict mode — unused imports are errors (TS6133/TS6196)

## Phase 2 Type Changes
- `Column` now has `isFixed: boolean` field
- `Card` now has `taskIds: string[]` field
- `AppState` now has `tasks: Record<string, Task>` field
- `Action` union: removed ADD_COLUMN, DELETE_COLUMN, REORDER_COLUMNS; added ADD_TASK, UPDATE_TASK, DELETE_TASK
