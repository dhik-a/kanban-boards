# Phase 2 Implementation Guide

Consolidated from QA Review (aa7a6d006895aee46) and Frontend Engineer Review (aec866f770fa37adc).

**Feasibility: GREEN-YELLOW** — No architectural blockers, but 3 medium-severity concerns must be resolved via design contracts before implementation starts.

---

## Critical Pre-Implementation Tasks

### 1. Fix 5 QA Issues in PRD + Tickets

| Issue | Action | Impact |
|-------|--------|--------|
| Column-delete card count sync gap | Add to TICKET-P2-BOARD-005: when DELETE_COLUMN fires, dispatch UPDATE_BOARD_CARD_COUNT with the delta | Data consistency |
| Missing SPA fallback config | Add to TICKET-P2-NAV-001 acceptance criteria: "Document Vite historyApiFallback config and Netlify `netlify.toml` redirect rule" | Deployment safety |
| Under-specified dependencies | Create explicit `blocks` relationship in each ticket (routing blocks all page-level tickets, etc.) | Implementation clarity |
| Expanded view data strategy | Add to TICKET-P2-BOARDS-002: "Load full board on expand via loadBoard(); handle missing key gracefully" | Performance |
| Default board name inconsistency | Use "My Board" in Phase 2 (Phase 1 `createDefaultState` will no longer be called) | UX consistency |

### 2. Design Contracts Before Wave 2

#### Contract A: Cross-Context Card Count Sync

**Problem:** `ADD_CARD` / `DELETE_CARD` in `BoardContext` must trigger `UPDATE_BOARD_CARD_COUNT` in `BoardsContext`.

**Solution:**
```typescript
// In BoardPage.tsx
const { dispatch: dispatchBoards } = useBoards(); // NEW: consume global context
const { dispatch: dispatchBoard } = useBoardContext(); // board-scoped

// When a card is added/deleted, CardDetail and AddCard will dispatch to BoardContext
// BoardPage wraps them and listens for the dispatch, then also dispatches to BoardsContext:

useEffect(() => {
  const cardCount = countCardsInBoard(state.board);
  dispatchBoards({
    type: "UPDATE_BOARD_CARD_COUNT",
    payload: { id: boardId, totalCards: cardCount }
  });
}, [state.board.columns]); // watch for column/card changes
```

**Key rule:** The card-mutating components do NOT need to know about the global context. The parent `BoardPage` component acts as the synchronizer.

#### Contract B: Dual-Write for RENAME_BOARD

**Problem:** `RENAME_BOARD` must update both `kanban_boards` and `kanban_board_{id}`.

**Solution:**
```typescript
// In BoardsProvider, after reducer runs:
useEffect(() => {
  // Save boards index
  const error = saveBoardsIndex(state.boards);
  if (error) { setSaveError(error); return; }

  // Additionally, if any board was renamed, sync its full board object:
  // (This logic is simple since the reducer only allows one action per dispatch)
  // For RENAME_BOARD action, also call saveBoardTitle(boardId, newTitle)
}, [state.boards]);
```

Create a new utility: `saveBoardTitle(boardId: string, newTitle: string): string | null`

**Key rule:** The reducer is pure (only updates state); the side effect performs secondary writes.

#### Contract C: Parameterised useDebouncedSave

**Problem:** Current `useDebouncedSave` is hardwired to `saveState()` function and Phase 1 `AppState`.

**Solution:** Refactor to accept a generic save function:
```typescript
// Before Phase 2 implementation:
export function useDebouncedSave<T>(
  state: T,
  saveFn: (state: T) => string | null,  // ← NEW parameter
  onError: (err: string | null) => void,
  debounceMs: number = 300
) {
  // Same logic as Phase 1, but calls saveFn(state) instead of saveState(state)
}
```

This is used in:
- `BoardsProvider` — `useDebouncedSave(state, saveBoardsIndex, handleSaveError)`
- `BoardContext` — `useDebouncedSave(state, saveBoardAndCards, handleSaveError)`

**Key rule:** Do this refactor in Wave 2 before any context uses it.

---

## High-Risk Tickets (Code Review Checklist)

### TICKET-P2-BOARD-001: BoardContext Refactor

**Risk:** Complete rewrite of existing global provider. All Phase 1 consumers must work unchanged.

**Pre-implementation:**
- [ ] Decide: keep old `resolveInitialState()` call or replace it?
  - **Answer:** Replace. `BoardContext` will accept `boardId: string | null` from `useParams()`, then call `loadBoard(boardId)` inside a `useEffect`.
- [ ] Verify Phase 1 components calling `useBoardContext()` are only inside `BoardPage` routes, not in global layout
- [ ] Plan: which components need `useBoards()` access for card count sync? (`AddCard.tsx`, `CardDetail.tsx` delete)

