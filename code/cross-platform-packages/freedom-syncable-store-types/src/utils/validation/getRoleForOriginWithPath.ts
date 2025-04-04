import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { SignedSyncableOrigin, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../../types/SyncableStoreRole.ts';
import { getFolderPath } from '../get/getFolderPath.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const getRoleForOriginWithPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, origin }: { path: SyncablePath; origin: SignedSyncableOrigin }
  ): PR<SyncableStoreRole | undefined, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const signedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: origin });
    if (!signedByKeyId.ok) {
      return signedByKeyId;
    }

    if (signedByKeyId.value === store.creatorPublicKeys.id) {
      return makeSuccess('creator' as const);
    }

    const folderPath = await getFolderPath(trace, store, path);
    if (!folderPath.ok) {
      return folderPath;
    }

    const folder = await getSyncableAtPath(trace, store, folderPath.value, 'folder');
    if (!folder.ok) {
      return folder;
    }

    const rolesByCryptoKeySetId = await folder.value.getRolesByCryptoKeySetId(trace, { cryptoKeySetIds: [signedByKeyId.value] });
    if (!rolesByCryptoKeySetId.ok) {
      return rolesByCryptoKeySetId;
    }

    return makeSuccess(rolesByCryptoKeySetId.value[signedByKeyId.value]);
  }
);
