import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncableFolderMetadata, SyncableId } from 'freedom-sync-types';

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
          id: DynamicSyncableId;
        }
      | {
          mode: 'via-sync';
          id: SyncableId;
          metadata: SyncableFolderMetadata;
        }
    ]
  >;
}
