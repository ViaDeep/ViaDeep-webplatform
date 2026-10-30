import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '@/api/http';

export type Loaded<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

/** Carga datos al montar y cada vez que cambia `key`; `reload` vuelve a pedirlos sin borrar lo que ya se ve. */
export function useLoader<T>(load: () => Promise<T>, key: string): Loaded<T> {
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null; done: boolean }>({
    key,
    data: null,
    error: null,
    done: false,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ key, data, error: null, done: true }),
      (error: unknown) => active && setState((previous) => ({ ...previous, key, error: errorMessage(error), done: true })),
    );
    return () => {
      active = false;
    };
    // `load` cambia en cada render; `key` resume de qué depende.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const stale = state.key !== key;
  return { data: state.data, error: stale ? null : state.error, loading: stale || !state.done, reload };
}
