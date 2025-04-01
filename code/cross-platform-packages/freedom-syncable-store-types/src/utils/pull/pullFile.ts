import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { InSyncFile, OutOfSyncFile, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const pullFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    { hash: downstreamHash, path, sendData = false }: { path: SyncablePath; hash?: Sha256Hash; sendData?: boolean }
  ): PR<InSyncFile | OutOfSyncFile, 'not-found'> => {
    const file = await getSyncableAtPath(trace, store, path, 'file');
    if (!file.ok) {
      if (file.value.errorCode === 'deleted') {
        // Treating deleted as not found
        return makeFailure(new NotFoundError(trace, { cause: file.value, errorCode: 'not-found' }));
      }
      return generalizeFailureResult(trace, excludeFailureResult(file, 'deleted'), ['untrusted', 'wrong-type']);
    }

    const hash = await file.value.getHash(trace);
    if (!hash.ok) {
      return hash;
    }

    if (hash.value === downstreamHash) {
      return makeSuccess({ type: 'file', outOfSync: false } satisfies InSyncFile);
    }

    // TODO: changing provenance (by accepting or rejecting) should probably trigger a hash change or something

    const metadata = await file.value.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    if (!sendData) {
      return makeSuccess({ type: 'file', outOfSync: true, metadata: metadata.value } satisfies OutOfSyncFile);
    } else {
      const data = await file.value.getEncodedBinary(trace);
      if (!data.ok) {
        return data;
      }

      return makeSuccess({
        type: 'file',
        outOfSync: true,
        data: data.value,
        metadata: metadata.value
      } satisfies OutOfSyncFile);
    }
  }
);
