---
name: Kanban App Architecture Overview
description: Key architectural patterns and storage design for the kanban board app (Phase 1 baseline)
type: project
---

Stack: React + TypeScript + Tailwind + dnd-kit + localStorage.

**Why:** Understanding the baseline architecture is needed for reviewing any Phase 2 changes.

**How to apply:**
- State: React Context + useReducer in BoardContext.tsx. Normalized model: Board has columns (with cardIds), cards stored separately in Record<string, Card>.
- Storage: Two localStorage keys (kanban_board, kanban_cards) with rollback-based atomicity. Debounced saves via useDebouncedSave.
- Filtering: FilterContext.tsx with search, priority, and label filters. isFiltering derived flag disables DnD.
- Defaults: defaults.ts has createDefaultState() (3 columns) and a leftover createDefaultBoard()/createDefaultBoardMeta() from abandoned multi-board plan.
- Key files: src/types/index.ts, src/context/BoardContext.tsx, src/context/FilterContext.tsx, src/utils/storage.ts, src/utils/defaults.ts.
