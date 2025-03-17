import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

import type { MutableObjectAccessor } from '../types/MutableObjectAccessor.ts';

export const createOrGetObject = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, objectAccessor: MutableObjectAccessor<T>, initialValue: T): PR<T> => {
    const created = await objectAccessor.create(trace, initialValue);
    if (created.ok) {
      return created;
    }
    /* node:coverage disable */
    if (created.value.errorCode !== 'conflict') {
      return excludeFailureResult(created, 'conflict');
    }
    /* node:coverage enable */

    // 'not-found' shouldn't really ever happen since we just checked to see if we could create it.  Technically, it could actually still
    // happen due to race conditions, but we'll let clients deal with that opaquely.
    return generalizeFailureResult(trace, await objectAccessor.get(trace), 'not-found');
  }
);
