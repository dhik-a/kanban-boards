# TICKET-012: General Keyboard Accessibility

**Priority:** P2
**PRD References:** D-005 (partial), U-005
**Area:** Accessibility, UI / UX

## Summary

The application must be navigable and operable using only the keyboard. This includes logical tab order through board elements, keyboard shortcuts for common actions, and proper focus management when modals and dialogs open or close.

---

## Scenarios

### Scenario 1: User can tab through columns and cards

```gherkin
Given the board is displayed with columns and cards
When the user presses Tab repeatedly
Then focus moves through the board elements in a logical order: board title, search bar, filter controls, theme toggle, then through each column header, its cards, and its add-card button, in left-to-right (or top-to-bottom on mobile) order
```

### Scenario 2: User opens card detail view with keyboard

```gherkin
Given a card is focused via keyboard navigation
When the user presses Enter
Then the card detail modal opens
And focus moves into the modal
```

### Scenario 3: Focus moves into modal when it opens

```gherkin
Given the user triggers a modal (card detail view or confirmation dialog)
When the modal opens
Then focus is moved to the first focusable element inside the modal
And the user does not need to tab through background elements to reach the modal content
```

### Scenario 4: Focus is trapped within an open modal

```gherkin
Given a modal or dialog is open
When the user presses Tab or Shift+Tab
Then focus cycles through only the focusable elements inside the modal
And focus does not escape to elements behind the modal
```

### Scenario 5: Focus returns to trigger element when modal closes

```gherkin
Given a modal was opened by clicking or pressing Enter on a specific element (e.g., a card)
When the modal is closed (via Escape, close button, or click outside)
Then focus returns to the element that originally triggered the modal
```

### Scenario 6: Escape key closes the topmost modal or dialog

```gherkin
Given a modal or dialog is open
When the user presses Escape
Then the topmost modal or dialog is closed
And if a confirmation dialog was open over the card detail modal, only the confirmation dialog closes, and the card detail modal remains open
```

### Scenario 7: Confirmation dialogs are keyboard operable

```gherkin
Given a confirmation dialog is displayed (e.g., delete card or delete column)
When the user presses Tab
Then focus moves between the confirm and cancel buttons
And the user can press Enter or Space to activate the focused button
```

---

## Notes

- Keyboard-accessible drag-and-drop (D-005) is covered in TICKET-010, not here. This ticket focuses on general keyboard navigation, focus management, and modal accessibility.
- All interactive elements (buttons, inputs, cards, toggles) must be reachable via Tab and activatable via Enter or Space.

---

## AI Agent Notes

- Tab order should follow visual reading order: left-to-right, top-to-bottom. On mobile (vertical layout), top-to-bottom through all columns.
- Focus trap in modals: when a modal is open, Tab/Shift+Tab must cycle within the modal only. Implement a focus trap.
- Focus restoration: when a modal closes, return focus to the element that triggered the modal opening. Store a reference to the trigger element when opening.
- Escape key behavior: closes the topmost overlay. If a confirmation dialog sits on top of a card detail modal, Escape closes only the confirmation dialog first.
- All custom interactive elements (e.g., card items that act as buttons) must have appropriate ARIA roles and be included in the tab order.
