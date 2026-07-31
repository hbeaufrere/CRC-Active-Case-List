'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
// Don't re-query on a quick tab switch — only when the tab has been away a while.
const MIN_REFRESH_GAP_MS = 60 * 1000;

/**
 * Keeps a long-lived dashboard tab from going stale.
 *
 * Follow-up state ("OVERDUE 3d", "DUE TODAY") and the urgency escalation that
 * rides on it are computed on the server at request time, so a tab left open
 * overnight would keep showing yesterday's picture — and would never show edits
 * made by anyone else. This re-fetches the server components on an interval and
 * whenever the tab is brought back to the foreground.
 *
 * Renders nothing.
 */
export default function AutoRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let lastRefresh = Date.now();

    function refresh() {
      lastRefresh = Date.now();
      router.refresh();
    }

    // Background tabs are throttled by the browser anyway; skip them outright so
    // an idle tab isn't querying the database all night.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh > MIN_REFRESH_GAP_MS) {
        refresh();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
}