**Code review focus:**
1. Does the refactored context keep the same state shape (`{ board: Board | null, cards: Record<string, Card> }`)?
2. Does it correctly derive `boardId` from `useParams()` without throwing if the route is wrong?
3. Are the `useEffect` dependencies correct (no stale closures)?
4. Does `beforeunload` flush still work after migration to per-board keys?

### TICKET-P2-BOARDS-007: BoardsContext

**Risk:** New global reducer. Exhaustiveness check and guards must be correct.

**Pre-implementation:**
- [ ] Define all `GlobalAction` types (LOAD_BOARDS, ADD_BOARD, RENAME_BOARD, DELETE_BOARD, UPDATE_BOARD_CARD_COUNT)
- [ ] Define reducer guards: max 10 boards, min 1 board, no empty titles

**Code review focus:**
1. Does the exhaustiveness check compile (`const _exhaustive: never = action`)?
2. Are the guards enforced in reducer (not just in dispatch)?
3. Does `useDebouncedSave` correctly persist `kanban_boards` on every state change?
4. Are error-handling paths correct (quota exceeded, corrupted JSON)?

### TICKET-P2-MIG-001/002/003: Migration

**Risk:** Synchronous, runs before React renders. One mistake blocks the app.

**Code review focus:**
1. Is the step sequence correct (writes before deletes)?
2. Does the `kanban_migrated` flag idempotency work (set LAST, only if all writes succeed)?
3. Are edge cases handled:
   - [ ] No Phase 1 data (go to fresh install)
   - [ ] Phase 1 data but corrupted JSON (log error, fresh install)
   - [ ] `kanban_migrated = true` but boards empty (run fresh install step only)
   - [ ] `kanban_boards` exists but `kanban_migrated` absent (set flag, skip migration)
4. Does the fresh-install step have the same totalCards count logic as migration?

---

## Implementation Wave Order (Strict Sequence)

### Wave 1: Foundation (NO PARALLELISM)
1. **TICKET-P2-BOARD-006** — Add `BoardMeta` type, update `AppState`, update action types
2. **TICKET-P2-BOARD-004** — Implement `loadBoard`, `saveBoard`, `loadCards`, `saveCards`, `loadBoardsIndex`, `saveBoardsIndex` in `storage.ts`
3. **TICKET-P2-MIG-001/002/003** — Implement full migration logic in `utils/migration.ts` (one PR, tests all 3 together)
4. **Refactor `useDebouncedSave`** — Add generic `saveFn` parameter, maintain backward compatibility

### Wave 2: Global State + Routing
5. **TICKET-P2-BOARDS-007** — Implement `BoardsContext`, `boardsReducer`, `BoardsProvider` hook
6. **TICKET-P2-NAV-001** — Wrap app with `BrowserRouter`, create `BoardsListPage` and `BoardPage` scaffolds

### Wave 3: Board-Scoped State (HIGHEST RISK)
7. **TICKET-P2-BOARD-001** — Refactor `BoardContext` to be route-scoped, scoped `FilterContext` inside `BoardPage`
   - Code review before proceeding to Wave 4

### Wave 4: Board Page (Parallel OK)
8. **TICKET-P2-BOARD-002** — Verify filter scoping, add `UPDATE_BOARD_CARD_COUNT` dispatch after card add/delete
9. **TICKET-P2-BOARD-003** — Phase 1 regression test (all Phase 1 features work unchanged)
10. **TICKET-P2-BOARD-005** — Implement `syncBoardTitle` utility, add rename sync dispatch

### Wave 5: Navigation & Headers (Parallel OK)
11. **TICKET-P2-NAV-003** — Implement `BoardsListHeader` (title + theme) and `BoardPageHeader` (breadcrumb + search + filter + theme)
12. **TICKET-P2-NAV-002** — Implement `Breadcrumb` component ("All Boards > {Board Title}")
13. **TICKET-P2-NAV-004** — Implement 404 page for invalid board IDs
14. **TICKET-P2-NAV-005** — Disambiguate board card click vs action button click

### Wave 6: Boards List (Parallel OK)
15. **TICKET-P2-BOARDS-001** — Implement `BoardCard` component and display on home page
16. **TICKET-P2-BOARDS-003** — Implement `NewBoardModal` and create board flow
17. **TICKET-P2-BOARDS-004** — Implement inline rename with inline-edit input
18. **TICKET-P2-BOARDS-005** — Implement delete with confirmation dialog
19. **TICKET-P2-BOARDS-002** — Implement expand/collapse toggle for column summaries (P1)
20. **TICKET-P2-BOARDS-006** — Implement empty state and other defensive UI (P1)

---

## Component Relocation & Addition

