# TICKET-P2-NAV-005: Board Card Click Navigation

**Phase**: 2 -- Multi-Board
**Feature Area**: NAV / BL (Navigation + Board List)
**Priority**: P0
**Dependencies**: P2-NAV-001, P2-BOARD-001
**Related Scenarios**: 12
**Related Feature IDs**: BL-005, BL-008

---

## Problem Statement

Board cards on the boards list page serve dual purposes: they display board information AND act as navigation targets. However, board cards also contain interactive elements (rename button, delete button, chevron toggle) that should NOT trigger navigation. The click behavior must be carefully managed to avoid unintended navigation when users interact with action buttons.

---

## Goal & Success Metrics

- **Goal**: Clicking a board card navigates to that board, but clicking action buttons (rename, delete, chevron) does not trigger navigation.
- **Success looks like**: Users can reliably navigate into boards by clicking the card, and reliably use action buttons without accidentally navigating.

---

## User Story

As a Kanban user on the boards list,
I want to click a board card to open it,
So that I can quickly access the board I want to work on.

---

## Acceptance Criteria

### Scenario 1: Click board card body to navigate
```gherkin
Given the user is on the boards list page
When the user clicks on the body area of a board card
Then the URL changes to "/boards/{boardId}"
And the board page loads with the full board view
```

### Scenario 2: Click rename button does not navigate
```gherkin
Given the user is on the boards list page
When the user clicks the rename action button on a board card
Then inline-edit mode activates for the board title
And the user does NOT navigate away from the boards list
```

### Scenario 3: Click delete button does not navigate
```gherkin
Given the user is on the boards list page
When the user clicks the delete action button on a board card
Then the confirmation dialog appears
And the user does NOT navigate away from the boards list
```

### Scenario 4: Click chevron toggle does not navigate
```gherkin
Given the user is on the boards list page
When the user clicks the chevron toggle on a board card
Then the card expands or collapses
And the user does NOT navigate away from the boards list
```

---

## Additional Context & Notes

- **Assumptions**: Action buttons use `event.stopPropagation()` to prevent the click event from bubbling up to the card's navigation handler.
- **Dependencies**: TICKET-P2-BOARDS-001 (card rendering), TICKET-P2-NAV-001 (routing).
- **Out of scope**: Keyboard navigation (Tab + Enter) to open boards.

---

## Notes for AI Agents

- The board card component should have an `onClick` handler on the card container that calls `navigate(`/boards/${board.id}`)`.
- All interactive elements within the card (rename button, delete button, chevron toggle) must call `event.stopPropagation()` in their click handlers to prevent the card-level navigation from firing.
- Alternatively, use `<Link>` as the card wrapper and use `event.preventDefault()` + `event.stopPropagation()` on the action buttons.
- The clickable area should be the card body itself. Make it visually clear that the card is clickable (cursor: pointer, hover effect).
- Use react-router-dom's `useNavigate()` hook or `<Link>` component for navigation -- never `window.location`.
