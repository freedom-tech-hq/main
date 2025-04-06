import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { serialize } from 'freedom-serialization';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { type Schema } from 'yaschema';

import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createStringFileAtPath } from './createStringFileAtPath.ts';

export const createJsonFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    {
      name,
      value,
      schema,
      trustedTimeSignature
    }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName; value: T; schema: Schema<T> }
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const serialization = await serialize(trace, value, schema);
    /* node:coverage disable */
    if (!serialization.ok) {
      return makeFailure(new ConflictError(trace, { cause: serialization.value, errorCode: 'format-error' }));
    }
    /* node:coverage enable */

    const jsonString = JSON.stringify(serialization.value.serializedValue);
    return await createStringFileAtPath(trace, store, path, { name, value: jsonString, trustedTimeSignature });
  }
);
