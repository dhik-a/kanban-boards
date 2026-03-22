> **Note:** This document covers Phase 1 of the Kanban board application (single-board, localStorage, no authentication). For the multi-board extension, see [PRD-phase-2.md](./PRD-phase-2.md).

# Product Requirements Document: Kanban Board App

## Metadata

| Field         | Value                          |
| ------------- | ------------------------------ |
| Project       | Kanban Board                   |
| Version       | 1.0.0                         |
| Phase         | 1 — Frontend Only             |
| Status        | Draft                          |
| Created       | 2026-03-22                     |
| Stack         | React, TypeScript, Tailwind CSS|
| Persistence   | localStorage                   |

---

## 1. Overview

### 1.1 Problem Statement

Teams and individuals need a lightweight, visual task management tool to organize work across stages. Existing solutions are either too complex or require account creation and server infrastructure.

### 1.2 Solution

A simple, browser-based Kanban board application that runs entirely on the client side. Users can create boards with customizable columns, manage task cards with drag-and-drop, and have their data automatically persisted in the browser's `localStorage`.

### 1.3 Goals

- Provide an intuitive drag-and-drop Kanban interface
- Zero setup — works immediately in any modern browser
- Offline-capable with no backend dependency (Phase 1)
- Clean, responsive UI that works on desktop and mobile

### 1.4 Non-Goals (Phase 1)

- User authentication / multi-user support
- Backend API / database persistence
- Real-time collaboration
- File attachments
- Due dates and calendar integration
- Activity history / audit log

---

## 2. Tech Stack

| Layer         | Technology                     | Rationale                              |
| ------------- | ------------------------------ | -------------------------------------- |
| Framework     | React 18+                     | Component-based UI, large ecosystem    |
| Language      | TypeScript                     | Type safety, better DX                 |
| Build Tool    | Vite                           | Fast HMR, minimal config              |
| Styling       | Tailwind CSS                   | Utility-first, rapid prototyping       |
| Drag & Drop   | @dnd-kit/core + @dnd-kit/sortable | Accessible, performant DnD library |
| State         | React Context + useReducer     | Simple global state without extra deps |
| Persistence   | localStorage                   | No backend needed for Phase 1          |
| Icons         | lucide-react                   | Lightweight, consistent icon set       |
| IDs           | uuid                           | Unique identifier generation           |

---

## 3. Data Model

### 3.1 Board

```typescript
interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### 3.2 Column

```typescript
interface Column {
  id: string;
  title: string;
  cardIds: string[];   // ordered list of card IDs
  color: string;       // hex color for column header accent
}
```

### 3.3 Card

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

### 3.4 App State

```typescript
interface AppState {
  board: Board;
  cards: Record<string, Card>;  // normalized card storage by ID
}
```

### 3.5 localStorage Schema

| Key               | Type       | Description                    |
| ----------------- | ---------- | ------------------------------ |
| `kanban_board`    | `Board`    | Board structure with columns   |
| `kanban_cards`    | `Record<string, Card>` | All cards indexed by ID |
| `kanban_theme`    | `string`   | Theme preference: `"light"` or `"dark"` |

---

## 4. Features

### 4.1 Board Management

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| B-001  | Display a single board with a title                  | P0       |
| B-002  | Edit board title inline                              | P1       |
| B-003  | Board auto-saves to localStorage on every state change | P0     |
| B-004  | Board loads from localStorage on app start           | P0       |
| B-005  | Initialize default board if no saved data exists     | P0       |

**Constraints:**
- Board title max length: 100 characters

**Default Board Structure:**
- Column 1: "To Do"
- Column 2: "In Progress"
- Column 3: "Done"

### 4.2 Column Management

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| C-001  | Display columns in horizontal layout                 | P0       |
| C-002  | Add a new column via "+ Add Column" button           | P0       |
| C-003  | Edit column title inline (click to edit)             | P0       |
| C-004  | Delete a column (with confirmation dialog)           | P1       |
| C-005  | Reorder columns via drag-and-drop                    | P2       |
| C-006  | Set column header accent color                       | P2       |
| C-007  | Display card count badge on column header            | P1       |

**Constraints:**
- Minimum 1 column must exist (cannot delete the last column)
- Maximum 10 columns per board
- Column title max length: 50 characters

### 4.3 Card Management

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| K-001  | Add a new card via "+ Add Card" button at column bottom | P0    |
| K-002  | Quick-add: enter card title and press Enter to create | P0     |
| K-003  | Open card detail modal on card click                 | P0       |
| K-004  | Edit card title in detail modal                      | P0       |
| K-005  | Edit card description in detail modal (plain text)   | P0       |
| K-006  | Set card priority (low / medium / high)              | P0       |
| K-007  | Add/remove labels (free-text tags)                   | P1       |
| K-008  | Delete card (with confirmation)                      | P0       |
| K-009  | Display priority indicator on card (color-coded)     | P0       |
| K-010  | Display labels as colored chips on card              | P1       |
| K-011  | Show card creation date                              | P1       |

**Constraints:**
- Card title max length: 100 characters
- Card description max length: 2000 characters
- Maximum 5 labels per card
- Label text max length: 20 characters

### 4.4 Drag and Drop

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| D-001  | Drag a card to reorder within the same column        | P0       |
| D-002  | Drag a card to move to a different column            | P0       |
| D-003  | Show visual drop indicator during drag               | P0       |
| D-004  | Drag overlay shows a preview of the dragged card     | P1       |
| D-005  | Keyboard accessible drag-and-drop                    | P2       |

### 4.5 Search and Filter

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| S-001  | Global search bar filters cards by title match       | P1       |
| S-002  | Filter cards by priority level                       | P1       |
| S-003  | Filter cards by label                                | P2       |
| S-004  | Clear all filters button                             | P1       |
| S-005  | Show "no results" state when filters match nothing   | P1       |

### 4.6 UI / UX

| ID     | Requirement                                          | Priority |
| ------ | ---------------------------------------------------- | -------- |
| U-001  | Responsive layout: horizontal scroll on desktop, vertical stack on mobile | P0 |
| U-002  | Light and dark theme toggle                          | P1       |
| U-003  | Smooth animations for card movement                  | P1       |
| U-004  | Empty column placeholder ("No cards yet")            | P0       |
| U-005  | Confirmation dialogs for destructive actions         | P0       |
| U-006  | Toast notifications for key actions (card created, deleted, etc.) | P2 |

---

## 5. Component Architecture

```
App
├── Header
│   ├── BoardTitle (editable)
│   ├── SearchBar
│   ├── FilterControls
│   └── ThemeToggle
├── Board
│   ├── Column (repeated)
│   │   ├── ColumnHeader
│   │   │   ├── ColumnTitle (editable)
│   │   │   ├── CardCount
│   │   │   └── ColumnMenu (delete, color)
│   │   ├── CardList (droppable)
│   │   │   └── CardItem (draggable, repeated)
│   │   │       ├── CardTitle
│   │   │       ├── PriorityBadge
│   │   │       └── LabelChips
│   │   └── AddCardButton
│   └── AddColumnButton
├── CardDetailModal
│   ├── TitleInput
│   ├── DescriptionInput
│   ├── PrioritySelect
│   ├── LabelsInput
│   ├── MetadataDisplay (dates)
│   └── DeleteButton
└── ConfirmDialog
```

---

## 6. State Management

### 6.1 Actions

```typescript
type Action =
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
  | { type: "LOAD_STATE"; payload: AppState };
