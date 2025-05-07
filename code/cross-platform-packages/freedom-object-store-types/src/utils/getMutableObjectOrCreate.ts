import type { FailureResult, PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { StorableObject } from '../types/StorableObject.ts';

export const getMutableObjectOrCreate = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, ErrorCodeT extends string>(
    trace: Trace,
    {
      getMutable,
      create
    }: {
      getMutable: PRFunc<StorableObject<T>, ErrorCodeT | 'not-found'>;
      create: PRFunc<T | undefined, ErrorCodeT | 'conflict'>;
    }
  ): PR<StorableObject<T>, Exclude<ErrorCodeT, 'conflict' | 'not-found'>> => {
    const found = await disableLam('not-found', getMutable)(trace);
    if (found.ok) {
      return found;
    } /* node:coverage disable */ else if (found.value.errorCode !== 'not-found') {
      return found as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
    }
    /* node:coverage enable */

    const created = await disableLam('conflict', create)(trace);
    /* node:coverage disable */
    if (!created.ok) {
      // Try to get the bundle again if there's a conflict, since it might have just been created
      if (created.value.errorCode === 'conflict') {
        const found2 = await getMutable(trace);
        if (!found2.ok) {
          return generalizeFailureResult(trace, found2, 'not-found') as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
        }

        return makeSuccess(found2.value);
      }

      return created as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
    }
    /* node:coverage enable */

    const found2 = await getMutable(trace);
    /* node:coverage disable */
    if (!found2.ok) {
      return generalizeFailureResult(trace, found2, 'not-found') as any as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found'>>;
    }
    /* node:coverage enable */

    return makeSuccess(found2.value);
  }
);
