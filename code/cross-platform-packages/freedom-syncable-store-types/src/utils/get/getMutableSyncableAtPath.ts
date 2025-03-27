import type { PR } from 'freedom-async';
import { allResults, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { MutableSyncableBundleAccessor } from '../../types/MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { guardIsExpectedType } from '../guards/guardIsExpectedType.ts';
import { guardIsProvenanceValid } from '../guards/guardIsProvenanceValid.ts';
import { guardIsSyncableItemAcceptedOrWasWriteLegit } from '../guards/guardIsSyncableItemAcceptedOrWasWriteLegit.ts';

export const getMutableSyncableAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (store.path.storageRootId !== path.storageRootId) {
      return makeFailure(new NotFoundError(trace, { message: 'Wrong storage root ID', errorCode: 'not-found' }));
    }

    const rootGuards = await guardIsProvenanceValid(trace, store, store);
    if (!rootGuards.ok) {
      return rootGuards;
    }

    if (path.ids.length === 0) {
      const guards = guardIsExpectedType(trace, new StaticSyncablePath(path.storageRootId), store, expectedType, 'wrong-type');
      if (!guards.ok) {
        return generalizeFailureResult(trace, guards, 'wrong-type');
      }

      return makeSuccess(store as MutableSyncableStore & { type: T });
    }

    let cursor = await store.getMutable(trace, path.ids[0]);
    if (!cursor.ok) {
      return cursor;
    }

    const firstCursorGuards = await allResults(trace, [
      guardIsProvenanceValid(trace, store, cursor.value),
      guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value)
    ]);
    if (!firstCursorGuards.ok) {
      return firstCursorGuards;
    }

    for (const id of path.ids.slice(1)) {
      switch (cursor.value.type) {
        case 'folder':
        case 'bundle': {
          const folderLikeAccessor = cursor.value as MutableSyncableFolderAccessor | MutableSyncableBundleAccessor;

          const nextCursor = await folderLikeAccessor.getMutable(trace, id);
          if (!nextCursor.ok) {
            return nextCursor;
          }

          cursor = nextCursor;

          const cursorGuards = await allResults(trace, [
            guardIsProvenanceValid(trace, store, cursor.value),
            guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value)
          ]);
          if (!cursorGuards.ok) {
            return cursorGuards;
          }

          break;
        }
        case 'file':
          return makeFailure(
            new NotFoundError(trace, {
              message: `Expected folder or bundle, found ${cursor.value.type}`,
              errorCode: 'not-found'
            })
          );
      }
    }

    const finalGuards = await allResults(trace, [
      guardIsProvenanceValid(trace, store, cursor.value),
      guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value),
      guardIsExpectedType(trace, path, cursor.value, expectedType, 'wrong-type')
    ]);
    if (!finalGuards.ok) {
      return generalizeFailureResult(trace, finalGuards, 'wrong-type');
    }

    return makeSuccess(cursor.value as MutableSyncableItemAccessor & { type: T });
  }
);
