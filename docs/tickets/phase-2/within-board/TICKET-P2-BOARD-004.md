# TICKET-P2-BOARD-004: Multi-Board localStorage Schema

**Phase**: 2 -- Multi-Board
**Feature Area**: BM (Board Management) / Infrastructure
**Priority**: P0
**Dependencies**: P2-BOARD-006
**Related Scenarios**: 19, 20, 24
**Related Feature IDs**: N/A (infrastructure)

---

## Problem Statement

Phase 1 uses flat localStorage keys (`kanban_board`, `kanban_cards`). Phase 2 requires a new schema with per-board keys (`kanban_board_{boardId}`, `kanban_cards_{boardId}`) and a boards index (`kanban_boards`). Storage utility functions must be created or updated to support reading and writing this new schema.

---

## Goal & Success Metrics

- **Goal**: Implement localStorage read/write utilities for the Phase 2 multi-board schema.
- **Success looks like**: All board CRUD operations correctly read/write per-board localStorage keys. Read/write per operation stays under 50ms.

---

## User Story

As a developer implementing multi-board support,
I need localStorage utilities that read and write per-board data,
So that each board's data is isolated and independently accessible.

---

## Acceptance Criteria

### Scenario 1: Boards index CRUD
```gherkin
Given the multi-board localStorage schema is in use
When the app reads the kanban_boards key
Then it receives a BoardMeta[] array
When a board is added/renamed/deleted
Then the kanban_boards key is updated accordingly
```

### Scenario 2: Board-specific data isolation
```gherkin
Given Board A (ID: "aaa") and Board B (ID: "bbb") exist
When Board A's data is saved
Then kanban_board_aaa and kanban_cards_aaa are written
And kanban_board_bbb and kanban_cards_bbb are not modified
```

### Scenario 3: Board deletion cleans up all keys
```gherkin
Given Board A (ID: "aaa") exists with keys kanban_board_aaa and kanban_cards_aaa
When Board A is deleted
Then kanban_board_aaa is removed from localStorage
And kanban_cards_aaa is removed from localStorage
And the kanban_boards index no longer contains an entry for "aaa"
```

### Scenario 4: Reading a nonexistent board returns null
```gherkin
Given no key kanban_board_xyz exists in localStorage
When the app attempts to load board "xyz"
Then the load function returns null
And no error is thrown
```

---

## Additional Context & Notes

- **Assumptions**: localStorage keys follow the naming convention from the PRD: `kanban_boards`, `kanban_board_{boardId}`, `kanban_cards_{boardId}`, `kanban_theme`, `kanban_migrated`.
- **Dependencies**: None (foundation for all other tickets).
- **Out of scope**: localStorage quota management, compression, or alternative storage backends.

---

## Notes for AI Agents

- Update `utils/storage.ts` with the following functions:
  - `loadBoardsIndex(): BoardMeta[] | null` -- reads and parses `kanban_boards`
  - `saveBoardsIndex(boards: BoardMeta[]): void` -- writes `kanban_boards`
  - `loadBoard(boardId: string): Board | null` -- reads and parses `kanban_board_{boardId}`
  - `saveBoard(boardId: string, board: Board): void` -- writes `kanban_board_{boardId}`
  - `loadCards(boardId: string): Record<string, Card> | null` -- reads and parses `kanban_cards_{boardId}`
  - `saveCards(boardId: string, cards: Record<string, Card>): void` -- writes `kanban_cards_{boardId}`
  - `deleteBoard(boardId: string): void` -- removes `kanban_board_{boardId}` and `kanban_cards_{boardId}`
  - `getMigrationFlag(): boolean` -- reads `kanban_migrated`
  - `setMigrationFlag(): void` -- writes `kanban_migrated = true`
- All read functions should wrap `JSON.parse()` in try/catch and return `null` on failure.
- All write functions should wrap `localStorage.setItem()` in try/catch for quota errors.
- The `kanban_theme` key handling remains unchanged from Phase 1.
