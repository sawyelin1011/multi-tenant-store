import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { AxiosRequestConfig } from 'axios';

interface UseApiOptions<T> {
  method?: 'get' | 'post' | 'put' | 'delete';
  body?: unknown;
  params?: Record<string, unknown>;
  immediate?: boolean;
  transform?: (data: T) => T;
  config?: AxiosRequestConfig;
}

export function useApi<T = unknown>(endpoint: string, options: UseApiOptions<T> = {}) {
  const { method = 'get', body, params, immediate = true, transform, config } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.request<T>({ url: endpoint, method, data: body, params, ...config });
      const result = response.data;
      setData(transform ? transform(result) : result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body, params, transform, config]);

  useEffect(() => {
    if (immediate) {
      void fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData };
}
