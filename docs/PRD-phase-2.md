# Product Requirements Document: Kanban Board App — Phase 2

## Metadata

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Project       | Kanban Board                                 |
| Version       | 2.0.0                                        |
| Phase         | 2 — Multi-Board (Frontend Only)              |
| Status        | Draft                                        |
| Created       | 2026-03-22                                   |
| Depends On    | Phase 1 (complete)                           |
| Stack         | React, TypeScript, Tailwind CSS, React Router|
| Persistence   | localStorage                                 |

---

## 1. Overview

### 1.1 Problem Statement

Phase 1 delivers a single Kanban board. Users who manage work across multiple projects, contexts, or teams have no way to separate those concerns — everything lives on one board. They need the ability to create, organize, and navigate between multiple independent boards without losing their existing data.

### 1.2 Solution

Extend the existing Kanban app to support multiple boards, each with its own columns and cards. Introduce a boards list home page as the new entry point, client-side routing to navigate between boards, and an automatic migration path that preserves all Phase 1 data. All data remains in `localStorage` — no backend is introduced in this phase.

### 1.3 Goals

- Allow users to create and manage up to 10 independent boards
- Provide a home page that gives a quick overview of all boards
- Enable seamless navigation between the boards list and individual boards
- Automatically migrate Phase 1 single-board data into the new multi-board schema with zero data loss
- Maintain all Phase 1 functionality within each board (columns, cards, drag-and-drop, search/filter)

### 1.4 Non-Goals (Phase 2)

- Backend API / database persistence
- User authentication / multi-user support
- Real-time collaboration
- Board templates or board duplication
- Cross-board search (search remains scoped to the active board)
- Board reordering on the boards list page
- Drag-and-drop of boards
- Board archiving (soft-delete)
- Sharing or exporting boards
- File attachments, due dates, calendar integration

---

## 2. Tech Stack

| Layer         | Technology                          | Rationale                                              |
| ------------- | ----------------------------------- | ------------------------------------------------------ |
| Framework     | React 18+                          | Carried forward from Phase 1                           |
| Language      | TypeScript                          | Carried forward from Phase 1                           |
| Build Tool    | Vite                                | Carried forward from Phase 1                           |
| Styling       | Tailwind CSS                        | Carried forward from Phase 1                           |
| Drag & Drop   | @dnd-kit/core + @dnd-kit/sortable  | Carried forward from Phase 1                           |
| **Routing**   | **react-router-dom v6**            | **NEW — client-side routing for board navigation**     |
| State         | React Context + useReducer          | Extended for multi-board state                         |
| Persistence   | localStorage                        | No backend in Phase 2                                  |
| Icons         | lucide-react                        | Carried forward from Phase 1                           |
| IDs           | uuid                                | Carried forward from Phase 1                           |

### 2.1 New Dependency

```bash
npm install react-router-dom@6
```

---

## 3. Data Model

### 3.1 BoardMeta (NEW)

Lightweight metadata stored in the boards index. Does **not** contain columns or cards — those remain on the individual board objects.

```typescript
interface BoardMeta {
  id: string;          // UUID, same as the Board.id it references
  title: string;
  totalCards: number;  // denormalized count, updated on card add/delete
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### 3.2 Board (unchanged from Phase 1)

```typescript
interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### 3.3 Column (unchanged from Phase 1)

```typescript
interface Column {
  id: string;
  title: string;
  cardIds: string[];   // ordered list of card IDs
  color: string;       // hex color for column header accent
}
```

### 3.4 Card (unchanged from Phase 1)

