import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { createViaSyncPreEncodedBinaryFileAtPath } from '../../internal/utils/sync/createViaSyncPreEncodedBinaryFileAtPath.ts';

export const pushFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    {
      path,
      data,
      metadata
    }: {
      path: SyncablePath;
      data: Uint8Array;
      metadata: SyncableItemMetadata;
    }
  ): PR<undefined, 'not-found'> => {
    const file = await disableLam(trace, 'conflict', (trace) =>
      createViaSyncPreEncodedBinaryFileAtPath(trace, store, path, data, metadata)
    );
    if (!file.ok) {
      // Treating conflicts as ok since this will often be the case when syncing with predicable ids
      if (file.value.errorCode !== 'conflict') {
        return generalizeFailureResult(
          trace,
          excludeFailureResult(file, 'conflict'),
          ['untrusted', 'wrong-type'],
          `Failed to push flat file: ${path.toString()}`
        );
      }
    }

    return makeSuccess(undefined);
  }
);
