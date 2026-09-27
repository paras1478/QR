import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const POLLING_INTERVAL = 5000;

interface UsePollingOptions {
  enabled?: boolean;
}

// Polls `callback` every `intervalMs`, fetching once immediately on mount.
// - Skips a tick if the previous call from this hook hasn't resolved yet
//   (prevents overlapping/duplicate requests).
// - Pauses while the tab is hidden and resumes (with an immediate fetch) when
//   it becomes visible again, so the interval doesn't fire pointlessly in a
//   background tab.
// - Stops entirely once `enabled` is false (e.g. the user logged out) or the
//   component unmounts.
export function usePolling(callback: () => Promise<unknown>, intervalMs: number, options: UsePollingOptions = {}) {
  const { user } = useAuth();
  const enabled = (options.enabled ?? true) && Boolean(user);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const tick = async () => {
      if (inFlightRef.current || document.hidden) return;
      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };

    tick();
    const intervalId = window.setInterval(tick, intervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden && !cancelled) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