```typescript
interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### 3.5 AppState (UPDATED)

```typescript
// Global state available at all routes
interface AppState {
  boards: BoardMeta[];                   // ordered list of all boards (index)
  activeBoardId: string | null;          // currently viewed board, null on boards list
  activeBoard: Board | null;             // full board data when viewing a board
  cards: Record<string, Card>;           // cards for the active board only
  migrationComplete: boolean;            // true after Phase 1 migration runs
}
```

### 3.6 Board Title Consistency

**Phase 2 uses "My Board" as the default title for new boards.** This differs from Phase 1's legacy "My Kanban Board", but ensures consistency across all Phase 2 operations (fresh install, new board creation). Phase 1 data is migrated with its original title intact.

### 3.6 localStorage Schema (UPDATED)

| Key                        | Type                    | Description                                                  |
| -------------------------- | ----------------------- | ------------------------------------------------------------ |
| `kanban_boards`            | `BoardMeta[]`           | **NEW** — Index of all boards (metadata only)                |
| `kanban_board_{boardId}`   | `Board`                 | **NEW** — Full board structure for a specific board           |
| `kanban_cards_{boardId}`   | `Record<string, Card>`  | **NEW** — All cards for a specific board, indexed by card ID  |
| `kanban_theme`             | `string`                | Unchanged — `"light"` or `"dark"`                            |
| `kanban_migrated`          | `boolean`               | **NEW** — Flag indicating Phase 1 migration has completed     |

**Phase 1 keys (deprecated, removed after migration):**

| Key               | Status                                  |
| ----------------- | --------------------------------------- |
| `kanban_board`    | Read during migration, deleted after    |
| `kanban_cards`    | Read during migration, deleted after    |

---

## 4. Features

### 4.1 Board List Page (BL-xxx)

| ID     | Requirement                                                              | Priority |
| ------ | ------------------------------------------------------------------------ | -------- |
| BL-001 | Display a list of all boards as cards on the home page at route `/`      | P0       |
| BL-002 | Each board card shows: title, total card count, created date             | P0       |
| BL-003 | Board card has collapsed view (title + total card count) by default      | P0       |
| BL-004 | Board card has expanded view toggled by chevron: shows column names + per-column card counts (lazy-loaded) | P1 |
| BL-004a| Expanded view gracefully handles missing board data (render "—" instead of crashing) | P1 |
| BL-005 | Clicking a board card navigates to `/boards/:boardId`                    | P0       |
| BL-006 | Display a "+ New Board" button/card                                      | P0       |
| BL-007 | Show empty state when no boards exist (should not occur due to min-1 rule, but defend against it) | P1 |
| BL-008 | Board cards display rename and delete action buttons                     | P0       |

**Constraints:**
- Board cards are **not** reorderable (static display order by creation date, oldest first)
- Maximum 10 boards displayed (enforced — cannot create more)
- Minimum 1 board must always exist

### 4.2 Board Management (BM-xxx)

| ID     | Requirement                                                              | Priority |
| ------ | ------------------------------------------------------------------------ | -------- |
| BM-001 | Create a new board via modal: name field only                            | P0       |
| BM-002 | New board initializes with 3 default columns: "To Do", "In Progress", "Done" | P0  |
| BM-003 | Rename a board inline on the board card (same UX pattern as column title editing) | P0 |
| BM-004 | Delete a board with confirmation dialog showing board name + total card count | P0  |
| BM-005 | Last remaining board cannot be deleted (delete button disabled with tooltip) | P0  |
| BM-006 | Enforce maximum of 10 boards — disable "+ New Board" when limit reached  | P0       |
| BM-007 | Board title max length: 100 characters                                   | P1       |
| BM-008 | Board title cannot be empty (trim whitespace, reject blank)              | P1       |

**Board Creation Flow:**
1. User clicks "+ New Board"
2. Modal appears with a single text input ("Board Name") and Create / Cancel buttons
3. User enters name, clicks Create (or presses Enter)
4. Board is created with 3 default columns and 0 cards
5. User is returned to boards list (does NOT auto-navigate into the new board)

**Board Deletion Flow:**
1. User clicks delete icon on a board card
2. Confirmation dialog appears: "Delete '{Board Name}'? This board has {N} cards. This action cannot be undone."
3. User confirms → board is deleted from `kanban_boards`, its `kanban_board_{id}` and `kanban_cards_{id}` localStorage keys are removed
4. User remains on boards list

### 4.3 Navigation (NAV-xxx)

| ID      | Requirement                                                             | Priority |
| ------- | ----------------------------------------------------------------------- | -------- |
| NAV-001 | Boards list page is at route `/`                                        | P0       |
| NAV-002 | Individual board page is at route `/boards/:boardId`                    | P0       |
| NAV-003 | Breadcrumb in header when inside a board: "All Boards > {Board Title}"  | P0       |
| NAV-004 | "All Boards" in breadcrumb is a clickable link back to `/`              | P0       |
| NAV-005 | Browser back/forward buttons work correctly between routes              | P0       |
| NAV-006 | Navigating to `/boards/:invalidId` shows a "Board not found" page with link back to `/` | P1 |
| NAV-007 | Direct URL access (e.g., bookmark `/boards/abc123`) loads the correct board | P0    |

### 4.4 Header Behavior (NAV-xxx continued)

| ID      | Requirement                                                             | Priority |
| ------- | ----------------------------------------------------------------------- | -------- |
| NAV-008 | **Boards list header**: App title ("Kanban Board") + ThemeToggle only   | P0       |
| NAV-009 | **Board page header**: Breadcrumb + SearchBar + FilterControls + ThemeToggle (same as Phase 1 header) | P0 |
| NAV-010 | Search and filter remain scoped to the currently active board only      | P0       |

### 4.5 Data Migration (MIG-xxx)

| ID      | Requirement                                                             | Priority |
| ------- | ----------------------------------------------------------------------- | -------- |
| MIG-001 | On app load, check for `kanban_migrated` flag in localStorage           | P0       |
| MIG-002 | If not migrated, check for Phase 1 keys (`kanban_board`, `kanban_cards`) | P0      |
| MIG-003 | If Phase 1 data found: migrate board + cards into multi-board schema as the first board | P0 |
| MIG-004 | Preserve all Phase 1 data: board title, columns, column order, card data, card order | P0 |
| MIG-005 | After successful migration, delete old `kanban_board` and `kanban_cards` keys | P0    |
| MIG-006 | Set `kanban_migrated` flag to `true`                                    | P0       |
| MIG-007 | If no Phase 1 data exists and no multi-board data exists, create a default board | P0 |
| MIG-008 | Migration runs only once (idempotent — `kanban_migrated` flag prevents re-runs) | P0 |
| MIG-009 | If migration fails (corrupted data), log error to console and create a fresh default board | P1 |

### 4.6 Within-Board Features (unchanged from Phase 1)

All Phase 1 features remain fully functional within each board:
- Column management (add, edit, delete, reorder, color, card count badge)
- Card management (add, edit, delete, detail modal, priority, labels, drag-and-drop)
- Search and filter (scoped to current board)
- Theme toggle (global, persists across boards)

No new column or card capabilities are introduced in Phase 2.

---

## 5. Component Architecture

```
BrowserRouter
├── App
│   ├── ThemeProvider (global)
│   ├── ToastProvider (global)
│   └── Routes
│       ├── Route path="/" → BoardsListPage
│       │   ├── BoardsListHeader
│       │   │   ├── AppTitle ("Kanban Board")
│       │   │   └── ThemeToggle
│       │   ├── BoardCardGrid
│       │   │   └── BoardCard (repeated, max 10)
│       │   │       ├── BoardCardCollapsed
│       │   │       │   ├── BoardTitle (inline-editable)
│       │   │       │   ├── TotalCardCount
│       │   │       │   ├── CreatedDate
│       │   │       │   ├── ChevronToggle (expand/collapse)
│       │   │       │   └── ActionButtons (rename, delete)
│       │   │       └── BoardCardExpanded (conditionally rendered)
│       │   │           └── ColumnSummaryList
│       │   │               └── ColumnSummaryItem (column name + card count, repeated)
│       │   ├── NewBoardButton
│       │   └── NewBoardModal
│       │       └── BoardNameInput
│       │
│       ├── Route path="/boards/:boardId" → BoardPage
│       │   ├── BoardProvider (board-scoped context)
│       │   ├── FilterProvider (board-scoped)
│       │   ├── BoardPageHeader
│       │   │   ├── Breadcrumb ("All Boards > {Board Title}")
│       │   │   ├── SearchBar
│       │   │   ├── FilterControls
│       │   │   └── ThemeToggle
│       │   ├── Board (Phase 1 Board component, unchanged)
│       │   │   ├── Column (repeated)
│       │   │   │   ├── ColumnHeader
│       │   │   │   ├── CardList (droppable)
│       │   │   │   │   └── CardItem (draggable, repeated)
│       │   │   │   └── AddCardButton
│       │   │   └── AddColumnButton
│       │   ├── CardDetailModal
│       │   └── ConfirmDialog
│       │
│       └── Route path="*" → NotFoundPage
│           └── Link to "/"
```

---

## 6. State Management

### 6.1 State Architecture

Phase 2 splits state into two layers:

1. **Global state** (available everywhere): boards index (`BoardMeta[]`), theme
2. **Board-scoped state** (available only inside `/boards/:boardId`): active board, cards, filters

```
GlobalContext (boards index, theme)
└── BoardContext (active board + cards — loaded/unloaded on route change)
    └── FilterContext (search query, priority filter, label filter)
