import type { ChainableResult, PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, resolveChain } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { syncableItemTypes, SyncablePath } from 'freedom-sync-types';
import type { SyncableFileAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const isSyncableDeleted = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    pathOrAccessor: SyncablePath | ChainableResult<SyncableFileAccessor, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>,
    { recursive }: { recursive: boolean }
  ): PR<boolean, 'not-found'> => {
    let path: SyncablePath;
    if (pathOrAccessor instanceof SyncablePath) {
      path = pathOrAccessor;
    } else {
      const file = await resolveChain(pathOrAccessor);
      if (!file.ok) {
        return generalizeFailureResult(trace, file, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
      }
      path = file.value.path;
    }

    if (path.parentPath === undefined) {
      return makeSuccess(false); // Roots aren't deletable
    }

    const parentFolderLike = await getSyncableAtPath(trace, store, path.parentPath, syncableItemTypes.exclude('file'));
    if (!parentFolderLike.ok) {
      return generalizeFailureResult(trace, parentFolderLike, ['untrusted', 'wrong-type']);
    }

    const isDeleted = await parentFolderLike.value.isDeleted(trace, path.lastId!);
    if (!isDeleted.ok) {
      return isDeleted;
    } else if (isDeleted.value) {
      return makeSuccess(true);
    }

    if (recursive) {
      return await isSyncableDeleted(trace, store, path.parentPath, { recursive: true });
    }

    return makeSuccess(false);
  }
);
