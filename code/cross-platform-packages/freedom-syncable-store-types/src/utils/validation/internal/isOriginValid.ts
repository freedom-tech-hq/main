import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { SignedSyncableOrigin } from 'freedom-sync-types';

import type { SyncableItemAccessor } from '../../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../../types/SyncableStore.ts';
import { rolesWithWriteAccess } from '../../../types/SyncableStoreRole.ts';
import { getFolderPath } from '../../get/getFolderPath.ts';
import { getSyncableAtPath } from '../../get/getSyncableAtPath.ts';
import { getSha256HashForItemProvenance } from '../../getSha256HashForItemProvenance.ts';

export const isOriginValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor, { origin }: { origin: SignedSyncableOrigin }): PR<boolean> => {
    const contentHash = await getSha256HashForItemProvenance(trace, item);
    if (!contentHash.ok) {
      return contentHash;
    }

    if (origin.value.contentHash !== contentHash.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Origin content hash mismatch for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    const metadata = await item.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const signedValueValid = await store.cryptoService.isSignedValueValid(trace, origin, {
      path: item.path,
      type: item.type,
      name: metadata.value.name
    });
    if (!signedValueValid.ok) {
      return signedValueValid;
    } else if (!signedValueValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Signed origin invalid for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    const signingCryptoKeySetId = extractKeyIdFromSignedValue(trace, { signedValue: origin });
    if (!signingCryptoKeySetId.ok) {
      DEV: debugTopic('VALIDATION', (log) =>
        log(`Failed to extract crypto key ID from signed origin for ${item.path.toString()}:`, signingCryptoKeySetId.value)
      );
      return makeSuccess(false);
    }

    const currentUserCryptoKeySetIds = await store.cryptoService.getCryptoKeySetIds(trace);
    if (!currentUserCryptoKeySetIds.ok) {
      return currentUserCryptoKeySetIds;
    }

    // If the origin was signed by the current user, then the current user assumes it's valid.  Otherwise, we'll do additional checks
    if (currentUserCryptoKeySetIds.value.includes(signingCryptoKeySetId.value)) {
      return makeSuccess(true);
    }

    // If the origin was signed by the creator, then it's always valid.  Otherwise, we'll do additional checks
    if (signingCryptoKeySetId.value === store.creatorCryptoKeySetId) {
      return makeSuccess(true);
    }

    const folderPath = await getFolderPath(trace, store, item.path);
    if (!folderPath.ok) {
      return generalizeFailureResult(trace, folderPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const folder = await getSyncableAtPath(trace, store, folderPath.value, 'folder');
    if (!folder.ok) {
      return generalizeFailureResult(trace, folder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const rolesByCryptoKeySetId = await folder.value.getRolesByCryptoKeySetId(trace, { cryptoKeySetIds: [signingCryptoKeySetId.value] });
    if (!rolesByCryptoKeySetId.ok) {
      return rolesByCryptoKeySetId;
    }

    // Making sure the origin user had write access
    const role = rolesByCryptoKeySetId.value[signingCryptoKeySetId.value];
    if (role === undefined || !rolesWithWriteAccess.has(role)) {
      DEV: debugTopic('VALIDATION', (log) => log(`Origin signer doesn't have write access for ${item.path.toString()}:`, role));
      return makeSuccess(false);
    }

    return makeSuccess(true);
  }
);