```

### 6.2 Actions (UPDATED)

```typescript
// === Global Actions (boards index) ===
type GlobalAction =
  | { type: "LOAD_BOARDS"; payload: BoardMeta[] }
  | { type: "ADD_BOARD"; payload: BoardMeta }
  | { type: "RENAME_BOARD"; payload: { id: string; title: string } }
  | { type: "DELETE_BOARD"; payload: { id: string } }
  | { type: "UPDATE_BOARD_CARD_COUNT"; payload: { id: string; totalCards: number } };

// === Board-Scoped Actions (within a single board) ===
type BoardAction =
  // Board
  | { type: "SET_BOARD_TITLE"; payload: string }
  // Columns
  | { type: "ADD_COLUMN"; payload: { title: string } }
  | { type: "UPDATE_COLUMN"; payload: { id: string; title?: string; color?: string } }
  | { type: "DELETE_COLUMN"; payload: { id: string } }
  | { type: "REORDER_COLUMNS"; payload: { sourceIndex: number; destinationIndex: number } }
  // Cards
  | { type: "ADD_CARD"; payload: { columnId: string; card: Card } }
  | { type: "UPDATE_CARD"; payload: { id: string; updates: Partial<Card> } }
  | { type: "DELETE_CARD"; payload: { id: string; columnId: string } }
  | { type: "MOVE_CARD"; payload: { cardId: string; sourceColumnId: string; destinationColumnId: string; sourceIndex: number; destinationIndex: number } }
  // Persistence
  | { type: "LOAD_STATE"; payload: { board: Board; cards: Record<string, Card> } };
