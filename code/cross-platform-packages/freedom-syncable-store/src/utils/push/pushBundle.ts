import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createViaSyncBundleAtPath } from '../via-sync/createViaSyncBundleAtPath.ts';

export const pushBundle = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    {
      path,
      metadata
    }: {
      path: SyncablePath;
      metadata: SyncableItemMetadata;
    }
  ): PR<undefined, 'not-found'> => {
    const bundle = await createViaSyncBundleAtPath(trace, store, path, metadata);
    if (!bundle.ok) {
      if (bundle.value.errorCode === 'deleted') {
        // Was locally (with respect to the mock remote) deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(
        trace,
        excludeFailureResult(bundle, 'deleted'),
        ['conflict', 'untrusted', 'wrong-type'],
        `Failed to push bundle file: ${path.toString()}`
      );
    }

    return makeSuccess(undefined);
  }
);
