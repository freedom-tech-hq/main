import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { InSyncFile, OutOfSyncFile, SyncablePath, SyncStrategy } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

// TODO: reenable validation in a smarter way
export const pullFile = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace: Trace,
      store: SyncableStore,
      {
        hash: downstreamHash,
        path,
        sendData = false
      }: { path: SyncablePath; hash?: Sha256Hash; sendData?: boolean; strategy: SyncStrategy }
    ): PR<InSyncFile | OutOfSyncFile, 'not-found'> => {
      const file = await getSyncableAtPath(trace, store, path, 'file');
      if (!file.ok) {
        return generalizeFailureResult(trace, file, ['untrusted', 'wrong-type']);
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
  ),
  { deepDisableLam: 'not-found' }
);
