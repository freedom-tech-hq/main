import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { SignedSyncableOrigin } from 'freedom-sync-types';
import type { ISyncableStoreAccessControlDocument, SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';

export const getRoleForOrigin = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { origin, accessControlDoc }: { origin: SignedSyncableOrigin; accessControlDoc: ISyncableStoreAccessControlDocument }
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
