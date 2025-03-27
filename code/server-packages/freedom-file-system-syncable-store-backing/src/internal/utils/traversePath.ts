import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemType } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';
import { guardIsExpectedType } from 'freedom-syncable-store-types';
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
    path: StaticSyncablePath,
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
          const contents = await cursor.contents(trace);
          if (!contents.ok) {
            return contents;
          }

          const nextCursor = contents.value[pathId];

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

    const metadata = await cursor.metadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const guards = guardIsExpectedType(trace, path, metadata.value, expectedType, 'wrong-type');
    if (!guards.ok) {
      return guards;
    }

    return makeSuccess(
      cursor as FileSystemSyncableStoreBackingItem & {
        type: BackingTypeBySyncableItemType<T>;
        metadata: FileSystemSyncableStoreBackingItem['metadata'] & { type: T };
      }
    );
  }
);
