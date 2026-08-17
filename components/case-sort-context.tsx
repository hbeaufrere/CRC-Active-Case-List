'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import type { SortColumn, SortDirection } from '@/types';

type SortState = { column: SortColumn | null; direction: SortDirection };

type CaseSortValue = SortState & { toggleSort: (column: SortColumn) => void };

const STORAGE_KEY = 'crc:case-sort';
const DEFAULT_SORT: SortState = { column: null, direction: 'asc' };

const SORTABLE_COLUMNS: SortColumn[] = [
  'caseNumber',
  'wrmdCaseNumber',
  'species',
  'daysInCare',
  'urgency',
  'followUp',
  'updated',
];

/**
 * The chosen sort lives in sessionStorage rather than in component state so it
 * survives opening a case and coming back to the list — the dashboard unmounts
 * on that navigation, which used to reset the order.
 *
 * sessionStorage is deliberate: it is scoped to a single browser tab, so one
 * person's sort never follows anyone else, and the browser clears it when the
 * tab closes, so leaving the app returns everyone to the default order.
 *
 * Module state is the live source of truth; storage is only read to seed it on
 * a fresh page load. That keeps getSnapshot returning a stable reference (a
 * fresh object each call would loop React) and keeps sorting working even where
 * storage is unavailable, such as Safari private mode.
 */
let currentSort: SortState | null = null;
const listeners = new Set<() => void>();

function parseStoredSort(raw: string | null): SortState {
  if (!raw) return DEFAULT_SORT;
  try {
    const parsed = JSON.parse(raw) as Partial<SortState>;
    // Anything unrecognised (an old key, a hand-edited value) falls back to the
    // default rather than sorting by a column that no longer exists.
    if (!parsed.column || !SORTABLE_COLUMNS.includes(parsed.column)) return DEFAULT_SORT;
    return { column: parsed.column, direction: parsed.direction === 'desc' ? 'desc' : 'asc' };
  } catch {
    return DEFAULT_SORT;
  }
}

function getSnapshot(): SortState {
  if (currentSort === null) {
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    currentSort = parseStoredSort(raw);
  }
  return currentSort;
}

function getServerSnapshot(): SortState {
  return DEFAULT_SORT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeSort(next: SortState): void {
  currentSort = next;
  try {
    if (next.column) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable — the sort still applies for as long as the page lives.
  }
  listeners.forEach(listener => listener());
}

const CaseSortContext = createContext<CaseSortValue>({
  ...DEFAULT_SORT,
  toggleSort: () => {},
});

/**
 * Holds the table's column sort so that everything looking at the case list —
 * the table itself and the PDF export — orders rows identically. Without this
 * the exported sheet came out in the server's default order no matter what the
 * person exporting had sorted by on screen.
 */
export function CaseSortProvider({ children }: { children: React.ReactNode }) {
  const sort = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleSort = useCallback((column: SortColumn) => {
    const prev = getSnapshot();
    if (prev.column !== column) {
      writeSort({ column, direction: 'asc' });
      return;
    }
    // Same column again: asc -> desc -> back to the default order.
    writeSort(prev.direction === 'asc' ? { column, direction: 'desc' } : DEFAULT_SORT);
  }, []);

  const value = useMemo(
    () => ({ column: sort.column, direction: sort.direction, toggleSort }),
    [sort, toggleSort]
  );

  return <CaseSortContext.Provider value={value}>{children}</CaseSortContext.Provider>;
}

export function useCaseSort() {
  return useContext(CaseSortContext);
}
