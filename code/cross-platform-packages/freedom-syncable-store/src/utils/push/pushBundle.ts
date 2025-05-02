import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
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
      return generalizeFailureResult(
        trace,
        bundle,
        ['conflict', 'untrusted', 'wrong-type'],
        `Failed to push bundle file: ${path.toString()}`
      );
    }

    return makeSuccess(undefined);
  }
);
