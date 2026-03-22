/**
 * Ref-counted scroll lock.
 *
 * Multiple overlapping overlays (e.g. Modal + ConfirmDialog) can each call
 * lockScroll / unlockScroll independently. The body scroll is only re-enabled
 * once *all* callers have released their lock.
 */
let lockCount = 0;

export function lockScroll(): void {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
  }
}
