import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';
import type { Schema } from 'yaschema';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getStringFromFileAtPath } from './getStringFromFileAtPath.ts';

export const getJsonFromFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    schema: Schema<T>
  ): PR<T, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const jsonString = await getStringFromFileAtPath(trace, store, path);
    /* node:coverage disable */
    if (!jsonString.ok) {
      return jsonString;
    }
    /* node:coverage enable */

    try {
      const json = JSON.parse(jsonString.value) as T;
      const deserialization = await schema.deserializeAsync(json);
      /* node:coverage disable */
      if (deserialization.error !== undefined) {
        return makeFailure(new ConflictError(trace, { message: deserialization.error, errorCode: 'format-error' }));
      }
      /* node:coverage enable */

      return makeSuccess(deserialization.deserialized);
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e, 'format-error'));
    }
  }
);
