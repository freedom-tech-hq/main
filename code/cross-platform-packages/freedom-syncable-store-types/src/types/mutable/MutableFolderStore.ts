import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncableId, SyncableItemMetadata, SyncableOriginOptions } from 'freedom-sync-types';

import type { FolderStore } from '../immutable/FolderStore.ts';
import type { MutableStoreBase } from './MutableStoreBase.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';

export interface MutableFolderStore extends MutableStoreBase, FolderStore {
  /**
   * Creates a new folder.  Locally created folders must be initialized exactly once before they can be used.
   *
   * Returns a 'conflict' failure if the folder already exists
   */
  readonly createFolder: PRFunc<
    MutableSyncableFolderAccessor,
    'conflict',
    [
      | (SyncableOriginOptions & {
          mode?: 'local';
          /** @defaultValue generated using `makeUuid()` */
          id?: SyncableId;
          /** @defaultValue `id` */
          name?: DynamicSyncableItemName;
        })
      | {
          mode: 'via-sync';
          id: SyncableId;
          metadata: SyncableItemMetadata;
        }
    ]
  >;
}
