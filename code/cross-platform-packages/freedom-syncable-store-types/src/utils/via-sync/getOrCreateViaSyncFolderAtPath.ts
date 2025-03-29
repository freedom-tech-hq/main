import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableFolderAtPath } from '../get/getMutableFolderAtPath.ts';
import { createViaSyncFolderAtPath } from './createViaSyncFolderAtPath.ts';

export const getOrCreateViaSyncFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    metadata: SyncableItemMetadata
  ): PR<{ folder: MutableSyncableFolderAccessor; isNewlyCreated: boolean }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const created = await disableLam(trace, 'conflict', (trace) => createViaSyncFolderAtPath(trace, store, path, metadata));
    if (!created.ok) {
      if (created.value.errorCode === 'conflict') {
        const got = await getMutableFolderAtPath(trace, store, path);
        if (!got.ok) {
          return got;
        }

        return makeSuccess({ folder: got.value, isNewlyCreated: false });
      }
      return excludeFailureResult(created, 'conflict');
    }

    return makeSuccess({ folder: created.value, isNewlyCreated: true });
  }
);
