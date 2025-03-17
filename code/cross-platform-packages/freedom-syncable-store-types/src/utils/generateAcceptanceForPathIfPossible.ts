import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { SignedSyncableAcceptance, SyncablePath } from 'freedom-sync-types';
import {
  DynamicSyncablePath,
  StaticSyncablePath,
  syncableAcceptanceSchema,
  syncableAcceptanceSignatureExtrasSchema
} from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { ownerAndAboveRoles } from '../types/SyncableStoreRole.ts';
import { generateTrustedTimeIdForSyncable } from './generateTrustedTimeIdForSyncable.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';
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
      path: path.parentPath ?? new StaticSyncablePath(path.storageRootId)
    });
    if (!roleAndCryptoKeySetId.ok) {
      return roleAndCryptoKeySetId;
    }

    if (!ownerAndAboveRoles.has(roleAndCryptoKeySetId.value.role)) {
      return makeSuccess(undefined);
    }

    let staticPath: StaticSyncablePath;
    if (path instanceof DynamicSyncablePath) {
      const resolvedPath = await getSyncableAtPath(trace, store, path);
      if (!resolvedPath.ok) {
        return resolvedPath;
      }

      staticPath = resolvedPath.value.path;
    } else {
      staticPath = path;
    }

    return internalGenerateAcceptanceForFileAtPathWithKeySet(trace, store, {
      path: staticPath,
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

    const trustedTimeId = await generateTrustedTimeIdForSyncable(trace, store, {
      parentPath: path.parentPath ?? new StaticSyncablePath(path.storageRootId),
      uuid: makeUuid(),
      getSha256ForItemProvenance
    });
    if (!trustedTimeId.ok) {
      return trustedTimeId;
    }

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

    return store.cryptoService.generateSignedValue(trace, {
      cryptoKeySetId,
      value: { trustedTimeId: trustedTimeId.value },
      valueSchema: syncableAcceptanceSchema,
      signatureExtras: { path: staticPath, contentHash: contentHash.value },
      signatureExtrasSchema: syncableAcceptanceSignatureExtrasSchema
    });
  }
);
