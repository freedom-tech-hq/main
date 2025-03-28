import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { SignedSyncableAcceptance } from 'freedom-sync-types';
import { syncableAcceptanceSchema, syncableAcceptanceSignatureExtrasSchema, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { ownerAndAboveRoles } from '../types/SyncableStoreRole.ts';
import { generateTrustedTimeNameForSyncable } from './generateTrustedTimeNameForSyncable.ts';
import { getCryptoKeyIdForHighestCurrentUserRoleAtPath } from './getCryptoKeyIdForHighestCurrentUserRoleAtPath.ts';

export const generateAcceptanceForPathIfPossible = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, getSha256ForItemProvenance }: { path: SyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<SignedSyncableAcceptance | undefined, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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

    const trustedTimeName = await generateTrustedTimeNameForSyncable(trace, store, {
      path,
      uuid: makeUuid(),
      getSha256ForItemProvenance
    });
    if (!trustedTimeName.ok) {
      return trustedTimeName;
    }

    return await store.cryptoService.generateSignedValue(trace, {
      cryptoKeySetId,
      value: { trustedTimeName: trustedTimeName.value },
      valueSchema: syncableAcceptanceSchema,
      signatureExtras: { path, contentHash: contentHash.value },
      signatureExtrasSchema: syncableAcceptanceSignatureExtrasSchema
    });
  }
);
