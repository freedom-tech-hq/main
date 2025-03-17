import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';

import { callAsyncFunc } from './callAsyncFunc.ts';

const globalCache: Record<string, any> = {};

/** Computes a async value once and caches the result using the specified global key */
export const computeAsyncOnce = async <T>(idStack: string[], key: string, producer: (trace: Trace) => Promise<T>): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cached = globalCache[key];
  if (cached !== undefined) {
    return cached as Promise<T>;
  }

  const trace = makeTrace(...idStack);
  const promisedOutput = callAsyncFunc(trace, {}, async (trace) => producer(trace));
  globalCache[key] = promisedOutput;

  return promisedOutput;
};
