import { useState, useEffect, useCallback } from 'react';
import { fetchLandingProfessionals, ApiError } from '../lib/api';
import type { LandingProfessional, ApiMeta } from '../types/api';

interface UseLandingProfessionalsReturn {
  professionals: LandingProfessional[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLandingProfessionals(perPage = 9): UseLandingProfessionalsReturn {
  const [professionals, setProfessionals] = useState<LandingProfessional[]>([]);
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
        const result = await fetchLandingProfessionals(1, perPage);
        if (!cancelled) {
          setProfessionals(result.data);
          setMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Não foi possível carregar os profissionais. Tente novamente.');
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

  return { professionals, meta, isLoading, error, refetch };
}
