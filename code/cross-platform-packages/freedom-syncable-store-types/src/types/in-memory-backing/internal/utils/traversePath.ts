import { makeFailure, makeSuccess, makeSyncResultFunc, type Result } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemType } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import { guardIsExpectedType } from '../../../../utils/guards/guardIsExpectedType.ts';
import type { InMemorySyncableStoreBackingItem } from '../types/InMemorySyncableStoreBackingItem.ts';

export const traversePath = makeSyncResultFunc(
  [import.meta.filename],
  <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    item: InMemorySyncableStoreBackingItem,
    path: StaticSyncablePath,
    expectedType?: SingleOrArray<T>
  ): Result<InMemorySyncableStoreBackingItem & { type: T }, 'not-found' | 'wrong-type'> => {
    const idsSoFar: SyncableId[] = [];

    let cursor: InMemorySyncableStoreBackingItem = item;
    for (const pathId of path.ids) {
      idsSoFar.push(pathId);

      switch (cursor.type) {
        case 'flatFile':
          return makeFailure(
            new NotFoundError(trace, {
              message: `Expected folder or bundleFile, found: ${cursor.type}`,
              errorCode: 'wrong-type'
            })
          );

        case 'folder':
        case 'bundleFile': {
          const nextCursor = cursor.contents[pathId];

          if (nextCursor === undefined) {
            return makeFailure(
              new NotFoundError(trace, {
                message: `No item found at ${new StaticSyncablePath(path.storageRootId, ...idsSoFar).toString()}`,
                errorCode: 'not-found'
              })
            );
          }

          cursor = nextCursor;
        }
      }
    }

    const guards = guardIsExpectedType(trace, path, cursor, expectedType, 'wrong-type');
    if (!guards.ok) {
      return guards;
    }

    return makeSuccess(cursor as InMemorySyncableStoreBackingItem & { type: T });
  }
);
