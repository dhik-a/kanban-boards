import { Board } from "./components/Board";
import { Header } from "./components/Header";
import { SaveErrorBanner } from "./components/UI/SaveErrorBanner";
import { CorruptionWarningBanner } from "./components/UI/CorruptionWarningBanner";
import { ToastContainer } from "./components/UI/Toast";

/**
 * Root app shell.
 *
 * Layout:
 * - Sticky header (board title, search, filters, theme toggle).
 * - Inline banners for save errors and data corruption warnings.
 * - Board (columns + cards, DnD).
 * - Toast notification stack (bottom-right, fixed).
 *
 * Contexts assumed to be provided by main.tsx:
 * BoardProvider → FilterProvider → ThemeProvider → ToastProvider → App
 */
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header />
      <SaveErrorBanner />
      <CorruptionWarningBanner />
      <Board />
      <ToastContainer />
    </div>
  );
}
