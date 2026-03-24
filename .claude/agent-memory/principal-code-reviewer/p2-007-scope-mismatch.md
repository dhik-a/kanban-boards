---
name: P2-007 Scope Mismatch & Rejection
description: Per-card modal filter implemented instead of board-level FilterContext integration; ticket redesign required before merge
type: project
---

## Critical Finding

TICKET-P2-007 implementation (commit daa21dd) provides **per-card task status filter in CardDetail modal** instead of **board-level FilterContext-integrated filter** specified by acceptance criteria.

## What Was Implemented

- TaskSection.tsx: Single-select toggle buttons (5 statuses)
- TaskList.tsx: Client-side filtering of tasks by status
- Ephemeral local state: resets when modal closes
- Does NOT affect board-level DnD or FilterContext
- Does NOT implement multi-select (AC requires this)
- Does NOT filter board-level card visibility (AC-7, AC-9, AC-10)
- Does NOT integrate with search+priority filters (AC-6)

## What Was Required (Per Ticket AC)

- AC-1: Extend FilterContext with `taskStatusFilter: Set<TaskStatus>` + `toggleTaskStatusFilter()`
- AC-2 through AC-4: 5 checkboxes (not toggle buttons), multi-select (not single-select)
- AC-5: OR logic across multiple selected statuses
- AC-6: AND logic combining status filter with search query
- AC-7: Hide empty-task cards when filter active
- AC-8: clearFilters() resets status filter with other filters
- AC-9: Disable board-level DnD when status filter active
- AC-10: Show "No matching cards" per column

## Verdict

🚫 **REJECT** — Complete scope mismatch. Implementation solves a useful side feature (per-card filtering) but not the actual ticket. Requires full redesign to meet AC.

## Impact on P2-008

P2-008 depends on working FilterContext integration. This ticket blocks P2-008 until corrected.

## Code Quality Notes

- ✅ Good: TypeScript-safe, accessible (ARIA), dark mode support, clean code
- ❌ Bad: Misses 90% of actual requirements
- This is not a "polish it up" review — it's a "stop, redesign, then reimplement" verdict

