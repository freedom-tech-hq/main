import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncableBundleMetadata, SyncableFlatFileMetadata, SyncableId } from 'freedom-sync-types';

import type { FileStore } from './FileStore.ts';
import type { MutableBundleAccessor } from './MutableBundleAccessor.ts';
import type { MutableFlatFileAccessor } from './MutableFlatFileAccessor.ts';
import type { MutableStoreBase } from './MutableStoreBase.ts';

export interface MutableFileStore extends MutableStoreBase, FileStore {
  /**
   * Creates a new file from binary data.
   *
   * Returns a 'conflict' failure if the object already exists.
   */
  readonly createBinaryFile: PRFunc<
    MutableFlatFileAccessor,
    'conflict' | 'deleted',
    [
      | {
          mode?: 'local';
          id: DynamicSyncableId;
          value: Uint8Array;
        }
      | {
          mode: 'via-sync';
          id: SyncableId;
          encodedValue: Uint8Array;
          metadata: SyncableFlatFileMetadata;
        }
    ]
  >;

  /**
   * Creates a new empty bundle (which is really just a sub-folder without permissions overrides).
   *
   * Returns a 'conflict' failure if the object already exists.
   */
  readonly createBundle: PRFunc<
    MutableBundleAccessor,
    'conflict' | 'deleted',
    [
      | {
          mode?: 'local';
          id: DynamicSyncableId;
        }
      | {
          mode: 'via-sync';
          id: SyncableId;
          metadata: SyncableBundleMetadata;
        }
    ]
  >;
}
