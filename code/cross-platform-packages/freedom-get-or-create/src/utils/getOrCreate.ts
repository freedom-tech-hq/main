import type { FailureResult, PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { disableLam } from 'freedom-trace-logging-and-metrics';

export const getOrCreate = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, ErrorCodeT extends string>(
    trace: Trace,
    { get, create }: { get: PRFunc<T, ErrorCodeT | 'not-found'>; create: PRFunc<T | undefined, ErrorCodeT | 'conflict'> }
  ): PR<T, Exclude<ErrorCodeT, 'conflict' | 'not-found'>> => {
    const found = await disableLam(trace, 'not-found', (trace) => get(trace));
    if (found.ok) {
      return found;
    } /* node:coverage disable */ else if (found.value.errorCode !== 'not-found') {
      return found as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
    }
    /* node:coverage enable */

    const created = await disableLam(trace, 'conflict', (trace) => create(trace));
    /* node:coverage disable */
    if (!created.ok) {
      // Try to get the bundle again if there's a conflict, since it might have just been created
      if (created.value.errorCode === 'conflict') {
        const found2 = await get(trace);
        if (!found2.ok) {
          return generalizeFailureResult(trace, found2, 'not-found') as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
        }

        return makeSuccess(found2.value);
      }

      return created as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
    }
    /* node:coverage enable */

    if (created.value !== undefined) {
      // If the creation function returns the created value, return it

      return makeSuccess(created.value);
    } else {
      // Otherwise, get it and return it

      const found2 = await get(trace);
      /* node:coverage disable */
      if (!found2.ok) {
        return generalizeFailureResult(trace, found2, 'not-found') as any as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
      }
      /* node:coverage enable */

      return makeSuccess(found2.value);
    }
  }
);
