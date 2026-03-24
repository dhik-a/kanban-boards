---
name: P2-006 Review Findings — Dark Mode Color Conventions
description: Identified inconsistent dark mode text color in TaskSummary; documented project convention for muted text in dark mode
type: reference
---

## Dark Mode Color Pattern in Project

**Convention:** Muted secondary text uses `text-slate-400 dark:text-slate-500`

**Evidence Across Components:**
- `AddCard.tsx` line 43: Muted help text follows this pattern
- `CardDetail.tsx`: Secondary text labels use this pattern
- `TaskSummary.tsx` line 51: ❌ INCORRECTLY uses `dark:text-slate-400` (same as light mode)

**Why This Matters:**
- Light mode backgrounds are light (white/slate-100), so slate-400 text is readable
- Dark mode backgrounds are dark (slate-700+), so slate-400 text creates poor contrast
- Slate-500 is darker/dimmer, providing better contrast in dark mode

## Implementation Detail

When reviewing any component with muted/secondary text in future tickets:
1. Check light mode: should use `text-slate-400`
2. Check dark mode: should use `dark:text-slate-500` (NOT `dark:text-slate-400`)
3. This applies to help text, labels, captions, and other non-primary text

## Related to P2-006

The TaskSummary component had this bug, but it's fixable in ~2 minutes. The bug does not impact functionality, only user experience in dark mode (text appears too bright).
