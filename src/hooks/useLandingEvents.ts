import { useState, useEffect, useCallback } from 'react';
import { fetchLandingEvents, ApiError } from '../lib/api';
import type { LandingEvent, ApiMeta } from '../types/api';

interface UseLandingEventsReturn {
  events: LandingEvent[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLandingEvents(perPage = 9): UseLandingEventsReturn {
  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchLandingEvents({ per_page: perPage });
        if (!cancelled) {
          setEvents(result.data);
          setMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Não foi possível carregar os eventos. Tente novamente.');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [perPage, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { events, meta, isLoading, error, refetch };
}
