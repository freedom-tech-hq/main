import type { ChainableResult, PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { deserialize } from 'freedom-serialization';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableFileAccessor, SyncableStore } from 'freedom-syncable-store-types';
import type { JsonValue, Schema } from 'yaschema';

import { getStringFromFile } from './getStringFromFile.ts';

export const getJsonFromFile = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor: SyncablePath | ChainableResult<SyncableFileAccessor, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>,
    schema: Schema<T>,
    options: { checkForDeletion?: boolean } = {}
  ): PR<T, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const jsonString = await getStringFromFile(trace, store, pathOrAccessor, options);
    /* node:coverage disable */
    if (!jsonString.ok) {
      return jsonString;
    }
    /* node:coverage enable */

    try {
      const json = JSON.parse(jsonString.value) as JsonValue;
      const deserialization = await deserialize(trace, { serializedValue: json, valueSchema: schema });
      /* node:coverage disable */
      if (!deserialization.ok) {
        return makeFailure(new ConflictError(trace, { cause: deserialization.value, errorCode: 'format-error' }));
      }
      /* node:coverage enable */

      return makeSuccess(deserialization.value);
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e, 'format-error'));
    }
  }
);
