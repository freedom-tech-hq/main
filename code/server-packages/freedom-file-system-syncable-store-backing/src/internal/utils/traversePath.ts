import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemType } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, SyncablePath } from 'freedom-sync-types';
import { guardIsExpectedType } from 'freedom-syncable-store-backing-types';
import type { SingleOrArray } from 'yaschema';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';

type BackingTypeBySyncableItemType<T extends SyncableItemType> =
  | (T extends 'file' ? 'file' : never)
  | (T extends 'bundle' ? 'folder' : never)
  | (T extends 'folder' ? 'folder' : never);

export const traversePath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    item: FileSystemSyncableStoreBackingItem,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<
    FileSystemSyncableStoreBackingItem & {
      type: BackingTypeBySyncableItemType<T>;
      metadata: FileSystemSyncableStoreBackingItem['metadata'] & { type: T };
    },
    'not-found' | 'wrong-type'
  > => {
    const idsSoFar: SyncableId[] = [];

    let cursor: FileSystemSyncableStoreBackingItem = item;
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
          const got = await cursor.get(trace, pathId);
          if (!got.ok) {
            return got;
          }

          const nextCursor = got.value;

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

    const itemType = path.lastId === undefined ? 'folder' : extractSyncableItemTypeFromId(path.lastId!);
    const guards = guardIsExpectedType(trace, path, itemType, expectedType, 'wrong-type');
    if (!guards.ok) {
      return guards;
    }

    const exists = await cursor.exists(trace);
    if (!exists.ok) {
      return exists;
    } else if (!exists.value) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `No item found at ${new SyncablePath(path.storageRootId, ...idsSoFar).toString()}`,
          errorCode: 'not-found'
        })
      );
    }

    return makeSuccess(
      cursor as FileSystemSyncableStoreBackingItem & {
        type: BackingTypeBySyncableItemType<T>;
        metadata: FileSystemSyncableStoreBackingItem['metadata'] & { type: T };
      }
    );
  }
);
