import type { PR, PRFunc } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { OldSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateAcceptanceForPathIfPossible } from './generateAcceptanceForPathIfPossible.ts';
import { generateOriginForFileAtPath } from './generateOriginForFileAtPath.ts';

export const generateProvenanceForFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, getSha256ForItemProvenance }: { path: OldSyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<SyncableProvenance> => {
    const origin = await generateOriginForFileAtPath(trace, store, { path, getSha256ForItemProvenance });
    if (!origin.ok) {
      return origin;
    }

    // Acceptance is best effort.  It can always be reattempted later.
    const acceptance = await bestEffort(trace, generateAcceptanceForPathIfPossible(trace, store, { path, getSha256ForItemProvenance }));

    return makeSuccess({ origin: origin.value, acceptance });
  }
);
