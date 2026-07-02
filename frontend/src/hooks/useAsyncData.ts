import { useState, useEffect } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  dependencies: React.DependencyList = []
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await asyncFn();
        if (mounted) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err) {
        if (mounted) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return state;
}

interface MultiAsyncState<T extends Record<string, any>> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useMultipleAsyncData<T extends Record<string, any>>(
  asyncFns: Record<string, () => Promise<any>>,
  dependencies: React.DependencyList = []
): MultiAsyncState<T> {
  const [state, setState] = useState<MultiAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const promises = Object.entries(asyncFns).map(([key, fn]) =>
          fn().then(result => [key, result])
        );

        const results = await Promise.all(promises);
        const data = Object.fromEntries(results) as T;

        if (mounted) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (mounted) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return state;
}
