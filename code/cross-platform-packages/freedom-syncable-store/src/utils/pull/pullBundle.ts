import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { InSyncBundle, OutOfSyncBundle, SyncableId, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const pullBundle = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    { hash: downstreamHash, path }: { path: SyncablePath; hash?: Sha256Hash }
  ): PR<InSyncBundle | OutOfSyncBundle, 'not-found'> => {
    const bundle = await getSyncableAtPath(trace, store, path, 'bundle');
    if (!bundle.ok) {
      if (bundle.value.errorCode === 'deleted') {
        // Treating deleted as not found
        return makeFailure(new NotFoundError(trace, { cause: bundle.value, errorCode: 'not-found' }));
      }
      return generalizeFailureResult(trace, excludeFailureResult(bundle, 'deleted'), ['untrusted', 'wrong-type']);
    }

    const hash = await bundle.value.getHash(trace);
    if (!hash.ok) {
      return hash;
    }

    if (hash.value === downstreamHash) {
      return makeSuccess({ type: 'bundle', outOfSync: false } satisfies InSyncBundle);
    }

    const metadata = await bundle.value.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const metadataById = await bundle.value.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    const hashesById = objectEntries(metadataById.value).reduce(
      (out, [id, metadata]) => {
        if (metadata === undefined) {
          return out;
        }

        out[id] = metadata.hash;

        return out;
      },
      {} as Partial<Record<SyncableId, Sha256Hash>>
    );

    return makeSuccess({
      type: 'bundle',
      outOfSync: true,
      hashesById,
      metadata: metadata.value
    } satisfies OutOfSyncBundle);
  }
);
