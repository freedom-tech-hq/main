import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

const TraceCacheContext = createTraceContext<Partial<Record<string, any>>>(() => ({}));

export const useTraceCacheContext = (trace: Trace) => useTraceContext(trace, TraceCacheContext);

export const useTraceCache = <T extends Record<string, any>>(trace: Trace, id: string) => {
  const allCaches = useTraceContext(trace, TraceCacheContext);
  if (allCaches[id] === undefined) {
    allCaches[id] = {};
  }

  return allCaches[id] as T;
};

export const traceCacheContextProvider = <ReturnT>(
  trace: Trace,
  storage: Partial<Record<string, any>>,
  callback: (trace: Trace) => ReturnT
) => TraceCacheContext.provider(trace, storage, callback);