```

### 6.3 Reducer Guards

The global reducer MUST enforce these invariants:

| Rule                          | Enforcement                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| Max 10 boards                 | `ADD_BOARD` is a no-op if `boards.length >= 10`                             |
| Min 1 board                   | `DELETE_BOARD` is a no-op if `boards.length <= 1`                           |
| No empty board titles         | `ADD_BOARD` and `RENAME_BOARD` reject empty/whitespace-only titles          |
| Board title max 100 chars     | `ADD_BOARD` and `RENAME_BOARD` truncate or reject titles exceeding 100 chars|

### 6.4 Persistence Strategy (UPDATED)

- **Boards index**: read/write `kanban_boards` on every `GlobalAction` dispatch (debounced 300ms)
- **Active board**: read `kanban_board_{boardId}` + `kanban_cards_{boardId}` when navigating into a board; write on every `BoardAction` dispatch (debounced 300ms)
- **On board leave**: no explicit save needed (already saved on last action)
- **Card count sync**: when a card is added or deleted within a board, dispatch `UPDATE_BOARD_CARD_COUNT` to update the global boards index
- **Board rename sync**: when a board title is changed from within the board page (via breadcrumb or other means), dispatch `RENAME_BOARD` to update the global index

---

## 6.5 Deployment Configuration

For production SPA (Single Page Application) to work correctly with client-side routing, the hosting platform must be configured to serve `index.html` for all routes. This ensures `/boards/{boardId}` deep URLs don't return 404s.

**Vite Dev Server:** `historyApiFallback` is automatic — no config needed.

**Production Hosts:**
- **Vercel:** Auto-configures SPA fallback on build
- **Netlify:** Add `netlify.toml`:
  ```toml
  [[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  ```
- **GitHub Pages:** NOT recommended (lacks SPA fallback support)
- **Self-hosted (nginx, etc.):** Configure server to serve `index.html` for 404s

---

## 7. File Structure

```
src/
├── components/
│   ├── Board/                         # Phase 1 — within-board components (unchanged)
│   │   ├── Board.tsx
│   │   ├── Column.tsx
│   │   ├── ColumnHeader.tsx
│   │   ├── AddColumn.tsx
│   │   └── index.ts
│   ├── BoardsList/                    # NEW — boards list page components
│   │   ├── BoardCard.tsx              # Single board card with collapse/expand
│   │   ├── BoardCardExpanded.tsx      # Expanded view with column breakdown
│   │   ├── NewBoardButton.tsx         # "+ New Board" trigger
│   │   ├── NewBoardModal.tsx          # Board creation modal
│   │   └── index.ts
│   ├── Card/                          # Phase 1 — unchanged
│   │   ├── CardItem.tsx
│   │   ├── CardDetail.tsx
│   │   ├── AddCard.tsx
│   │   └── index.ts
│   ├── Header/                        # UPDATED — split into two header variants
│   │   ├── BoardsListHeader.tsx       # NEW — header for boards list (title + theme)
│   │   ├── BoardPageHeader.tsx        # NEW — header for board view (breadcrumb + search + filter + theme)
│   │   ├── Breadcrumb.tsx             # NEW — "All Boards > {Board Title}"
│   │   ├── SearchBar.tsx              # Phase 1 — unchanged
│   │   ├── FilterControls.tsx         # Phase 1 — unchanged (if exists)
│   │   └── index.ts
│   └── UI/                            # Phase 1 — unchanged + additions
│       ├── ConfirmDialog.tsx
│       ├── Modal.tsx
│       ├── ThemeToggle.tsx
│       ├── Toast.tsx
│       ├── NotFoundPage.tsx           # NEW — 404 page for invalid board IDs
│       └── index.ts
├── context/
│   ├── BoardsContext.tsx              # NEW — global boards index context + reducer
│   ├── BoardContext.tsx               # UPDATED — scoped to a single board (loaded per route)
│   ├── FilterContext.tsx              # Phase 1 — unchanged
│   ├── ThemeContext.tsx               # Phase 1 — unchanged
│   └── ToastContext.tsx               # Phase 1 — unchanged
├── hooks/
│   ├── useLocalStorage.ts            # Phase 1 — unchanged
│   ├── useDebouncedSave.ts           # Phase 1 — unchanged
│   └── useMigration.ts              # NEW — Phase 1 data migration hook
├── pages/                             # NEW — route-level page components
│   ├── BoardsListPage.tsx            # Home page at "/"
│   └── BoardPage.tsx                 # Individual board at "/boards/:boardId"
├── types/
│   └── index.ts                       # UPDATED — add BoardMeta, update AppState
├── utils/
│   ├── defaults.ts                    # UPDATED — add default board factory
│   ├── storage.ts                     # UPDATED — multi-board read/write helpers
│   ├── migration.ts                   # NEW — Phase 1 → Phase 2 migration logic
│   ├── labelColor.ts                  # Phase 1 — unchanged
│   └── scrollLock.ts                  # Phase 1 — unchanged
├── App.tsx                            # UPDATED — BrowserRouter + Routes
├── main.tsx                           # Phase 1 — unchanged
└── index.css                          # Phase 1 — unchanged
```

---

## 8. Acceptance Criteria

### 8.1 Board List — Display

**Scenario 1: User sees all boards on the home page**
```gherkin
Given the user has 3 boards saved in localStorage
When the user navigates to "/"
Then the user sees 3 board cards displayed
And each card shows the board title, total card count, and created date
And the cards are ordered by creation date (oldest first)
```

**Scenario 2: Board card collapsed view (default)**
```gherkin
Given the user is on the boards list page
When a board card is in its default collapsed state
Then the card displays the board title and total card count
And a chevron icon indicating the card can be expanded
```

**Scenario 3: Board card expanded view**
```gherkin
Given the user is on the boards list page
And a board card is in its collapsed state
When the user clicks the chevron toggle button on the card
Then the card expands to show a list of column names with per-column card counts
And the chevron icon rotates to indicate the expanded state
```

**Scenario 4: Board card collapse toggle**
```gherkin
Given a board card is in its expanded state
When the user clicks the chevron toggle button
Then the card collapses back to show only the title and total card count
```

### 8.2 Board Creation

**Scenario 5: Create a new board (happy path)**
```gherkin
Given the user is on the boards list page
And fewer than 10 boards exist
When the user clicks the "+ New Board" button
Then a modal appears with a text input labeled "Board Name" and Create/Cancel buttons
When the user types "Project Alpha" and clicks Create
Then a new board is created with 3 default columns ("To Do", "In Progress", "Done") and 0 cards
And the modal closes
And the new board card appears on the boards list
```

**Scenario 6: Board creation limit enforced**
```gherkin
Given the user has exactly 10 boards
When the user views the boards list page
Then the "+ New Board" button is disabled
And a tooltip or message indicates "Maximum of 10 boards reached"
```

**Scenario 7: Board creation with empty name rejected**
```gherkin
Given the new board modal is open
When the user submits with an empty or whitespace-only name
Then the board is not created
And the input shows a validation error: "Board name cannot be empty"
```

### 8.3 Board Rename

**Scenario 8: Rename a board inline**
```gherkin
Given the user is on the boards list page
When the user clicks the rename action on a board card
Then the board title becomes an editable text input (pre-filled with current title)
When the user changes the title to "Project Beta" and presses Enter (or clicks away)
Then the board title is updated to "Project Beta" in the card and in localStorage
```

**Scenario 9: Rename rejects empty title**
```gherkin
Given a board title is in inline-edit mode
When the user clears the title and presses Enter
Then the title reverts to its previous value
And the board is not renamed
```

### 8.4 Board Deletion

**Scenario 10: Delete a board (happy path)**
```gherkin
Given the user is on the boards list page
And more than 1 board exists
When the user clicks the delete action on a board card
Then a confirmation dialog appears showing "Delete '{Board Name}'? This board has {N} cards. This action cannot be undone."
When the user confirms the deletion
Then the board is removed from the boards list
And the board's localStorage keys (kanban_board_{id} and kanban_cards_{id}) are deleted
```

**Scenario 11: Cannot delete the last board**
```gherkin
Given only 1 board exists
When the user views the boards list page
Then the delete action on the board card is disabled
And a tooltip indicates "Cannot delete the last board"
```

### 8.5 Navigation

**Scenario 12: Navigate into a board**
```gherkin
Given the user is on the boards list page
When the user clicks on a board card (not on a rename/delete action or chevron toggle)
Then the URL changes to "/boards/{boardId}"
And the board page loads with the full board view (columns, cards, drag-and-drop)
And the header shows breadcrumb "All Boards > {Board Title}", search bar, filter controls, and theme toggle
```

**Scenario 13: Navigate back to boards list via breadcrumb**
```gherkin
Given the user is viewing a board at "/boards/{boardId}"
When the user clicks "All Boards" in the breadcrumb
Then the URL changes to "/"
And the boards list page is displayed
```

**Scenario 14: Browser back button navigation**
```gherkin
Given the user navigated from "/" to "/boards/{boardId}"
When the user clicks the browser back button
Then the URL changes to "/"
And the boards list page is displayed
```

**Scenario 15: Direct URL access to a board**
```gherkin
Given a board with ID "abc123" exists in localStorage
When the user navigates directly to "/boards/abc123" (via bookmark or URL bar)
Then the board page loads correctly with all data
```

**Scenario 16: Invalid board URL**
```gherkin
Given no board with ID "nonexistent" exists
When the user navigates to "/boards/nonexistent"
Then a "Board not found" page is displayed
And a link back to "/" (boards list) is shown
```

### 8.6 Header Behavior

**Scenario 17: Boards list header**
```gherkin
Given the user is on the boards list page at "/"
When the header renders
Then it displays the app title "Kanban Board"
And a theme toggle button
And it does NOT display a search bar, filter controls, or breadcrumb
```

**Scenario 18: Board page header**
```gherkin
Given the user is viewing a board titled "Project Alpha"
When the header renders
Then it displays a breadcrumb: "All Boards > Project Alpha"
And a search bar
And filter controls
And a theme toggle button
And it does NOT display the standalone app title
```

### 8.7 Data Migration

**Scenario 19: Phase 1 data auto-migrated on first load**
```gherkin
Given the user has Phase 1 data in localStorage (kanban_board and kanban_cards keys)
And no kanban_migrated flag exists
When the app loads
Then the Phase 1 board is migrated as the first board in the new multi-board schema
And a kanban_boards index entry is created with the correct title and card count
And kanban_board_{id} and kanban_cards_{id} keys are created with the original data
And the old kanban_board and kanban_cards keys are deleted
And the kanban_migrated flag is set to true
And the user sees their existing board on the boards list page with all data intact
```

**Scenario 20: Fresh install (no previous data)**
```gherkin
Given no localStorage data exists for the app (no Phase 1 keys and no Phase 2 keys)
When the app loads
Then a default board is created with title "My Board", 3 default columns, and 0 cards
And the user sees the boards list page with one board card
```

**Scenario 21: Migration does not re-run**
```gherkin
Given the kanban_migrated flag is set to true in localStorage
And the old kanban_board key does not exist
When the app loads
Then no migration logic executes
And the app loads the multi-board data from kanban_boards as normal
```

**Scenario 22: Migration handles corrupted Phase 1 data**
```gherkin
Given the localStorage contains a kanban_board key with invalid/corrupted JSON
And no kanban_migrated flag exists
When the app loads
Then the migration logs an error to the console
And a fresh default board is created
And the corrupted keys are cleaned up
And the kanban_migrated flag is set to true
```

### 8.8 Search and Filter Scope

**Scenario 23: Search scoped to current board**
```gherkin
Given the user is viewing Board A which contains a card titled "Fix login bug"
And Board B contains a card titled "Fix payment bug"
When the user types "Fix" in the search bar
Then only "Fix login bug" from Board A is shown in the results
And cards from Board B are not searched or displayed
```

### 8.9 Within-Board Functionality

**Scenario 24: All Phase 1 features work within a board**
```gherkin
Given the user is viewing a board at "/boards/{boardId}"
When the user performs any Phase 1 action (add/edit/delete columns, add/edit/delete/drag cards, search, filter)
Then the action works identically to Phase 1 behavior
And changes are persisted to the board-specific localStorage keys
And the board card count on the boards list is updated after card add/delete
```

---

## 9. Migration Plan

### 9.1 Migration Logic (step-by-step)

The migration runs as a synchronous function during app initialization, **before** the React tree renders.

```
Step 1: Read kanban_migrated from localStorage
        → If true: SKIP migration, proceed to normal load
        → If false or absent: continue to Step 2

Step 2: Read kanban_board from localStorage
        → If absent: no Phase 1 data exists, go to Step 6
        → If present: continue to Step 3

Step 3: Parse kanban_board JSON
        → If parse fails: log error, go to Step 6
        → If parse succeeds: continue to Step 4

Step 4: Read and parse kanban_cards from localStorage
        → If absent or parse fails: use empty cards object {}
        → Continue to Step 5

Step 5: Write new multi-board data
        a. Generate a board ID (if the old board has one, reuse it; otherwise generate UUID)
        b. Compute totalCards = Object.keys(parsedCards).length
        c. Write kanban_boards = [{ id, title, totalCards, createdAt, updatedAt }]
        d. Write kanban_board_{id} = parsedBoard (with id field ensured)
        e. Write kanban_cards_{id} = parsedCards
        f. Delete kanban_board
        g. Delete kanban_cards
        h. Write kanban_migrated = true
        → Migration complete

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

Step 6a: (Edge case guard) If kanban_migrated = true but kanban_boards is empty
        → Re-run Step 6 to create a fresh default board
        → (Handles rare case where migration flag was written but boards index write failed)
```

### 9.2 Migration Safety

- Migration is **idempotent**: the `kanban_migrated` flag prevents re-execution
- Migration is **atomic in intent**: if any write fails mid-migration (localStorage quota), the old keys are NOT deleted; on next load the migration retries
- Migration runs **synchronously before render**: users never see a flash of empty state

---

## 10. Out of Scope (Phase 3+)

| Item                                   | Rationale                                         |
| -------------------------------------- | ------------------------------------------------- |
| Backend API / database                 | Phase 3 — requires server infrastructure          |
| User authentication                    | Phase 3 — depends on backend                      |
| Real-time collaboration                | Phase 3 — requires WebSockets + backend           |
| Board templates / duplication          | Low priority, can be added incrementally           |
| Cross-board search                     | Complexity not justified for localStorage-only     |
| Board reordering / drag-and-drop       | Low priority, boards are ordered by creation date  |
| Board archiving (soft-delete)          | Can be added if users request it                   |
| Board sharing / export                 | Requires backend or file-download mechanism        |
| Activity log / card history            | Phase 3                                            |
| File attachments                       | Phase 3                                            |
| Due dates, reminders, calendar         | Phase 3                                            |
| Board-level settings (e.g., WIP limits)| Future enhancement                                 |

---

## 11. Success Metrics

| Metric                                          | Target           |
| ----------------------------------------------- | ---------------- |
| First Contentful Paint                           | < 1.5s           |
| Route transition latency (list <-> board)        | < 200ms          |
| Board creation time (click Create to card visible) | < 300ms        |
| Migration execution time (Phase 1 data)          | < 100ms          |
| localStorage read/write per operation             | < 50ms           |
| Lighthouse Performance Score                     | > 90             |
| Zero data loss during migration                  | 100% of Phase 1 data preserved |
| Boards list renders correctly with 10 boards     | No layout breakage |
