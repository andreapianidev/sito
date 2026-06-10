import { useEffect, useRef } from 'react';

/**
 * Calls `refreshFn` whenever the browser tab becomes visible again.
 * Uses a ref internally so callers don't need to memoize the callback.
 */
export function useRefreshOnFocus(refreshFn: () => void) {
  const fnRef = useRef(refreshFn);
  fnRef.current = refreshFn;

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        fnRef.current();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
}
