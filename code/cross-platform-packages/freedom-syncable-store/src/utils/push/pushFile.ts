import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createViaSyncPreEncodedBinaryFileAtPath } from '../via-sync/createViaSyncPreEncodedBinaryFileAtPath.ts';

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
    const file = await createViaSyncPreEncodedBinaryFileAtPath(trace, store, path, data, metadata);
    if (!file.ok) {
      return generalizeFailureResult(trace, file, ['conflict', 'untrusted', 'wrong-type'], `Failed to push flat file: ${path.toString()}`);
    }

    return makeSuccess(undefined);
  }
);
