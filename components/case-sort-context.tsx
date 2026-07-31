'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SortColumn, SortDirection } from '@/types';

type SortState = { column: SortColumn | null; direction: SortDirection };

type CaseSortValue = SortState & { toggleSort: (column: SortColumn) => void };

const CaseSortContext = createContext<CaseSortValue>({
  column: null,
  direction: 'asc',
  toggleSort: () => {},
});

/**
 * Holds the table's column sort so that everything looking at the case list —
 * the table itself and the PDF export — orders rows identically. Without this
 * the exported sheet came out in the server's default order no matter what the
 * person exporting had sorted by on screen.
 */
export function CaseSortProvider({ children }: { children: React.ReactNode }) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' });

  const toggleSort = useCallback((column: SortColumn) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: 'asc' };
      // Same column again: asc -> desc -> back to the default order.
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: 'asc' };
    });
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
