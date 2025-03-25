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
  ): Result<
    InMemorySyncableStoreBackingItem & { metadata: InMemorySyncableStoreBackingItem['metadata'] & { type: T } },
    'not-found' | 'wrong-type'
  > => {
    console.log('FOOBARBLA lookin for', path.toString());
    const idsSoFar: SyncableId[] = [];

    let cursor: InMemorySyncableStoreBackingItem = item;
    for (const pathId of path.ids) {
      idsSoFar.push(pathId);
      console.log('FOOBARBLA so far', idsSoFar.join('/'));

      switch (cursor.type) {
        case 'flatFile':
          console.log('FOOBARBLA stopping flat file', pathId);
          return makeFailure(
            new NotFoundError(trace, {
              message: `Expected folder or bundleFile, found: ${cursor.type}`,
              errorCode: 'wrong-type'
            })
          );

        case 'folder': {
          const nextCursor = cursor.contents[pathId];

          if (nextCursor === undefined) {
            console.log('FOOBARBLA stopping folder not found', pathId);
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

      console.log('FOOBARBLA continuing after', pathId);
    }

    console.log('FOOBARBLA got to end', path.toString(), cursor.metadata);

    const guards = guardIsExpectedType(trace, path, cursor.metadata, expectedType, 'wrong-type');
    if (!guards.ok) {
      return guards;
    }

    return makeSuccess(
      cursor as InMemorySyncableStoreBackingItem & { metadata: InMemorySyncableStoreBackingItem['metadata'] & { type: T } }
    );
  }
);
