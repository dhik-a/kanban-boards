---
name: Code Review Standards & Tech Debt Process
description: Project coding standards, testing expectations, and tech debt ticket tracking process
type: feedback
---

## Tech Debt Tracking Process (Phase 2)

**When to Create:** Identify tech debt during code review that doesn't block the current ticket but should be tracked for future work.

**Naming Convention:** `TECH-DEBT-P2-[number]-[description].md` in `docs/tickets/phase-2/`

**Ticket Format:**
- Title: Clear one-line description
- Priority: P2 (important gaps) or P3 (nice-to-haves)
- Related Ticket: Reference which Phase 2 ticket identified the debt
- Description: What needs to be done and why
- Estimated Effort: Small / Medium / Large

**What to Track:**
- Missing test coverage (esp. critical paths, edge cases)
- Documentation gaps (inline comments, ADRs)
- Performance optimizations (memoization, caching)
- Refactoring opportunities (code duplication, utility extraction)
- Accessibility improvements
- Browser compatibility testing gaps

**What NOT to Track:**
- Blocking issues (fix in current ticket)
- Style/formatting (fix in current ticket)
- Impossible scenarios (ignore)

## Code Review Methodology

Review across 7 dimensions: **Correctness, Security, Performance, Architecture, Maintainability, Error Handling, Standards**.

- Be specific: Explain *why* and *how*, not just "could be better"
- Prioritize ruthlessly: Label severity (critical, major, minor)
- Be constructive: Review code, not engineer
- Highlight what's good: Reinforce strong patterns

## Testing Standards

- Component tests: Single component behavior in isolation
- Integration tests: Multi-component flows, especially data sync (card counts, title sync)
- Edge cases must be tested: Empty states, boundary values, concurrent updates
- Test coverage should be prioritized for critical paths and failure modes

## Project Stack

- React 18.x + TypeScript
- Vite (build)
- localStorage (persistence)
- Reducer pattern (state management)
- Custom Context API (no Redux)
- Phase 1 used: ConfirmDialog (for confirmations), existing UI patterns

## Accessibility & Dark Mode

- Components should support dark mode (Phase 2 adds theme toggle)
- Focus management required for modals, route transitions
- Keyboard navigation for interactive elements
- ARIA labels where appropriate
