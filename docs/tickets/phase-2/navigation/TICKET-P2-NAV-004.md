# TICKET-P2-NAV-004: Invalid Board URL (404 Page)

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV (Navigation)
**Priority**: P1
**Dependencies**: P2-NAV-001, P2-BOARD-001
**Related Scenarios**: 16
**Related Feature IDs**: NAV-006

---

## Problem Statement

Users may navigate to a board URL that does not exist, either through a stale bookmark, a manually typed URL, or after a board has been deleted. Without a proper 404 page, users would see an error or a blank screen with no way to recover.

---

## Goal & Success Metrics

- **Goal**: Display a user-friendly "Board not found" page when navigating to an invalid board ID, with a link back to the boards list.
- **Success looks like**: Users encountering an invalid board URL can easily navigate back to the boards list without confusion.

---

## User Story

As a Kanban user,
I want to see a helpful message when I navigate to a board that does not exist,
So that I can find my way back to my boards.

---

## Acceptance Criteria

### Scenario 1: Invalid board ID in URL
```gherkin
Given no board with ID "nonexistent" exists in localStorage
When the user navigates to "/boards/nonexistent"
Then a "Board not found" page is displayed
And a link back to "/" (boards list) is shown with text like "Back to All Boards"
```

### Scenario 2: Board deleted then URL accessed
```gherkin
Given a board with ID "abc123" was previously deleted
When the user navigates to "/boards/abc123" via a stale bookmark
Then a "Board not found" page is displayed
And a link back to "/" is shown
```

### Scenario 3: Completely invalid route
```gherkin
Given the user navigates to a route that does not match any defined path (e.g., "/settings" or "/foo/bar")
When the page loads
Then a generic "Page not found" message is displayed
And a link back to "/" is shown
```

---

## Additional Context & Notes

- **Assumptions**: The "Board not found" state is detected within `BoardPage` when the board data cannot be loaded from localStorage. The catch-all `*` route handles completely unknown paths.
- **Dependencies**: TICKET-P2-NAV-001 (routing setup).
- **Out of scope**: Redirect logic, suggested boards, or search on the 404 page.

---

## Notes for AI Agents

- Create `NotFoundPage.tsx` in `components/UI/` for the catch-all `*` route.
- Within `BoardPage`, after reading `boardId` from `useParams()`, attempt to load the board from localStorage. If the board does not exist (key missing or data is null), render a "Board not found" view instead of the board UI.
- The "Board not found" view can be a simple component with a message and a `<Link to="/">Back to All Boards</Link>`.
- Both the board-specific 404 and the generic 404 should have a consistent visual style.
- Do not redirect automatically -- show the message and let the user choose to navigate.
