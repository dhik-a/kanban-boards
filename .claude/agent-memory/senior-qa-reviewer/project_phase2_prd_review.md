---
name: Phase 2 PRD Review Findings
description: Critical gaps and issues found during QA review of Phase 2 PRD (task-based kanban pivot from multi-board design)
type: project
---

Phase 2 PRD review completed 2026-03-23. Major pivot from multi-board to single-board with nested tasks, 5 fixed columns, task-status filtering.

**Why:** PRD has several critical data integrity and migration gaps that must be resolved before coding starts.

**How to apply:**
- Migration: Column name matching is too strict (only exact case-insensitive match). saveState() atomicity needs redesign for 3 keys. loadState() needs tasks-awareness. Schema version write timing creates re-migration risk.
- Data model: UPDATE_TASK payload missing cardId. isFixed field not in Phase 1 Column type. Dropped tasks inflating progress denominator is a design flaw.
- UX: Task description editing flow is ambiguous (expand vs icon). No visual affordance for disabled DnD during filtering. Unchecked-checkboxes-means-show-all needs labeling.
- Dead code: createDefaultBoardMeta() and multi-board artifacts need cleanup.
- Board title factory functions are inconsistent ("My Board" vs "My Kanban Board").
