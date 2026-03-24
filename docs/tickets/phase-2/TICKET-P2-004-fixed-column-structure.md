# TICKET-P2-004: Fixed Column Structure

**Priority:** P0
**PRD References:** Section 3.1-3.2 (Fixed Columns), Section 7.3 (Modified Components), Section 9.7 (Scenarios)
**Area:** Board Layout & Column Management
**Depends On:** TICKET-P2-001, TICKET-P2-003

## Summary

Lock the board to exactly 5 fixed columns, remove column creation/deletion/reordering UI, remove column color-picker and title-edit functionality, and make column headers read-only. Ensure the board always renders columns in the fixed order regardless of any stored state.

---

## Acceptance Criteria

### AC-1: Board Always Renders 5 Fixed Columns
```gherkin
Given the board is loaded (any state)
When Board.tsx renders
Then exactly 5 columns are rendered in this order:
  1. To Do
  2. In Progress
  3. Done
  4. Dropped
  5. Blocked
And the column order cannot be changed by any mutation or UI action
```

### AC-2: Add Column Button Removed
```gherkin
Given the board view is displayed
When the user looks for an "Add Column" button
Then no such button exists
And the UI does not provide any way to create new columns
```

### AC-3: Column Title Editing Disabled
```gherkin
Given a column header is displayed
When the user clicks on the column title
Then nothing happens (no edit mode, no modal, no focus)
And the title remains read-only
And no visual feedback suggests the title is editable
```

### AC-4: Column Delete Menu Removed
```gherkin
Given a column is displayed
When the user attempts to right-click or access a context menu on the column
Then no delete option is visible
And columns cannot be deleted via any UI action
```

### AC-5: Column Color Picker Removed
```gherkin
Given a column is displayed
When the user looks for a color-picker or color-change control
Then no such control exists
And column colors are fixed per column and not user-configurable
```

### AC-6: Column Reorder Disabled
```gherkin
Given the board shows 5 columns
When the user attempts to drag a column header to reorder
Then the drag does not initiate
And columns remain in fixed order
And no column reorder feature is visible
```

### AC-7: Column Header Styling Updated
```gherkin
Given column headers are now read-only and fixed
When a column header is rendered
Then the header displays:
  - Column title (non-editable text)
  - Card count badge (existing feature, unchanged)
And the header does not display:
  - Edit icon
  - Color picker
  - Delete button
  - Context menu
And the header styling suggests it is non-interactive (no hover effects that imply editability)
```

### AC-8: Column Component Refactored
```gherkin
Given Column.tsx previously supported editing and deletion
When Column.tsx is refactored for Phase 2
Then all edit/delete handlers are removed
And all conditional rendering of edit/delete UI is removed
And ColumnHeader.tsx becomes a simpler, read-only display component
```

### AC-9: No TypeScript Errors
```gherkin
Given all column-related changes are complete
When `npm run build` is executed
Then the build succeeds with zero TypeScript errors
```

---

## Implementation Notes

- The 5-column order is structural and non-negotiable. Do not persist or calculate it — hard-code the order in Board.tsx.
- Column data in AppState can be updated (e.g., cardIds), but the column structure itself (id, title, color, isFixed) should be treated as immutable.
- ColumnHeader should be a pure read-only component — remove all edit/delete logic.
- Card drag-and-drop between columns should still work normally (that's handled in Board/Card drag logic).
- The AddColumn component (if it exists) may be deleted or left unused.

---

## Testing

- Visual test: Board renders exactly 5 columns in correct order
- Interaction test: Column title is not editable (clicking does nothing)
- Interaction test: No context menu on column
- Interaction test: No column drag-to-reorder
- Unit test: Board component hard-codes 5-column structure
- Regression test: Card DnD still works between columns

---

## Files Modified

- `src/components/Board/Board.tsx` — Remove AddColumn button, hard-code 5-column rendering
- `src/components/Board/ColumnHeader.tsx` — Remove edit/delete/color-picker UI
- `src/components/Board/Column.tsx` — Remove edit/delete handlers
- `src/components/Board/AddColumn.tsx` — Delete or leave unused (no longer called)

## Files Created

None

---

## Blockers

- Depends on TICKET-P2-001 (Column interface with isFixed)
- Depends on TICKET-P2-003 (default state creates 5 columns)
