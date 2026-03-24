---
name: Phase 2 QA Implementation Review Findings
description: Bugs and issues found during code-level QA of Phase 2 implementation (tasks within cards, 5 fixed columns)
type: project
---

Phase 2 QA code review completed 2026-03-23. Conditional pass -- 3 HIGH bugs block release.

**Why:** These findings capture issues that code review found but will need manual testing confirmation.

**How to apply:**
- BUG-02 (HIGH): Escape in task title edit bubbles up and closes the parent modal. TaskItem.handleTitleKeyDown and AddTaskForm.handleKeyDown need e.stopPropagation() on Escape.
- BUG-04 (HIGH): Schema version write failure in saveState() causes silent data loss on next load. Schema version should be written first or its failure treated as a save error.
- BUG-01 (HIGH): ESLint reports 10 errors including ref-during-render in BoardProvider and setState-in-effect in CardDetail and Header. BoardProvider should use useState lazy initializer instead of useRef.
- BUG-03 (MEDIUM): saveState() rollback doesn't snapshot prevTasks -- partial failure can leave inconsistent localStorage.
- Recurring pattern: event propagation between nested Modal/ConfirmDialog/inline-edit requires careful stopPropagation. ConfirmDialog already handles this correctly for its Escape handler but TaskItem does not.
- Dead code: createDefaultBoardMeta() and createDefaultBoard() in defaults.ts are unused.
