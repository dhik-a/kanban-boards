import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BoardProvider } from "./context/BoardContext.tsx";
import { FilterProvider } from "./context/FilterContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";

/**
 * Provider order (outer → inner):
 *   BoardProvider   — app state + persistence
 *   FilterProvider  — search/filter state (reads board cards for label extraction)
 *   ThemeProvider   — light/dark mode (reads/writes kanban_theme)
 *   ToastProvider   — notification stack
 *   App             — renders Header + Board + banners + toasts
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BoardProvider>
      <FilterProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </FilterProvider>
    </BoardProvider>
  </StrictMode>
);
