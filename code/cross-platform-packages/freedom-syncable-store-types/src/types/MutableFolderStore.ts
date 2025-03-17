import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncableId, SyncableProvenance } from 'freedom-sync-types';

import type { FolderStore } from './FolderStore.ts';
import type { MutableAccessControlledFolderAccessor } from './MutableAccessControlledFolderAccessor.ts';
import type { MutableStoreBase } from './MutableStoreBase.ts';

export interface MutableFolderStore extends MutableStoreBase, FolderStore {
  /**
   * Creates a new folder.  Locally created folders must be initialized exactly once before they can be used.
   *
   * Returns a 'conflict' failure if the folder already exists
   */
  readonly createFolder: PRFunc<
    MutableAccessControlledFolderAccessor,
    'conflict' | 'deleted',
    [
      | {
          mode?: 'local';
          id: DynamicSyncableId;
        }
      | {
          mode: 'via-sync';
          id: SyncableId;
          provenance: SyncableProvenance;
        }
    ]
  >;
}
