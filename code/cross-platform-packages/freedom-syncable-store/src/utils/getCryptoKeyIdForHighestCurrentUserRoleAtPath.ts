import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';
import { roleComparator } from 'freedom-syncable-store-types';

import { getNearestFolder } from './get/getNearestFolder.ts';

export const getCryptoKeyIdForHighestCurrentUserRoleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path }: { path: SyncablePath }
  ): PR<{ role: SyncableStoreRole; cryptoKeySetId: CryptoKeySetId }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const privateKeyIds = await store.cryptoService.getPrivateCryptoKeySetIds(trace);
    if (!privateKeyIds.ok) {
      return privateKeyIds;
    }

    // If the current user is the creator, return the creator's key ID
    if (privateKeyIds.value.includes(store.creatorPublicKeys.id)) {
      return makeSuccess({ role: 'creator' as const, cryptoKeySetId: store.creatorPublicKeys.id });
    }

    const nearestFolder = await getNearestFolder(trace, store, path);
    if (!nearestFolder.ok) {
      return nearestFolder;
    }

    const rolesByCryptoKeySetId = await nearestFolder.value.getRolesByCryptoKeySetId(trace, { cryptoKeySetIds: privateKeyIds.value });
    if (!rolesByCryptoKeySetId.ok) {
      return rolesByCryptoKeySetId;
    }

    let bestRole: SyncableStoreRole | undefined;
    let bestCryptoKeySetId: CryptoKeySetId | undefined;
    for (const cryptoKeySetId of privateKeyIds.value) {
      const role = rolesByCryptoKeySetId.value[cryptoKeySetId];
      if (role !== undefined && (bestRole === undefined || roleComparator(role, bestRole) > 0)) {
        bestRole = role;
        bestCryptoKeySetId = cryptoKeySetId;
      }
    }

    if (bestRole === undefined || bestCryptoKeySetId === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `No roles found for ${path.toString()}`, errorCode: 'not-found' }));
    }

    return makeSuccess({ role: bestRole, cryptoKeySetId: bestCryptoKeySetId });
  }
);
