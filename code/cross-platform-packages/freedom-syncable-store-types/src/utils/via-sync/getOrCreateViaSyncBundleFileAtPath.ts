import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableBundleFileAtPath } from '../get/getMutableBundleFileAtPath.ts';
import { createViaSyncBundleFileAtPath } from './createViaSyncBundleFileAtPath.ts';

export const getOrCreateViaSyncBundleFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: StaticSyncablePath,
    provenance: SyncableProvenance
  ): PR<{ bundle: MutableFileStore; isNewlyCreated: boolean }, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const created = await disableLam(trace, 'conflict', (trace) => createViaSyncBundleFileAtPath(trace, store, path, provenance));
    if (!created.ok) {
      if (created.value.errorCode === 'conflict') {
        const got = await getMutableBundleFileAtPath(trace, store, path);
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
