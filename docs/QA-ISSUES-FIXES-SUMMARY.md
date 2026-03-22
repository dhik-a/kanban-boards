# QA Issues Fixes — Detailed Summary

## Overview
5 HIGH-severity issues identified by QA. Below are the exact changes proposed for PRD-phase-2.md and affected tickets.

---

## Issue #1: Column-Delete Card Count Sync Gap

**Current state:** TICKET-P2-BOARD-005 doesn't mention syncing totalCards when a column is deleted.

**Problem:** When user deletes a column, all cards in that column are also deleted. `BoardMeta.totalCards` must be decremented by the number of cards in that column. Currently, only card add/delete operations trigger `UPDATE_BOARD_CARD_COUNT`.

### Proposed Fix

**File:** `TICKET-P2-BOARD-005-delete-board-with-confirmation.md`

**Location:** In the acceptance criteria, add a new scenario:

```markdown
### Scenario X: Column deletion updates global card count

Given a board with 2 columns: "To Do" (5 cards) and "Done" (3 cards)
And the boards list shows this board with totalCards = 8
When the user deletes the "To Do" column from inside the board
Then the deletion should trigger UPDATE_BOARD_CARD_COUNT with the new total (3 cards)
And the boards list card count badge should update to 3
```

**Also update TICKET-P2-BOARD-005 title/scope:** Currently it's "Board Title Rename Sync". Rename it to:
```
TICKET-P2-BOARD-005: Data Sync Between Contexts (Title Rename + Card Count)
```

And add to the description:
```
This ticket also covers UPDATE_BOARD_CARD_COUNT dispatch after:
- ADD_CARD (via AddCard.tsx)
- DELETE_CARD (via CardDetail.tsx)
- DELETE_COLUMN (via ColumnHeader.tsx — dispatch with delta of cards in that column)
```

---

## Issue #2: Missing SPA Fallback Configuration

**Current state:** TICKET-P2-NAV-001 mentions Vite config vaguely, but doesn't specify what needs configuring.

**Problem:** Direct URL access like `/boards/abc123` will return 404 from the dev server and production host if not configured. Vite dev server handles it by default, but the production build target (Vercel, Netlify, etc.) needs explicit fallback configuration.

### Proposed Fix

**File:** `TICKET-P2-NAV-001-client-side-routing-setup.md`

**Location:** In the acceptance criteria, add a new scenario:

