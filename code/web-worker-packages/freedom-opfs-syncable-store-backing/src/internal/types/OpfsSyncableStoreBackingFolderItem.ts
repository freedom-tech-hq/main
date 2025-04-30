import type { PRFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from './OpfsLocalItemMetadata.ts';
import type { OpfsSyncableStoreBackingItem } from './OpfsSyncableStoreBackingItem.ts';

export interface OpfsSyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly exists: PRFunc<boolean, 'wrong-type', [id?: SyncableId]>;
  readonly get: PRFunc<OpfsSyncableStoreBackingItem, 'not-found' | 'wrong-type', [id: SyncableId]>;
  readonly metadata: PRFunc<SyncableItemMetadata & OpfsLocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly contents: PRFunc<Partial<Record<SyncableId, OpfsSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'>;
}
