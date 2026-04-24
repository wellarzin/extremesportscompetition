import { useState, useEffect } from 'react';
import { fetchFeaturedEvents } from '../lib/api';
import type { FeaturedEvent } from '../types/api';

interface UseFeaturedEventsReturn {
  events: FeaturedEvent[];
  isLoading: boolean;
}

export function useFeaturedEvents(): UseFeaturedEventsReturn {
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchFeaturedEvents()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch(() => { /* silencia — hero cai no fallback estático */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { events, isLoading };
}
