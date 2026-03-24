---
name: Phase 2 QA Implementation Review Findings
description: Bugs found and verified fixed during QA of Phase 2 implementation (tasks within cards, 5 fixed columns) -- all 5 bugs resolved, production approved 2026-03-24
type: project
---

Phase 2 QA code review completed 2026-03-23. Final verification completed 2026-03-24. **ALL BUGS FIXED -- PRODUCTION APPROVED.**

**Why:** These findings document the full QA cycle for Phase 2, from discovery through fix verification.

**How to apply:**
- BUG-01 (HIGH, FIXED): ESLint errors including ref-during-render in BoardProvider. Fixed with useState lazy initializer and eslint-disable comments for react-refresh/only-export-components on 4 context hooks.
- BUG-02 (HIGH, FIXED): Escape in task title edit bubbled to Modal and closed it. Fixed with e.stopPropagation() in TaskItem.handleTitleKeyDown and AddTaskForm.handleKeyDown.
- BUG-03 (MEDIUM, FIXED): saveState() rollback didn't snapshot prevTasks. Fixed by snapshotting all three keys (board, cards, tasks) before writes.
- BUG-04 (HIGH, FIXED): Schema version write failure caused silent data loss on next load. Fixed with console.warn -- non-fatal because data is already written.
- BUG-05 (MEDIUM, FIXED): Delete button hidden behind hover. Fixed by removing opacity/group-hover classes -- button always visible with subtle styling.
- Recurring pattern: event propagation between nested Modal/ConfirmDialog/inline-edit requires careful stopPropagation at each layer. All three layers now correctly isolated.
- Dead code: createDefaultBoardMeta() and createDefaultBoard() in defaults.ts remain unused (low priority).
