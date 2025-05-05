import type { ChainableResult, PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, resolveChain } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { SyncablePath } from 'freedom-sync-types';
import type { SyncableFileAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { isSyncableDeleted } from '../isSyncableDeleted.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

/** `checkForDeletion` defaults to `true` */
export const getBinaryFromFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor: SyncablePath | ChainableResult<SyncableFileAccessor, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>,
    { checkForDeletion = true }: { checkForDeletion?: boolean } = {}
  ): PR<Uint8Array, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const file = await (pathOrAccessor instanceof SyncablePath
      ? getSyncableAtPath(trace, store, pathOrAccessor, 'file')
      : resolveChain(pathOrAccessor));
    if (!file.ok) {
      return file;
    }

    const binary = await file.value.getBinary(trace);
    if (!binary.ok) {
      return binary;
    }

    if (checkForDeletion) {
      const isDeleted = await isSyncableDeleted(trace, store, file.value, { recursive: true });
      if (!isDeleted.ok) {
        return isDeleted;
      } else if (isDeleted.value) {
        return makeFailure(new NotFoundError(trace, { message: `${file.value.path.toString()} is deleted`, errorCode: 'deleted' }));
      }
    }

    return makeSuccess(binary.value);
  }
);
