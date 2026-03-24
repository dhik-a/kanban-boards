# TICKET-009: Theme Toggle (Light / Dark Mode)

**Priority:** P1
**PRD References:** U-002
**Area:** UI / UX

## Summary

Users can switch between light and dark themes. The selected theme persists across sessions under a dedicated storage key.

---

## Scenarios

### Scenario 1: User toggles to dark mode

```gherkin
Given the app is displayed in light mode
When the user clicks the theme toggle
Then the app switches to dark mode
And all visible elements reflect the dark theme
```

### Scenario 2: User toggles back to light mode

```gherkin
Given the app is displayed in dark mode
When the user clicks the theme toggle
Then the app switches to light mode
And all visible elements reflect the light theme
```

### Scenario 3: Theme preference persists after page refresh

```gherkin
Given the user has selected dark mode
When the user refreshes the page
Then the app loads in dark mode
```

### Scenario 4: App respects system theme preference on first load

```gherkin
Given a first-time user opens the app
And no theme preference has been saved
When the board loads
Then the app uses the operating system's current theme preference (light or dark)
```

---

## Notes

- The theme preference is stored under the key `kanban_theme`. This key is separate from the board data keys (`kanban_board`, `kanban_cards`) and should be read/written independently.
- Valid stored values are `"light"` and `"dark"`. If the stored value is missing or invalid, fall back to the operating system preference.

---

## AI Agent Notes

- Storage key for theme is exactly `kanban_theme`. Do not store theme preference inside the board data object.
- Read/write theme preference independently from board persistence (no debounce needed; theme changes are infrequent and should persist immediately).
- Fallback chain: stored preference -> OS preference -> light mode as ultimate default.
