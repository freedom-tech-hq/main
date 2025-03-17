import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

import type { MutableObjectAccessor } from '../types/MutableObjectAccessor.ts';
import { updateObject } from './updateObject.ts';

export const createOrUpdateObject = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    objectAccessor: MutableObjectAccessor<T>,
    initialOnly: T,
    updateOnly: ((readValue: T) => Partial<T>) | Partial<T>
  ): PR<undefined> => {
    const created = await objectAccessor.create(trace, initialOnly);
    if (created.ok) {
      return makeSuccess(undefined);
    }
    /* node:coverage disable */
    if (created.value.errorCode !== 'conflict') {
      return excludeFailureResult(created, 'conflict');
    }
    /* node:coverage enable */

    // 'not-found' shouldn't really ever happen since we just checked to see if we could create it.  Technically, it could actually still
    // happen due to race conditions, but we'll let clients deal with that opaquely.
    return generalizeFailureResult(trace, await updateObject(trace, objectAccessor, updateOnly), 'not-found');
  }
);
