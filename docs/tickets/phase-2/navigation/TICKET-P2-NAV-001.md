# TICKET-P2-NAV-001: Client-Side Routing Setup

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV (Navigation)
**Priority**: P0
**Dependencies**: P2-BOARDS-007
**Related Scenarios**: 12, 14, 15
**Related Feature IDs**: NAV-001, NAV-002, NAV-005, NAV-007

---

## Problem Statement

Phase 1 is a single-page app with no routing. Phase 2 introduces multiple pages (boards list and individual board views) that need distinct URLs, browser history support, and direct URL access via bookmarks. Client-side routing must be added to enable this navigation model.

---

## Goal & Success Metrics

- **Goal**: Introduce react-router-dom v6 with routes for boards list (`/`) and board view (`/boards/:boardId`).
- **Success looks like**: Route transitions complete in under 200ms. Browser back/forward buttons work correctly. Bookmarked URLs load the correct page.

---

## User Story

As a Kanban user,
I want to navigate between the boards list and individual boards using URLs,
So that I can bookmark boards, use browser history, and share links.

---

## Acceptance Criteria

### Scenario 1: Navigate into a board
```gherkin
Given the user is on the boards list page at "/"
When the user clicks on a board card (not on a rename/delete action or chevron toggle)
Then the URL changes to "/boards/{boardId}"
And the board page loads with the full board view (columns, cards, drag-and-drop)
```

### Scenario 2: Browser back button navigation
```gherkin
Given the user navigated from "/" to "/boards/{boardId}"
When the user clicks the browser back button
Then the URL changes to "/"
And the boards list page is displayed
```

### Scenario 3: Browser forward button navigation
```gherkin
Given the user navigated from "/" to "/boards/{boardId}" and then back to "/"
When the user clicks the browser forward button
Then the URL changes to "/boards/{boardId}"
And the board page is displayed with the correct data
```

### Scenario 4: Direct URL access to a board (bookmark)
```gherkin
Given a board with ID "abc123" exists in localStorage
When the user navigates directly to "/boards/abc123" via bookmark or URL bar
Then the board page loads correctly with all data for that board
```

### Scenario 5: Root URL loads boards list
```gherkin
Given the user opens the app at "/"
When the page loads
Then the boards list page is displayed
And the URL remains "/"
```

---

## Additional Context & Notes

- **Assumptions**: Using `BrowserRouter` from react-router-dom v6. The dev server (Vite) must be configured for SPA fallback so that direct URL access works.
- **Dependencies**: `react-router-dom@6` must be installed as a new dependency.
- **Out of scope**: Catch-all/404 route (covered in TICKET-P2-NAV-004), breadcrumb (covered in TICKET-P2-NAV-002).

---

## Notes for AI Agents

- Install `react-router-dom@6` via npm.
- Wrap the app in `BrowserRouter` at the top level (in `App.tsx` or `main.tsx`).
- Define routes:
  - `<Route path="/" element={<BoardsListPage />} />`
  - `<Route path="/boards/:boardId" element={<BoardPage />} />`
  - `<Route path="*" element={<NotFoundPage />} />`
- Create `pages/BoardsListPage.tsx` and `pages/BoardPage.tsx` as route-level components.
- `BoardPage` should read `boardId` from URL params via `useParams()` and load the board data from `kanban_board_{boardId}` and `kanban_cards_{boardId}`.
- Navigation from boards list to board should use `useNavigate()` or `<Link>` -- not `window.location`.
- Board card click handler must distinguish between card body clicks (navigate) and action button clicks (rename/delete/chevron). Use `event.stopPropagation()` on action buttons or structure click targets carefully.
- For Vite SPA fallback, ensure `vite.config.ts` has appropriate configuration for history API fallback in dev mode.
