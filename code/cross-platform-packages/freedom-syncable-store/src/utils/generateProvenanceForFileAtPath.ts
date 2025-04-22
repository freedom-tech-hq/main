import type { PR, PRFunc } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncableItemName, SyncableItemType, SyncableOriginOptions, SyncablePath, SyncableProvenance } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { generateAcceptanceForPathIfPossible } from './generateAcceptanceForPathIfPossible.ts';
import { generateOriginForFileAtPath } from './generateOriginForFileAtPath.ts';

export const generateProvenanceForFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      path,
      type,
      name,
      getSha256ForItemProvenance,
      trustedTimeSignature
    }: SyncableOriginOptions & {
      path: SyncablePath;
      type: SyncableItemType;
      name: SyncableItemName;
      getSha256ForItemProvenance: PRFunc<Sha256Hash>;
    }
  ): PR<SyncableProvenance> => {
    const origin = await generateOriginForFileAtPath(trace, store, { path, type, name, getSha256ForItemProvenance, trustedTimeSignature });
    if (!origin.ok) {
      return origin;
    }

    // Acceptance is best effort.  It can always be reattempted later.
    const acceptance = await bestEffort(trace, generateAcceptanceForPathIfPossible(trace, store, { path, getSha256ForItemProvenance }));

    return makeSuccess({ origin: origin.value, acceptance });
  }
);
