import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { StaticSyncablePath, SyncableFolderMetadata } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableFolderAtPath } from '../get/getMutableFolderAtPath.ts';
import { createViaSyncFolderAtPath } from './createViaSyncFolderAtPath.ts';

export const getOrCreateViaSyncFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: StaticSyncablePath,
    metadata: SyncableFolderMetadata
  ): PR<
    { folder: MutableAccessControlledFolderAccessor; isNewlyCreated: boolean },
    'deleted' | 'not-found' | 'untrusted' | 'wrong-type'
  > => {
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