```

### 6.2 Persistence Strategy

- Use a `useEffect` hook that watches `AppState` changes
- Debounce writes to `localStorage` (300ms) to avoid excessive writes
- On app load, read from `localStorage` and dispatch `LOAD_STATE`
- If `localStorage` is empty, initialize with default board

---

## 7. File Structure

```
src/
├── components/
│   ├── Board/
│   │   ├── Board.tsx
│   │   ├── Column.tsx
│   │   ├── ColumnHeader.tsx
│   │   ├── AddColumn.tsx
│   │   └── index.ts
│   ├── Card/
│   │   ├── CardItem.tsx
│   │   ├── CardDetail.tsx
│   │   ├── AddCard.tsx
│   │   └── index.ts
│   ├── Header/
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterControls.tsx
│   │   └── index.ts
│   └── UI/
│       ├── ConfirmDialog.tsx
│       ├── Modal.tsx
│       ├── ThemeToggle.tsx
│       └── index.ts
├── context/
│   ├── BoardContext.tsx
│   └── ThemeContext.tsx
├── hooks/
│   ├── useLocalStorage.ts
│   └── useDebouncedSave.ts
├── types/
│   └── index.ts
├── utils/
│   ├── defaults.ts
│   └── storage.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 8. Acceptance Criteria

### 8.1 Core Flow

1. User opens the app → sees a default board with 3 columns
2. User clicks "+ Add Card" on "To Do" column → types title → presses Enter → card appears
3. User clicks a card → detail modal opens → user edits description and sets priority → saves
4. User drags card from "To Do" to "In Progress" → card moves to target column
5. User refreshes the page → all data is preserved from localStorage

### 8.2 Edge Cases

- Empty board: at least 1 column must always exist
- Long text: titles and descriptions are truncated in card view, full text in modal
- localStorage full: show error toast, do not crash
- Concurrent tabs: last-write-wins (no cross-tab sync in Phase 1)

---

## 9. Future Phases (Out of Scope)

| Phase | Features                                             |
| ----- | ---------------------------------------------------- |
| 2     | Multiple boards (still localStorage, no backend)     |
| 2     | Board list home page with navigation                 |
| 2     | URL routing per board                                |
| 2     | Auto-migration of Phase 1 data                       |
| 3     | Backend API (Node.js/Express + PostgreSQL)            |
| 3     | User authentication (email/password, OAuth)           |
| 3     | Real-time collaboration (WebSocket)                  |
| 3     | Activity log / card history                          |
| 3     | File attachments                                     |
| 3     | Due dates, reminders, calendar view                  |

**Phase 2 Migration Note:** Migrating from a single-board model (using the `kanban_board` and `kanban_cards` localStorage keys) to a multi-board model in Phase 2 will require a data migration step. The Phase 2 implementation must detect the existing single-board data format and migrate it into the new multi-board schema on first load, preserving all user data. Plan for a migration utility as part of the Phase 2 backend transition.

---

## 10. Success Metrics

| Metric                              | Target        |
| ----------------------------------- | ------------- |
| First Contentful Paint              | < 1.5s        |
| Drag-and-drop interaction latency   | < 100ms       |
| localStorage save latency           | < 50ms        |
| Lighthouse Performance Score        | > 90          |
| Mobile usability (Lighthouse)       | 100           |
