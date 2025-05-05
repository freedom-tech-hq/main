import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateSignedValue } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { SignedSyncableAcceptance } from 'freedom-sync-types';
import { syncableAcceptanceSchema, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { ownerAndAboveRoles } from 'freedom-syncable-store-types';

import { generateTrustedTimeForSyncableAcceptance } from './generateTrustedTimeForSyncableAcceptance.ts';
import { getCryptoKeyIdForHighestCurrentUserRoleAtPath } from './getCryptoKeyIdForHighestCurrentUserRoleAtPath.ts';

export const generateAcceptanceForPathIfPossible = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, getSha256ForItemProvenance }: { path: SyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<SignedSyncableAcceptance | undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const roleAndCryptoKeySetId = await getCryptoKeyIdForHighestCurrentUserRoleAtPath(trace, store, {
      // Acceptance is relative to the permissions of the parent folder since the item is being added to it
      path: path.parentPath ?? new SyncablePath(path.storageRootId)
    });
    if (!roleAndCryptoKeySetId.ok) {
      return roleAndCryptoKeySetId;
    }

    if (!ownerAndAboveRoles.has(roleAndCryptoKeySetId.value.role)) {
      return makeSuccess(undefined);
    }

    return await internalGenerateAcceptanceForFileAtPathWithKeySet(trace, store, {
      path,
      getSha256ForItemProvenance,
      cryptoKeySetId: roleAndCryptoKeySetId.value.cryptoKeySetId
    });
  }
);

// Helpers

const internalGenerateAcceptanceForFileAtPathWithKeySet = makeAsyncResultFunc(
  [import.meta.filename, 'internalGenerateAcceptanceForFileAtPathWithKeySet'],
  async (
    trace,
    store: SyncableStore,
    {
      path,
      getSha256ForItemProvenance,
      cryptoKeySetId
    }: {
      path: SyncablePath;
      getSha256ForItemProvenance: PRFunc<Sha256Hash>;
      cryptoKeySetId: CryptoKeySetId;
    }
  ): PR<SignedSyncableAcceptance | undefined> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    const trustedTime = await generateTrustedTimeForSyncableAcceptance(trace, store, { path, getSha256ForItemProvenance });
    if (!trustedTime.ok) {
      return trustedTime;
    }

    const privateKeys = await store.userKeys.getPrivateCryptoKeySet(trace, cryptoKeySetId);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    return await generateSignedValue(trace, {
      value: trustedTime.value,
      valueSchema: syncableAcceptanceSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: privateKeys.value
    });
  }
);
