import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, path: SyncablePath, metadata: SyncableItemMetadata) =>
    await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (trace): PR<MutableFileStore, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
        const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('file'));
        if (!parent.ok) {
          return parent;
        }

        return await parent.value.createBundle(trace, { mode: 'via-sync', id: path.lastId!, metadata });
      }
    )
);