```markdown
### Scenario X: SPA fallback configuration for production

Given a user bookmarks a deep URL like "/boards/abc123"
When the user navigates to that URL directly (without going through the app first)
Then the hosting platform serves index.html and React Router loads the correct board
And no 404 page appears

**Implementation note:**
- Vite dev server: historyApiFallback is automatic (no config needed)
- Netlify: Add to `netlify.toml`:
  ```toml
  [[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  ```
- Vercel: Auto-configures SPA fallback on build
- Other hosts: Ensure `vite.config.ts` has correct preview/build settings
```

**Also add to PRD section 7 (File Structure):** After `vite.config.ts`, add a note:

```markdown
### Deployment Configuration

- `netlify.toml` — SPA fallback redirect for Netlify deployments (if using Netlify)
- For Vercel: SPA fallback is automatic
- For GitHub Pages: Not recommended for this app (lacks SPA fallback support)
```

---

## Issue #3: Under-Specified Dependency Chain

**Current state:** Tickets list dependencies informally in descriptions, but no explicit "blocks" relationships.

**Problem:** Developers don't know which tickets must complete before others can start. TICKET-P2-NAV-001 (routing) should explicitly block all page-level tickets since they all depend on routes existing.

### Proposed Fix

**File:** Update all 21 tickets to include a "Dependencies" section at the top:

```markdown
# TICKET-P2-{AREA}-{NUMBER}: {Title}

**Phase**: 2 — Multi-Board
**Feature Area**: {BL/BM/NAV/MIG}
**Priority**: {P0/P1}
**Dependencies**: [List of tickets that must complete first]

Example formats:
- "TICKET-P2-BOARD-006" (pure types, no dependencies)
- "TICKET-P2-BOARD-004, TICKET-P2-BOARD-006" (storage depends on types)
- "TICKET-P2-NAV-001, TICKET-P2-BOARDS-007" (page features depend on routing + global state)
```

**Specific dependency edges:**

| Ticket | Depends On |
|--------|-----------|
| P2-BOARD-006 (types) | None |
| P2-BOARD-004 (storage) | P2-BOARD-006 |
| P2-MIG-001/002/003 (migration) | P2-BOARD-004, P2-BOARD-006 |
| P2-BOARDS-007 (global context) | P2-BOARD-006 |
| P2-NAV-001 (routing) | P2-BOARDS-007 |
| P2-BOARD-001 (refactor) | P2-NAV-001, P2-BOARDS-007 |
| P2-BOARDS-001-006 (boards list UI) | P2-NAV-001, P2-BOARDS-007 |
| P2-NAV-002-005 (nav UI) | P2-NAV-001, P2-BOARD-001 |
| P2-BOARD-002-005 (board page features) | P2-BOARD-001 |

---

## Issue #4: Expanded View Data Strategy

**Current state:** TICKET-P2-BOARDS-002 doesn't specify how to efficiently fetch column summaries (column names + per-column card counts).

**Problem:** `BoardMeta` only stores `totalCards`, not per-column breakdown. The expanded view needs to read the full `Board` object to show column names and card counts. The ticket should specify lazy-load on expand (not preload all 10 boards on page load).

### Proposed Fix

**File:** `TICKET-P2-BOARDS-002-board-card-expand-collapse-toggle.md`

**Location:** In the acceptance criteria, update Scenario 3 (expanded view):

```markdown
### Scenario 3: Board card expanded view (UPDATED)

Given the user is on the boards list page
And a board card is in its collapsed state
When the user clicks the chevron toggle button on the card
Then the card expands to show:
  - A list of column names (loaded from kanban_board_{boardId})
  - For each column, the number of cards in that column
And the chevron icon rotates to indicate the expanded state

**Implementation note:**
- On expand, call loadBoard(boardId) to fetch the full Board object from localStorage
- If kanban_board_{boardId} is missing (data corruption):
  - Render "—" for each column count
  - Log a warning to console
  - Do NOT crash the page
- Collapse the card again to hide the column list (don't keep it in memory)
```

**Also add to PRD section 4.1 (Board List Features):**

```markdown
| BL-004 | Column summaries in expanded view show per-column card counts | P1 |
|--------|---------------------------------------------------------------|-----|
| BL-005 | Expanded view gracefully handles missing board data           | P1 |
```

---

## Issue #5: Default Board Name Inconsistency

**Current state:** PRD-phase-2.md says fresh-install default is "My Board", but Phase 1 `createDefaultState()` creates "My Kanban Board".

**Problem:** Users migrating from Phase 1 see their old board with title "My Kanban Board". If they then create a new board (Phase 2), it will be titled "My Board". Inconsistent UX.

**Decision:** Phase 2 uses "My Board" as the new standard. Phase 1 is legacy.

### Proposed Fix

**File 1:** `docs/PRD-phase-2.md`

**Location:** Section 9.2 Migration Safety, Step 6 (Fresh install), update the board title:

```markdown
Step 6: (Fresh install) Check if kanban_boards exists and has entries
        → If yes: normal load, no action needed
        → If no: create default board
            a. Generate UUID for default board
            b. Create Board with title "My Board" and 3 default columns
               ("To Do", "In Progress", "Done")
            c. Write kanban_boards = [defaultBoardMeta]
            d. Write kanban_board_{id} = defaultBoard
            e. Write kanban_cards_{id} = {}
            f. Write kanban_migrated = true
```

**File 2:** `docs/tickets/phase-2/migration/TICKET-P2-MIG-002-fresh-install-default-board.md`

**Location:** In the given/when/then, ensure the board title is "My Board":

```markdown
### Scenario: Fresh install creates default board with correct title

Given no localStorage data exists for the app
When the app loads
Then a default board is created with:
  - Title: "My Board"  ← MUST BE THIS, NOT "My Kanban Board"
  - 3 default columns: "To Do", "In Progress", "Done"
  - 0 cards
And the user sees the boards list page with one board card showing "My Board"
```

**File 3:** `src/utils/defaults.ts`

**Location:** When you create the `createDefaultBoard()` function, use:

```typescript
export function createDefaultBoard(): Board {
  const id = uuidv4();
  const now = new Date().toISOString();
  return {
    id,
    title: "My Board",  // Phase 2 standard (not Phase 1's "My Kanban Board")
    columns: [
      { id: uuidv4(), title: "To Do", cardIds: [], color: "#94a3b8" },
      { id: uuidv4(), title: "In Progress", cardIds: [], color: "#94a3b8" },
      { id: uuidv4(), title: "Done", cardIds: [], color: "#94a3b8" },
    ],
    createdAt: now,
    updatedAt: now,
  };
}
```

---

## Summary Table

| Issue | File(s) | Change Type | Complexity |
|-------|---------|-------------|-----------|
| #1 Column-delete sync | TICKET-P2-BOARD-005 | Add scenario + expand scope | Low |
| #2 SPA fallback config | TICKET-P2-NAV-001 + PRD | Add deployment notes | Low |
| #3 Dependencies | All 21 tickets | Add "Dependencies" section | Medium (21 tickets) |
| #4 Expanded view data | TICKET-P2-BOARDS-002 + PRD | Add lazy-load strategy + error handling | Low |
| #5 Default board name | PRD + 3 files | Update default name to "My Board" | Low |

---

## Ready to Apply?

If you approve these fixes, I will:
1. Update `docs/PRD-phase-2.md` (issues #2, #4, #5)
2. Update all 21 tickets in `docs/tickets/phase-2/` (issues #1, #3, #5)
3. Create/update `src/utils/defaults.ts` with `createDefaultBoard()` (issue #5)

**Proceed? Y/N, or suggest modifications?**
