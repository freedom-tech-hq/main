import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableBundleMetadata, SyncablePath } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableBundleAtPath } from '../get/getMutableBundleAtPath.ts';
import { createViaSyncBundleAtPath } from './createViaSyncBundleAtPath.ts';

export const getOrCreateViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    metadata: SyncableBundleMetadata
  ): PR<{ bundle: MutableFileStore; isNewlyCreated: boolean }, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const created = await disableLam(trace, 'conflict', (trace) => createViaSyncBundleAtPath(trace, store, path, metadata));
    if (!created.ok) {
      if (created.value.errorCode === 'conflict') {
        const got = await getMutableBundleAtPath(trace, store, path);
        if (!got.ok) {
          return got;
        }

        return makeSuccess({ bundle: got.value, isNewlyCreated: false });
      }
      return excludeFailureResult(created, 'conflict');
    }

    return makeSuccess({ bundle: created.value, isNewlyCreated: true });
  }
);
