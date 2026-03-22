/**
 * Deterministic label color utilities (TICKET-006).
 *
 * A hash of the label text string is mapped to one of 10 fixed color classes.
 * The same label text always produces the same color regardless of which card
 * it appears on or which session the user is in.
 */

export const LABEL_COLORS = [
  "bg-red-200 text-red-800",
  "bg-orange-200 text-orange-800",
  "bg-yellow-200 text-yellow-800",
  "bg-green-200 text-green-800",
  "bg-teal-200 text-teal-800",
  "bg-blue-200 text-blue-800",
  "bg-indigo-200 text-indigo-800",
  "bg-purple-200 text-purple-800",
  "bg-pink-200 text-pink-800",
  "bg-slate-200 text-slate-800",
] as const;

/**
 * Maps a label string to an index in LABEL_COLORS via a simple polynomial hash.
 *
 * The label is normalised to lowercase + trimmed before hashing so that
 * "Bug" and "bug" — which are treated as duplicates in the label dedup logic —
 * always resolve to the same color (QA-2).
 */
export function hashLabel(label: string): number {
  const normalized = label.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % LABEL_COLORS.length;
}

/** Returns the Tailwind class string for a given label. */
export function getLabelColor(label: string): string {
  return LABEL_COLORS[hashLabel(label)];
}
