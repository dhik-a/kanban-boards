# TICKET-P2-BOARD-006: Data Types and Model Updates for Phase 2

**Phase**: 2 -- Multi-Board
**Feature Area**: Infrastructure
**Priority**: P0
**Dependencies**: None
**Related Scenarios**: N/A (infrastructure)
**Related Feature IDs**: N/A (data model foundation)

---

## Problem Statement

Phase 2 introduces new data types (`BoardMeta`, updated `AppState`) and new action types (`GlobalAction`, updated `BoardAction`) that must be defined in TypeScript before any feature work can begin. Without these type definitions, other tickets cannot be implemented with type safety.

---

## Goal & Success Metrics

- **Goal**: Define all Phase 2 TypeScript types, interfaces, and action types.
- **Success looks like**: All new types compile without errors. Existing Phase 1 types remain backward-compatible. AI agents and engineers can reference these types when implementing features.

---

## User Story

As a developer working on Phase 2,
I need clearly defined TypeScript types for the multi-board data model,
So that I can implement features with type safety and avoid data inconsistencies.

---

## Acceptance Criteria

### Scenario 1: BoardMeta type is defined
```gherkin
Given the developer imports BoardMeta from types
When they create a BoardMeta object
Then it must include: id (string), title (string), totalCards (number), createdAt (string), updatedAt (string)
And the TypeScript compiler enforces all fields are present
```

### Scenario 2: AppState type is updated
```gherkin
Given the developer imports AppState from types
When they create an AppState object
Then it must include: boards (BoardMeta[]), activeBoardId (string | null), activeBoard (Board | null), cards (Record<string, Card>), migrationComplete (boolean)
```

### Scenario 3: GlobalAction union type is defined
```gherkin
Given the developer uses GlobalAction type
Then it includes: LOAD_BOARDS, ADD_BOARD, RENAME_BOARD, DELETE_BOARD, UPDATE_BOARD_CARD_COUNT
And each action has the correct payload type
```

### Scenario 4: Existing types remain unchanged
```gherkin
Given the Phase 1 types Board, Column, and Card exist
When Phase 2 types are added
Then Board, Column, and Card interfaces remain identical to Phase 1
And no breaking changes are introduced
```

---

## Additional Context & Notes

- **Assumptions**: TypeScript strict mode is enabled. All types are exported from `types/index.ts`.
- **Dependencies**: None (this is a foundational ticket).
- **Out of scope**: Implementation of reducers, components, or storage utilities. This ticket is types only.

---

## Notes for AI Agents

- Update `src/types/index.ts` to add:
  ```typescript
  interface BoardMeta {
    id: string;
    title: string;
    totalCards: number;
    createdAt: string;  // ISO 8601
    updatedAt: string;  // ISO 8601
  }
  ```
- Add or update `AppState`:
  ```typescript
  interface AppState {
    boards: BoardMeta[];
    activeBoardId: string | null;
    activeBoard: Board | null;
    cards: Record<string, Card>;
    migrationComplete: boolean;
  }
  ```
- Add `GlobalAction` type:
  ```typescript
  type GlobalAction =
    | { type: "LOAD_BOARDS"; payload: BoardMeta[] }
    | { type: "ADD_BOARD"; payload: BoardMeta }
    | { type: "RENAME_BOARD"; payload: { id: string; title: string } }
    | { type: "DELETE_BOARD"; payload: { id: string } }
    | { type: "UPDATE_BOARD_CARD_COUNT"; payload: { id: string; totalCards: number } };
  ```
- Ensure existing `Board`, `Column`, `Card` interfaces are NOT modified.
- Export all types from the index file.
