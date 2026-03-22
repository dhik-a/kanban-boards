import { useState, useEffect } from "react";

/**
 * useLocalStorage — low-level hook that syncs a piece of state to localStorage.
 *
 * Separated from useDebouncedSave so that simple string preferences (e.g. theme)
 * can use it directly without the debounce overhead.
 *
 * RESERVED FOR SIMPLE SCALAR PREFERENCES ONLY (e.g. theme toggle, sidebar
 * collapsed state). Do not use this hook for AppState persistence — that
 * responsibility belongs to useDebouncedSave + the storage utility, which
 * provide rollback-safe atomic writes, debouncing, and user-visible error
 * handling across the two kanban_board / kanban_cards keys (MAJOR #8).
 *
 * Expected first consumer: theme preference toggle (future ticket).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Silently ignore — callers that need error handling should use saveState() directly.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
