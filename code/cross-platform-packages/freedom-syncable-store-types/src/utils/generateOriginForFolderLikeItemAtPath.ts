import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SignedSyncableOrigin, StaticSyncablePath, SyncablePath } from 'freedom-sync-types';
import { DynamicSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateOrigin } from './generateOrigin.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const generateOriginForFolderLikeItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { path }: { path: SyncablePath }): PR<SignedSyncableOrigin> => {
    let staticPath: StaticSyncablePath;
    if (path instanceof DynamicSyncablePath) {
      const resolvedPath = await getSyncableAtPath(trace, store, path);
      if (!resolvedPath.ok) {
        return generalizeFailureResult(trace, resolvedPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      staticPath = resolvedPath.value.path;
    } else {
      staticPath = path;
    }

    return await generateOrigin(trace, { path: staticPath, contentHash: undefined, cryptoService: store.cryptoService });
  }
);
