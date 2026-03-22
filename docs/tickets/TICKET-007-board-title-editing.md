# TICKET-007: Board Title Editing

**Priority:** P1
**PRD References:** B-002
**Area:** Board Management

## Summary

Users can edit the board title inline by clicking on it. The title has a maximum length of 100 characters.

---

## Scenarios

### Scenario 1: User clicks the board title to edit it

```gherkin
Given the board is displayed with a title
When the user clicks on the board title
Then the title becomes an editable text field
And the current title is pre-filled in the field
```

### Scenario 2: User confirms the new board title

```gherkin
Given the board title is in edit mode
When the user changes the text and confirms (presses Enter or clicks away)
Then the board title is updated to the new text
And the edit field is dismissed
```

### Scenario 3: User cancels board title editing

```gherkin
Given the board title is in edit mode
When the user presses Escape
Then the board title reverts to its original value
And the edit field is dismissed
```

### Scenario 4: Board title cannot be empty

```gherkin
Given the board title is in edit mode
When the user clears the title and attempts to confirm
Then the title is not updated
And the board title reverts to its previous value
```

### Scenario 5: Board title cannot exceed maximum length

```gherkin
Given the board title is in edit mode
When the user types more than 100 characters
Then input beyond 100 characters is not accepted
```

---

## AI Agent Notes

- Board title max length is 100 characters. Enforce at the input level (prevent typing beyond 100 chars).
- Empty or whitespace-only titles must revert to the previous value, same behavior as column title editing.
