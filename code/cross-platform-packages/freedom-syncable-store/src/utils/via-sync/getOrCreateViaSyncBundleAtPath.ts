import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getMutableBundleAtPath } from '../get/getMutableBundleAtPath.ts';
import { createViaSyncBundleAtPath } from './createViaSyncBundleAtPath.ts';

export const getOrCreateViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, path: SyncablePath, metadata: SyncableItemMetadata) =>
    await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (
        trace
      ): PR<{ bundle: MutableFileStore; isNewlyCreated: boolean }, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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
    )
);