### Relocate (Phase 1 → Phase 2)
- `SaveErrorBanner.tsx` — Move inside `BoardPage` (board-scoped errors only)
- `CorruptionWarningBanner.tsx` — Move inside `BoardPage` (board-scoped errors only)
- Create new: `GlobalErrorBanner.tsx` for `BoardsContext` write failures (quota, etc.)

### New Header Components
- `BoardsListHeader.tsx` — App title + theme toggle (no search, filter, breadcrumb)
- `BoardPageHeader.tsx` — Breadcrumb + search + filter controls + theme toggle (same as Phase 1)
- `Breadcrumb.tsx` — "All Boards > {Board Title}" with clickable "All Boards" link

### New Page Components
- `BoardsListPage.tsx` — Grid of board cards, "New Board" button, empty state
- `BoardPage.tsx` — Breadcrumb, board view (Phase 1 Board component unchanged), modal/dialog stacks

### New Boards List Components
- `BoardCard.tsx` — Single board card with title, total cards, created date, rename/delete buttons
- `BoardCardExpanded.tsx` — Expanded view showing column names + per-column card counts
- `NewBoardModal.tsx` — Modal for creating a new board (name input only)
- `NewBoardButton.tsx` — Button to trigger modal

---

## Testing & QA Strategy

### Integration Test Priority
1. **Migration path** — Phase 1 data → Phase 2 structure (all data preserved, zero loss)
2. **Board title sync** — Change title via rename → verify both `kanban_boards` and `kanban_board_{id}` updated
3. **Card count sync** — Add/delete card in board → verify `BoardMeta.totalCards` updated
4. **Route transitions** — Navigate between boards, use back button, direct URL access
5. **Phase 1 regression** — All Phase 1 features (drag-drop, filter, search, modal) work unchanged

### Edge Case Testing
- [ ] Attempt to navigate to non-existent board ID → 404 page
- [ ] Delete last remaining board → delete button disabled
- [ ] Create 10 boards → "New Board" button disabled
- [ ] Refresh page while inside a board → board reloads correctly
- [ ] Quota exceeded during `kanban_boards` save → error banner
- [ ] Quota exceeded during `kanban_board_{id}` save → error banner, retry logic

### Accessibility Testing (Phase 2 components only)
- [ ] Breadcrumb is focusable and keyboard-navigable
- [ ] Board card buttons (rename, delete) are keyboard-accessible
- [ ] Modal (new board) has focus trap and Escape-to-close
- [ ] Confirmation dialog has focus trap
- [ ] Focus moves to `<h1>` on route transition (or appropriate element)

---

## Documentation Updates Needed

### Before shipping Phase 2:
1. Update `README.md` — Add "Multi-Board Support" section, Phase 2 features
2. Create `docs/DEPLOYMENT.md` — SPA fallback config for Vercel/Netlify (historyApiFallback, redirects)
3. Update `docs/PRD-phase-2.md` — Fix 5 QA issues noted above
4. Create `docs/ARCHITECTURE-PHASE-2.md` — Context hierarchy, state flow diagram, localStorage schema
5. Update ticket files — Add explicit dependency edges (blocks/blockedBy relationships)

---

## Success Metrics

- [ ] Zero data loss during Phase 1 → Phase 2 migration (100%)
- [ ] All Phase 1 features work unchanged within each board
- [ ] 10-board limit enforced (cannot create 11th)
- [ ] Last board cannot be deleted (delete button disabled)
- [ ] Boards list loads in < 1s (even with 10 boards + 500 cards total)
- [ ] Route transitions < 200ms
- [ ] Board title changes sync across global index + board view (no divergence)
- [ ] All 24 PRD scenarios pass UAT

---

## Red Flags to Watch For

🚩 **If ANY of these happen during implementation, STOP and replan:**
1. Phase 1 component breaks when moved under `BoardPage` (suggests `BoardContext` contract violation)
2. Card count diverges between boards list and board view (suggests UPDATE_BOARD_CARD_COUNT not syncing)
3. Board title diverges between breadcrumb and board card (suggests rename sync missing)
4. DnD breaks inside a board (suggests Phase 1 Board.tsx was modified incorrectly)
5. localStorage quota exceeded before 10 boards with reasonable card counts (suggests schema inefficiency)

---

## Next Steps

1. ✅ **QA + FE reviews complete** — This guide consolidates both
2. ⏳ **Approve/adjust wave order** — Ready to commit?
3. ⏳ **Create/update 5 QA issue tickets** — Fix PRD + ticket ambiguities
4. ⏳ **Establish code review process** — Plan Wave 1-3 code reviews upfront
5. ⏳ **Start Wave 1** — Types + Storage + Migration (prerequisite for everything)
