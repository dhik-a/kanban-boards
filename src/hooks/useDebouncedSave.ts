import { useEffect, useRef } from "react";
import type { AppState } from "../types";
import { saveState } from "../utils/storage";

/**
 * useDebouncedSave — watches AppState and persists it to localStorage
 * with a 300ms debounce (PRD section 6.2, Ticket Scenario 5).
 *
 * - All state changes within a 300ms window are collapsed into one write.
 * - On write failure, calls onError with a human-readable message.
 * - On write success, calls onError(null) to clear any existing banner.
 * - Does NOT run on the first render (no point saving the just-loaded state).
 * - Registers a beforeunload listener to flush any pending save synchronously
 *   if the user closes the tab within the debounce window (HIGH #4).
 */
export function useDebouncedSave(
  state: AppState,
  onError: (message: string | null) => void,
  debounceMs = 300
): void {
  const isFirstRender = useRef(true);

  // Keep a ref to the latest onError so the debounced callback always calls
  // the current version without onError needing to be a useEffect dependency.
  // This eliminates the stale-closure risk that was previously papered over
  // with an eslint-disable comment (CRITICAL #2).
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Debounced persistence — re-runs whenever state or debounceMs changes.
  useEffect(() => {
    // Skip the initial render — we've just loaded/initialised state, not changed it.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const error = saveState(state);
      onErrorRef.current(error); // null on success, message string on failure
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [state, debounceMs]);

  // Synchronous beforeunload flush — ensures in-flight changes are persisted
  // even if the user closes the tab within the debounce window (HIGH #4).
  // Re-registers whenever state changes so the flush closure always captures
  // the latest state reference.
  useEffect(() => {
    const flush = () => {
      if (!isFirstRender.current) {
        saveState(state);
      }
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [state]);
}
