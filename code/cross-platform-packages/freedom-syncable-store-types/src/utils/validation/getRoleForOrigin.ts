import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { SignedSyncableOrigin } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { SyncableStoreRole } from '../../types/SyncableStoreRole.ts';

export const getRoleForOrigin = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { origin, accessControlDoc }: { origin: SignedSyncableOrigin; accessControlDoc: SyncableStoreAccessControlDocument }
  ): PR<SyncableStoreRole | undefined, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const signedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: origin });
    if (!signedByKeyId.ok) {
      return signedByKeyId;
    }

    if (signedByKeyId.value === store.creatorPublicKeys.id) {
      return makeSuccess('creator' as const);
    }

    const accessControlState = await accessControlDoc.accessControlState;

    return makeSuccess(accessControlState[signedByKeyId.value]);
  }
);
