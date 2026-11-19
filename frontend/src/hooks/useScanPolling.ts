import { useState, useEffect, useRef } from 'react';
import { Scan } from '../types/api';
import { scansApi } from '../api/scans';

const TERMINAL_STATUSES = ['completed', 'failed'];
const POLL_INTERVAL_MS = 2_000;

/**
 * Polls GET /api/scans/:id every 2 seconds until the scan is done or failed.
 */
export function useScanPolling(scanId: string | undefined) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!scanId) {
      setLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await scansApi.getById(scanId);
        const data = res.data.data;
        setScan(data);
        setLoading(false);

        if (TERMINAL_STATUSES.includes(data.status)) {
          // Stop polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch scan';
        setError(message);
        setLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Immediate first fetch
    poll();

    // Then poll every 2s
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanId]);

  return { scan, loading, error };
}
