import type { PRFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncableId, SyncableItemMetadata, SyncableOriginOptions } from 'freedom-sync-types';

import type { FileStore } from '../immutable/FileStore.ts';
import type { MutableStoreBase } from './MutableStoreBase.ts';
import type { MutableSyncableBundleAccessor } from './MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFileAccessor } from './MutableSyncableFileAccessor.ts';

export interface MutableFileStore extends MutableStoreBase, FileStore {
  /**
   * Creates a new file from binary data.
   *
   * Returns a 'conflict' failure if the object already exists.
   */
  readonly createBinaryFile: PRFunc<
    MutableSyncableFileAccessor,
    'conflict',
    [
      | (SyncableOriginOptions & {
          mode?: 'local';
          /** @defaultValue generated using `makeUuid()` */
          id?: SyncableId;
          /** @defaultValue `id` */
          name?: DynamicSyncableItemName;
          value: Uint8Array;
        })
      | {
          mode: 'via-sync';
          id: SyncableId;
          encodedValue: Uint8Array;
          metadata: SyncableItemMetadata;
        }
    ]
  >;

  /**
   * Creates a new empty bundle (which is really just a sub-folder without permissions overrides).
   *
   * Returns a 'conflict' failure if the object already exists.
   */
  readonly createBundle: PRFunc<
    MutableSyncableBundleAccessor,
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
