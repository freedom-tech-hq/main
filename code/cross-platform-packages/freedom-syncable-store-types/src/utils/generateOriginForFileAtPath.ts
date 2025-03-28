import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OldSyncablePath, SignedSyncableOrigin, SyncablePath } from 'freedom-sync-types';
import { DynamicSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateOrigin } from './generateOrigin.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const generateOriginForFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, getSha256ForItemProvenance }: { path: OldSyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<SignedSyncableOrigin> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    let staticPath: SyncablePath;
    if (path instanceof DynamicSyncablePath) {
      const resolvedPath = await getSyncableAtPath(trace, store, path);
      if (!resolvedPath.ok) {
        return generalizeFailureResult(trace, resolvedPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      staticPath = resolvedPath.value.path;
    } else {
      staticPath = path;
    }

    return await generateOrigin(trace, { path: staticPath, contentHash: contentHash.value, cryptoService: store.cryptoService });
  }
);
