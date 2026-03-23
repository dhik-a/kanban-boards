/**
 * Shown inside TaskSection when a card has no tasks yet.
 * AC-9: displays the prescribed empty-state message.
 */
export function TaskEmptyState() {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 italic py-1">
      No tasks yet. Add one to break this card into steps.
    </p>
  );
}
