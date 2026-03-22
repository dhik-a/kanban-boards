# TICKET-P2-BOARDS-001: Display Board Cards on Home Page

**Phase**: 2 -- Multi-Board
**Feature Area**: BL (Board List)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARDS-007
**Related Scenarios**: 1, 2
**Related Feature IDs**: BL-001, BL-002, BL-003

---

## Problem Statement

Users need a home page that gives them an overview of all their boards so they can quickly identify and navigate to the board they want to work on. Without this, there is no entry point into the multi-board experience.

---

## Goal & Success Metrics

- **Goal**: Provide a boards list home page that displays all boards with key metadata.
- **Success looks like**: Users can see all their boards at a glance, ordered by creation date, with title, card count, and created date visible on each card.

---

## User Story

As a Kanban user,
I want to see all my boards listed on the home page,
So that I can get a quick overview of my projects and choose which one to work on.

---

## Acceptance Criteria

### Scenario 1: User sees all boards on the home page
```gherkin
Given the user has 3 boards saved in localStorage
When the user navigates to "/"
Then the user sees 3 board cards displayed
And each card shows the board title, total card count, and created date
And the cards are ordered by creation date (oldest first)
```

### Scenario 2: Board card collapsed view (default)
```gherkin
Given the user is on the boards list page
When a board card is in its default collapsed state
Then the card displays the board title and total card count
And a chevron icon indicating the card can be expanded
```

### Scenario 3: Single board displays correctly
```gherkin
Given the user has exactly 1 board with title "My Board" and 5 cards
When the user navigates to "/"
Then the user sees 1 board card
And the card shows "My Board" as the title
And the card shows "5" as the total card count
And the card shows the creation date
```

### Scenario 4: Default board name reference
```gherkin
Given the system creates a default board
When the board is displayed on the boards list
Then the default board name is "My Board" (not "My Kanban Board")
```

---

## Additional Context & Notes

- **Assumptions**: Board cards are static (not reorderable). Display order is always oldest-first by `createdAt`.
- **Dependencies**: Requires the `BoardMeta` type and `kanban_boards` localStorage key to be available.
- **Out of scope**: Board reordering, drag-and-drop of board cards, expanded view (covered in TICKET-P2-BOARDS-002).

---

## Notes for AI Agents

- The boards list is rendered from the `BoardMeta[]` array stored under the `kanban_boards` localStorage key.
- Each `BoardMeta` has: `id`, `title`, `totalCards`, `createdAt`, `updatedAt`.
- Sort boards by `createdAt` ascending (oldest first) before rendering.
- The collapsed card shows: board title, total card count, created date, and a chevron toggle button.
- The route for this page is `/` (root).
- Board cards must also display rename and delete action buttons (BL-008), but the behavior of those buttons is covered in separate tickets.
