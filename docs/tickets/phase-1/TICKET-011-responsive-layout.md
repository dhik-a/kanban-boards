# TICKET-011: Responsive Layout

**Priority:** P0
**PRD References:** U-001
**Area:** UI / UX

## Summary

The board must adapt to different screen sizes. On desktop viewports, columns are displayed in a horizontal layout with horizontal scrolling when columns exceed the viewport width. On mobile viewports, columns stack vertically for ease of use on narrow screens.

---

## Scenarios

### Scenario 1: Desktop layout displays columns horizontally with scroll

```gherkin
Given the user is viewing the board on a desktop-width screen (768px or wider)
And the board has more columns than can fit in the viewport
When the user views the board
Then the columns are arranged side by side in a horizontal row
And the user can scroll horizontally to access columns that extend beyond the viewport
```

### Scenario 2: Mobile layout stacks columns vertically

```gherkin
Given the user is viewing the board on a mobile-width screen (narrower than 768px)
When the user views the board
Then the columns are stacked vertically, one below the other
And each column spans the full width of the screen
And the user can scroll vertically to access all columns
```

### Scenario 3: Layout transitions smoothly on viewport resize

```gherkin
Given the user is viewing the board on a desktop-width screen
When the user resizes the browser window below the mobile breakpoint (768px)
Then the layout transitions from horizontal to vertical column arrangement
And no content is lost or hidden during the transition
```

### Scenario 4: Cards remain readable and interactive at all screen sizes

```gherkin
Given the user is viewing the board on any screen size
When the user views a card
Then the card title, priority indicator, and labels are fully visible and legible
And the user can click the card to open the detail view
And the "+ Add Card" button remains accessible
```

### Scenario 5: Board header adapts to mobile layout

```gherkin
Given the user is viewing the board on a mobile-width screen
When the user views the board header
Then the board title, search bar, filter controls, and theme toggle are accessible
And the header elements wrap or collapse gracefully to fit the narrow width
```

### Scenario 6: Horizontal scroll does not interfere with card drag on desktop

```gherkin
Given the user is viewing the board on a desktop-width screen with horizontal scroll
When the user drags a card toward the edge of the viewport
Then the board scrolls horizontally to reveal adjacent columns
And the user can drop the card into a column that was initially off-screen
```

---

## AI Agent Notes

- Breakpoint for mobile/desktop switch: 768px. Below 768px = vertical stack. 768px and above = horizontal layout.
- Desktop horizontal scroll: the board container should scroll horizontally, not the page. Columns should not shrink below a minimum readable width (recommend ~280px minimum column width).
- Mobile vertical stack: each column takes full available width. Vertical scroll is the browser's native scroll.
- Drag-and-drop on desktop with horizontal scroll: the board should auto-scroll when the user drags near the edge of the viewport. This is essential for usability when columns extend beyond the screen.
- The header area (title, search, filters, theme toggle) must remain usable on mobile. Consider wrapping elements or using a collapsible/hamburger pattern for filters on very narrow screens.
