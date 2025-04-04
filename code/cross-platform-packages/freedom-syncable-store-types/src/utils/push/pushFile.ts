import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
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
  ): PR<undefined> => {
    const file = await createViaSyncPreEncodedBinaryFileAtPath(trace, store, path, data, metadata);
    if (!file.ok) {
      if (file.value.errorCode === 'deleted') {
        // Was locally (with respect to the mock remote) deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(
        trace,
        excludeFailureResult(file, 'deleted'),
        ['conflict', 'not-found', 'untrusted', 'wrong-type'],
        `Failed to push flat file: ${path.toString()}`
      );
    }

    return makeSuccess(undefined);
  }
);
