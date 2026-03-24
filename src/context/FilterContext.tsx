import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import type { Card } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriorityFilter = Card["priority"] | null;

interface FilterContextValue {
  searchQuery: string;
  priorityFilter: PriorityFilter;
  labelFilter: string | null;
  projectFilter: string | null;
  /** True when any filter or search is active (including project filter). */
  isFiltering: boolean;
  /** True when a hard filter (search/priority/label) is active. DnD and Add Card are disabled. */
  isHardFiltering: boolean;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: PriorityFilter) => void;
  setLabelFilter: (label: string | null) => void;
  setProjectFilter: (id: string | null) => void;
  clearFilters: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FilterContext = createContext<FilterContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryRaw] = useState("");
  const [priorityFilter, setPriorityFilterRaw] = useState<PriorityFilter>(null);
  const [labelFilter, setLabelFilterRaw] = useState<string | null>(null);
  const [projectFilter, setProjectFilterRaw] = useState<string | null>(null);

  // Setter wrappers are intentionally NOT wrapped in useCallback.
  // useCallback would give them stable references, but the setters are never
  // used as deps in any memoized callback or effect — so the stability buys
  // nothing here (CRIT-2). The useMemo below is keyed solely on state values.
  const setSearchQuery = (query: string) => setSearchQueryRaw(query);
  const setPriorityFilter = (priority: PriorityFilter) => setPriorityFilterRaw(priority);
  const setLabelFilter = (label: string | null) => setLabelFilterRaw(label);
  const setProjectFilter = (id: string | null) => setProjectFilterRaw(id);
  const clearFilters = () => {
    setSearchQueryRaw("");
    setPriorityFilterRaw(null);
    setLabelFilterRaw(null);
    setProjectFilterRaw(null);
  };

  // Value object is memoised on state values only. isFiltering is derived
  // from those same values and must NOT be in the dep array — it is not a
  // separate piece of state, so including it caused a circular dependency.
  // Setter function references are recreated each render but that is
  // acceptable — consumers that need stable setters can wrap them locally
  // with useCallback if required.
  const value = useMemo<FilterContextValue>(
    () => {
      const isHardFiltering =
        searchQuery.trim() !== "" || priorityFilter !== null || labelFilter !== null;
      return {
        searchQuery,
        priorityFilter,
        labelFilter,
        projectFilter,
        isFiltering: isHardFiltering || projectFilter !== null,
        isHardFiltering,
        setSearchQuery,
        setPriorityFilter,
        setLabelFilter,
        setProjectFilter,
        clearFilters,
      };
    },
    [searchQuery, priorityFilter, labelFilter, projectFilter]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

// ─── Consumer hook ─────────────────────────────────────────────────────────────

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (ctx === null) {
    throw new Error("useFilterContext must be used inside <FilterProvider>");
  }
  return ctx;
}
