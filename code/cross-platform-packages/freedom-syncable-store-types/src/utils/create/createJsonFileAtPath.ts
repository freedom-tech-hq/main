import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';
import type { Schema } from 'yaschema';

import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createStringFileAtPath } from './createStringFileAtPath.ts';

export const createJsonFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId,
    initialValue: T,
    schema: Schema<T>
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const serialization = await schema.serializeAsync(initialValue);
    /* node:coverage disable */
    if (serialization.error !== undefined) {
      return makeFailure(new ConflictError(trace, { message: serialization.error, errorCode: 'format-error' }));
    }
    /* node:coverage enable */

    const jsonString = JSON.stringify(serialization.serialized);
    return await createStringFileAtPath(trace, store, parentPath, id, jsonString);
  }
);
