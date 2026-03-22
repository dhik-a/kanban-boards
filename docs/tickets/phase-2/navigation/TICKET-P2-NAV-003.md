# TICKET-P2-NAV-003: Route-Specific Header Variants

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV (Navigation)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARD-001
**Related Scenarios**: 17, 18
**Related Feature IDs**: NAV-008, NAV-009, NAV-010

---

## Problem Statement

The boards list page and the board view page have different contextual needs in the header. The boards list only needs the app title and theme toggle, while the board view needs breadcrumb navigation, search, and filter controls. A single header component cannot serve both contexts well.

---

## Goal & Success Metrics

- **Goal**: Implement two distinct header variants that render based on the current route.
- **Success looks like**: Users see the appropriate header for each page with no visual flicker during transitions.

---

## User Story

As a Kanban user,
I want the header to show relevant controls for the page I am on,
So that I am not confused by irrelevant UI elements.

---

## Acceptance Criteria

### Scenario 1: Boards list header
```gherkin
Given the user is on the boards list page at "/"
When the header renders
Then it displays the app title "Kanban Board"
And a theme toggle button
And it does NOT display a search bar, filter controls, or breadcrumb
```

### Scenario 2: Board page header
```gherkin
Given the user is viewing a board titled "Project Alpha"
When the header renders
Then it displays a breadcrumb: "All Boards > Project Alpha"
And a search bar
And filter controls
And a theme toggle button
And it does NOT display the standalone app title "Kanban Board"
```

### Scenario 3: Header transitions correctly between routes
```gherkin
Given the user is on the boards list page seeing the boards list header
When the user navigates to a board
Then the header changes to the board page header variant
And no elements from the boards list header remain visible
```

### Scenario 4: Header transitions back correctly
```gherkin
Given the user is on a board page seeing the board page header
When the user navigates back to the boards list
Then the header changes to the boards list header variant
And no elements from the board page header remain visible
```

---

## Additional Context & Notes

- **Assumptions**: Each page component renders its own header variant. There is not a single shared header that conditionally renders -- instead, each page owns its header.
- **Dependencies**: TICKET-P2-NAV-001 (routing), TICKET-P2-NAV-002 (breadcrumb).
- **Out of scope**: Any header functionality changes (search and filter behavior remain identical to Phase 1).

---

## Notes for AI Agents

- Create `BoardsListHeader.tsx` in `components/Header/`. It renders: app title text ("Kanban Board") + `ThemeToggle` component.
- Create `BoardPageHeader.tsx` in `components/Header/`. It renders: `Breadcrumb` + `SearchBar` + `FilterControls` + `ThemeToggle`.
- `BoardsListHeader` is used inside `BoardsListPage`.
- `BoardPageHeader` is used inside `BoardPage`.
- The existing Phase 1 header component can be refactored into `BoardPageHeader` since it already contains search, filter, and theme toggle.
- Search and filter controls (NAV-010) remain scoped to the current board -- no changes to their logic needed.
