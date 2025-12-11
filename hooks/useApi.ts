
// FIX: Import React to provide the namespace for React.DependencyList
import React, { useState, useEffect } from 'react';
import { ApiHookResult } from '../types';

export function useApi<T,>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  enabled: boolean = true
): ApiHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Clear previous data immediately when dependencies change
    setData(null);
    setError(null);
    
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await fetcher();
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          if (e instanceof Error) {
              setError(e);
          } else {
              setError(new Error('An unknown error occurred'));
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, isLoading, error, setData };
}
