import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncableItemMetadata, SyncableId } from 'freedom-sync-types';

import type { FolderStore } from './FolderStore.ts';
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
    'conflict' | 'deleted',
    [
      | {
          mode?: 'local';
          /** @defaultValue generated using `makeUuid()` */
          id?: SyncableId;
          /** @defaultValue `id` */
          name?: DynamicSyncableItemName;
        }
      | {
          mode: 'via-sync';
          id: SyncableId;
          metadata: SyncableItemMetadata;
        }
    ]
  >;
}
