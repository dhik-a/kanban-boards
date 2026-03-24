import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves the initial theme.
 * Fallback chain: stored preference → OS preference → "light".
 *
 * Called once at module evaluation time (safe: localStorage and matchMedia
 * are available synchronously in a browser context).
 */
function getInitialTheme(): Theme {
  const stored = localStorage.getItem("kanban_theme");
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>("kanban_theme", getInitialTheme());

  // Apply the `dark` class to <html> whenever theme changes.
  // Tailwind v4 reads dark: variants from the `dark` class on the root element.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, [setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Consumer hook ─────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useThemeContext must be used inside <ThemeProvider>");
  }
  return ctx;
}
