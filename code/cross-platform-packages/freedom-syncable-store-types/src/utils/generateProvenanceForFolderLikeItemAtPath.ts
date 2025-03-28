import type { PR } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateSha256HashForEmptyString } from 'freedom-crypto';
import type { OldSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateAcceptanceForPathIfPossible } from './generateAcceptanceForPathIfPossible.ts';
import { generateOriginForFolderLikeItemAtPath } from './generateOriginForFolderLikeItemAtPath.ts';

export const generateProvenanceForFolderLikeItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { path }: { path: OldSyncablePath }): PR<SyncableProvenance> => {
    const origin = await generateOriginForFolderLikeItemAtPath(trace, store, { path });
    if (!origin.ok) {
      return origin;
    }

    // Acceptance is best effort.  It can always be reattempted later.
    const acceptance = await bestEffort(
      trace,
      generateAcceptanceForPathIfPossible(trace, store, {
        path,
        getSha256ForItemProvenance: generateSha256HashForEmptyString
      })
    );

    return makeSuccess({ origin: origin.value, acceptance });
  }
);
