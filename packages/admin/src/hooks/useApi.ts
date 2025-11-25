import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface UseApiOptions<T> {
  method?: 'get' | 'post' | 'put' | 'delete';
  body?: unknown;
  params?: Record<string, unknown>;
  immediate?: boolean;
  transform?: (data: any) => T;
}

export function useApi<T = any>(endpoint: string, options: UseApiOptions<T> = {}) {
  const { method = 'get', body, params, immediate = true, transform } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.request({ url: endpoint, method, data: body, params });
      setData(transform ? transform(response) : response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body, params, transform]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData };
}
