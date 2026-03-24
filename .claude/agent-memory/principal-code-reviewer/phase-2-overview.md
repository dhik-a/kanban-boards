---
name: Phase 2 Architecture Overview
description: Multi-board support, context hierarchy, storage layer, and critical design contracts
type: project
---

## Phase 2 Scope

Phase 2 adds multi-board support to the kanban app. Moves from a single global board to a boards list page, per-board scoped state, and proper localStorage structure.

### Key Design Contracts

1. **Cross-Context Card Count Sync**: When ADD_CARD or DELETE_CARD is dispatched in BoardContext, BoardPage must also dispatch UPDATE_BOARD_CARD_COUNT to BoardsContext to keep the global board list's totalCards in sync.

2. **Dual-Write for RENAME_BOARD**: Rename must update both `kanban_boards` (index) and `kanban_board_{id}` (full board). Reducer is pure; side effects handle secondary writes.

3. **Parameterised useDebouncedSave**: The existing Phase 1 `useDebouncedSave` must be refactored to accept a generic save function parameter before Wave 2 implementation.

### Context Hierarchy

- `BoardsContext` (global): Holds list of boards, metadata, global actions
- `BoardContext` (route-scoped inside `BoardPage`): Holds single board + cards, board-scoped actions
- `FilterContext` (scoped inside `BoardPage`): Column filters, search

### Storage Layer (per TICKET-P2-004)

- `kanban_boards` — Serialized `BoardMeta[]` (index of all boards)
- `kanban_board_{boardId}` — Serialized `Board` (full board with columns/cards)
- `kanban_migrated` — Flag (boolean) to track Phase 1→Phase 2 migration completion

### Critical Implementation Waves

**Wave 1** (Foundation): Types, storage functions, migration logic
**Wave 2** (Global): BoardsContext, routing scaffold
**Wave 3** (Board Scope): BoardContext refactor (HIGH RISK)
**Wave 4** (Board Page): Card count sync, phase 1 regression test
**Wave 5+** (Navigation & Lists): Headers, breadcrumbs, board cards, CRUD

### Red Flags During Implementation

- Phase 1 component breaks when moved under BoardPage → BoardContext contract violated
- Card count diverges between boards list and board view → UPDATE_BOARD_CARD_COUNT not syncing
- Board title diverges → rename sync missing
- DnD breaks inside board → Phase 1 Board.tsx modified incorrectly
- localStorage quota exceeded before 10 boards → schema inefficiency

### Testing & QA Priority

1. Migration: Phase 1 data → Phase 2 structure (zero loss)
2. Board title sync: Rename updates both kanban_boards and kanban_board_{id}
3. Card count sync: Add/delete card updates BoardMeta.totalCards
4. Route transitions: Navigation, back button, direct URL access
5. Phase 1 regression: All Phase 1 features work unchanged within boards
