# TICKET-001: Board Initialization & Persistence

**Priority:** P0
**PRD References:** B-001, B-003, B-004, B-005
**Area:** Board Management

## Summary

The application must display a board on load, auto-save all changes, and restore state on revisit. Persistence must handle rapid changes efficiently, storage failures gracefully, corrupted data safely, and multi-tab scenarios predictably.

---

## Scenarios

### Scenario 1: First-time user sees a default board

```gherkin
Given a user opens the app for the first time
And no saved board data exists
When the board loads
Then the user sees a board titled "My Kanban Board"
And the board contains three columns: "To Do", "In Progress", and "Done"
And all columns are empty
```

### Scenario 2: Board persists after page refresh

```gherkin
Given a user has an existing board with cards and columns
When the user refreshes the page
Then the board loads with all columns intact
And all cards are present in their last known positions
And the board title is unchanged
```

### Scenario 3: Changes are auto-saved without user action

```gherkin
Given a user has the board open
When the user adds a new card to a column
Then the change is saved automatically
And no manual save button is required
```

### Scenario 4: State is restored after closing and reopening the browser

```gherkin
Given a user has made changes to the board
When the user closes the browser tab
And the user reopens the app in a new tab
Then the board is restored exactly as it was before closing
```

### Scenario 5: Rapid successive changes are debounced before saving

```gherkin
Given a user has the board open
When the user makes multiple changes in rapid succession (e.g., adding several cards within one second)
Then the app does not save after every individual change
And the app waits until 300 milliseconds have passed since the last change before saving
And all changes made during that window are included in the save
```

### Scenario 6: Storage write failure is handled gracefully

```gherkin
Given a user has the board open
And the browser storage is full or unavailable
When the user makes a change that triggers a save
Then the app does not crash or lose in-memory state
And an inline error banner is displayed informing the user that changes could not be saved
And the user can dismiss the error banner
```

> **Note:** The error display must not depend on the P2 toast notification system. Use a simpler inline error banner or browser alert as a fallback.

### Scenario 7: Corrupted saved data is handled on load

```gherkin
Given saved board data exists but is corrupted or unreadable (e.g., malformed data)
When the user opens the app
Then the app initializes with a fresh default board (same as first-time user)
And a dismissible warning message is displayed informing the user that saved data could not be loaded
And the user can continue using the app normally
```

### Scenario 8: Concurrent tabs use last-write-wins semantics

```gherkin
Given the user has the app open in two browser tabs (Tab A and Tab B)
When the user makes a change in Tab A
And then makes a different change in Tab B
Then the most recently saved change (Tab B) is what persists in storage
And no cross-tab synchronization is provided
And neither tab crashes or shows an error due to the concurrent usage
```

> **Note:** Cross-tab sync is explicitly out of scope for Phase 1. The last save wins. Users should be aware that using multiple tabs simultaneously may cause data from one tab to overwrite the other.

---

## AI Agent Notes

- The debounce interval for persistence is exactly 300ms. All state changes within that window must be batched into a single write operation.
- On storage write failure: catch the error, preserve in-memory state, and display an inline error banner (not a toast). The banner must be dismissible.
- On load: wrap the data deserialization in a try/catch. If parsing fails, discard the corrupted data, initialize with the default board, and show a dismissible warning.
- Multi-tab: no `storage` event listener or `BroadcastChannel` is needed. Simply write to storage; last write wins.
