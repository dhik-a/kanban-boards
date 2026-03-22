import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "info" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Internal entry extends Toast with a timeoutId so the auto-dismiss timer can
 * be cancelled when a toast is manually dismissed or the provider unmounts
 * (CRIT-1: prevent setTimeout memory leaks).
 */
interface ToastEntry extends Toast {
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  // Cancel the auto-dismiss timer when a toast is removed so no stale
  // setState call fires after the toast is already gone (CRIT-1).
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const entry = prev.find((t) => t.id === id);
      if (entry) clearTimeout(entry.timeoutId);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = uuidv4();
      const timeoutId = setTimeout(() => removeToast(id), TOAST_DURATION_MS);
      setToasts((prev) => [{ id, message, type, timeoutId }, ...prev]);
    },
    [removeToast]
  );

  // Cancel all pending timers when the provider unmounts (CRIT-1).
  useEffect(() => {
    return () => {
      setToasts((prev) => {
        prev.forEach((t) => clearTimeout(t.timeoutId));
        return [];
      });
    };
  }, []);

  // Expose Toast (without timeoutId) to consumers — timeoutId is an
  // internal implementation detail that should not leak into context.
  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// ─── Consumer hook ─────────────────────────────────────────────────────────────

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToastContext must be used inside <ToastProvider>");
  }
  return ctx;
}
