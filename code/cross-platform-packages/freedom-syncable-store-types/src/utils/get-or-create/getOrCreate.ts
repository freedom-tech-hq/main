import type { FailureResult, PR, PRFunc } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { disableLam } from 'freedom-trace-logging-and-metrics';

export const getOrCreate = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, ErrorCodeT extends string>(
    trace: Trace,
    { get, create }: { get: PRFunc<T, ErrorCodeT | 'not-found'>; create: PRFunc<T | undefined, ErrorCodeT | 'conflict'> }
  ): PR<T, Exclude<ErrorCodeT, 'conflict'>> => {
    const found = await disableLam(trace, 'not-found', (trace) => get(trace));
    if (found.ok) {
      return found;
    } else if (found.value.errorCode !== 'not-found') {
      return found as FailureResult<Exclude<ErrorCodeT, 'conflict'>>;
    }

    const created = await disableLam(trace, 'conflict', (trace) => create(trace));
    if (!created.ok) {
      // Try to get the bundle again if there's a conflict, since it might have just been created
      if (created.value.errorCode === 'conflict') {
        const found2 = await get(trace);
        if (!found2.ok) {
          return found2 as FailureResult<Exclude<ErrorCodeT, 'conflict'>>;
        }

        return makeSuccess(found2.value);
      }

      return excludeFailureResult(created, 'conflict');
    }

    if (created.value !== undefined) {
      // If the creation function returns the created value, return it

      return makeSuccess(created.value);
    } else {
      // Otherwise, get it and return it

      const found2 = await get(trace);
      if (!found2.ok) {
        return generalizeFailureResult(trace, found2, 'not-found') as any as FailureResult<Exclude<ErrorCodeT, 'conflict'>>;
      }

      return makeSuccess(found2.value);
    }
  }
);
