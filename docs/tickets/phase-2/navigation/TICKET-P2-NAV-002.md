# TICKET-P2-NAV-002: Breadcrumb Navigation in Board View

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV (Navigation)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARD-001
**Related Scenarios**: 12, 13
**Related Feature IDs**: NAV-003, NAV-004

---

## Problem Statement

When users are inside a board view, they need a clear visual indicator of where they are in the app hierarchy and a quick way to navigate back to the boards list. A breadcrumb provides both context and navigation.

---

## Goal & Success Metrics

- **Goal**: Display a breadcrumb ("All Boards > {Board Title}") in the header when viewing a board, with "All Boards" as a clickable link.
- **Success looks like**: Users always know which board they are viewing and can return to the boards list in one click.

---

## User Story

As a Kanban user viewing a specific board,
I want to see a breadcrumb showing where I am in the app,
So that I can navigate back to the boards list easily.

---

## Acceptance Criteria

### Scenario 1: Breadcrumb displayed on board page
```gherkin
Given the user is viewing a board titled "Project Alpha" at "/boards/{boardId}"
When the header renders
Then a breadcrumb is displayed showing "All Boards > Project Alpha"
And "All Boards" is styled as a clickable link
And "Project Alpha" is styled as the current (non-clickable) page
```

### Scenario 2: Navigate back to boards list via breadcrumb
```gherkin
Given the user is viewing a board at "/boards/{boardId}"
When the user clicks "All Boards" in the breadcrumb
Then the URL changes to "/"
And the boards list page is displayed
```

### Scenario 3: Breadcrumb reflects board title changes
```gherkin
Given the user is viewing a board titled "Old Name"
And the board title is changed to "New Name" (e.g., via inline edit synced from another mechanism)
When the header re-renders
Then the breadcrumb shows "All Boards > New Name"
```

---

## Additional Context & Notes

- **Assumptions**: The breadcrumb is a simple two-level hierarchy (home > current board). No deeper nesting is needed in Phase 2.
- **Dependencies**: TICKET-P2-NAV-001 (routing setup), TICKET-P2-NAV-003 (header variants).
- **Out of scope**: Breadcrumb editing of the board title. The breadcrumb displays the title but does not support inline editing.

---

## Notes for AI Agents

- Create a `Breadcrumb.tsx` component in `components/Header/`.
- The breadcrumb takes the current board title as a prop (from board-scoped context or page state).
- "All Boards" should be a `<Link to="/">` from react-router-dom.
- The separator between "All Boards" and the board title should be a visual separator character (e.g., ">", "/" or a chevron icon).
- The current board title (last breadcrumb item) should not be a link.
- The breadcrumb is rendered inside `BoardPageHeader`, not `BoardsListHeader`.
