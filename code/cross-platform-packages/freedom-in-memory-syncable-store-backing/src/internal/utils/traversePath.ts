import { makeFailure, makeSuccess, makeSyncResultFunc, type Result } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemType } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath, SyncablePath } from 'freedom-sync-types';
import { guardIsExpectedType } from 'freedom-syncable-store-backing-types';
import type { SingleOrArray } from 'yaschema';

import type { InMemorySyncableStoreBackingItem } from '../types/InMemorySyncableStoreBackingItem.ts';

type BackingTypeBySyncableItemType<T extends SyncableItemType> =
  | (T extends 'file' ? 'file' : never)
  | (T extends 'bundle' ? 'folder' : never)
  | (T extends 'folder' ? 'folder' : never);

export const traversePath = makeSyncResultFunc(
  [import.meta.filename],
  <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    item: InMemorySyncableStoreBackingItem,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): Result<
    InMemorySyncableStoreBackingItem & {
      type: BackingTypeBySyncableItemType<T>;
      metadata: InMemorySyncableStoreBackingItem['metadata'] & { type: T };
    },
    'not-found' | 'wrong-type'
  > => {
    const idsSoFar: SyncableId[] = [];

    let cursor: InMemorySyncableStoreBackingItem = item;
    for (const pathId of path.ids) {
      idsSoFar.push(pathId);

      switch (cursor.type) {
        case 'file':
          return makeFailure(
            new NotFoundError(trace, {
              message: `Expected folder or bundle, found: ${cursor.type}`,
              errorCode: 'wrong-type'
            })
          );

        case 'folder': {
          const nextCursor = cursor.contents[pathId];

          if (nextCursor === undefined) {
            return makeFailure(
              new NotFoundError(trace, {
                message: `No item found at ${new SyncablePath(path.storageRootId, ...idsSoFar).toString()}`,
                errorCode: 'not-found'
              })
            );
          }

          cursor = nextCursor;
        }
      }
    }

    const itemType = extractSyncableItemTypeFromPath(path);
    const guards = guardIsExpectedType(trace, path, itemType, expectedType, 'wrong-type');
    if (!guards.ok) {
      return guards;
    }

    return makeSuccess(
      cursor as InMemorySyncableStoreBackingItem & {
        type: BackingTypeBySyncableItemType<T>;
        metadata: InMemorySyncableStoreBackingItem['metadata'] & { type: T };
      }
    );
  }
);
