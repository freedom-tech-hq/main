import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue, isSignedValueValid } from 'freedom-crypto';
import { extractUnmarkedSyncableId, type SignedSyncableOrigin } from 'freedom-sync-types';
import type { ISyncableStoreAccessControlDocument, SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import { rolesWithWriteAccess } from 'freedom-syncable-store-types';

import { getSha256HashForItemProvenance } from '../../getSha256HashForItemProvenance.ts';
import { getRoleForOrigin } from '../getRoleForOrigin.ts';
import { isTrustedTimeValid } from '../isTrustedTimeValid.ts';

export const isOriginValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    item: SyncableItemAccessor,
    { origin, accessControlDoc }: { origin: SignedSyncableOrigin; accessControlDoc: ISyncableStoreAccessControlDocument }
  ): PR<boolean> => {
    const contentHash = await getSha256HashForItemProvenance(trace, item);
    if (!contentHash.ok) {
      return contentHash;
    }

    if (origin.value.contentHash !== contentHash.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Origin content hash mismatch for ${item.path.toShortString()}`));
      return makeSuccess(false);
    }

    const metadata = await item.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const signedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: origin });
    if (!signedByKeyId.ok) {
      return generalizeFailureResult(trace, signedByKeyId, 'not-found');
    }

    const signedByPublicKeys = await accessControlDoc.getPublicKeysById(trace, signedByKeyId.value);
    if (!signedByPublicKeys.ok) {
      return generalizeFailureResult(trace, signedByPublicKeys, 'not-found');
    }

    const signedValueValid = await isSignedValueValid(
      trace,
      origin,
      {
        path: item.path,
        type: item.type,
        name: metadata.value.name
      },
      { verifyingKeys: signedByPublicKeys.value }
    );
    if (!signedValueValid.ok) {
      return signedValueValid;
    } else if (!signedValueValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Signed origin invalid for ${item.path.toShortString()}`));
      return makeSuccess(false);
    }

    // If the origin was signed by the creator, then it's always valid.  Otherwise, we'll do additional checks
    if (signedByKeyId.value === store.creatorPublicKeys.id) {
      return makeSuccess(true);
    }

    const privateKeyIds = await store.userKeys.getPrivateCryptoKeySetIds(trace);
    if (!privateKeyIds.ok) {
      return privateKeyIds;
    }

    // If the origin was signed by the current user, then the current user assumes it's valid.  Otherwise, we'll do additional checks
    if (privateKeyIds.value.includes(signedByKeyId.value)) {
      return makeSuccess(true);
    }

    const role = await getRoleForOrigin(trace, store, { origin, accessControlDoc });
    if (!role.ok) {
      return generalizeFailureResult(trace, role, ['not-found', 'untrusted', 'wrong-type']);
    }

    // Making sure the origin user had write access
    if (role.value === undefined || !rolesWithWriteAccess.has(role.value)) {
      DEV: debugTopic('VALIDATION', (log) => log(`Origin signer doesn't have write access for ${item.path.toShortString()}:`, role));
      return makeSuccess(false);
    }

    // If a trusted time signature is present, checking that it's valid
    if (origin.value.trustedTimeSignature !== undefined) {
      const timeId = extractUnmarkedSyncableId(item.path.lastId!);
      if (!timeIdInfo.is(timeId)) {
        DEV: debugTopic('VALIDATION', (log) =>
          log(`Origin has trustedTimeSignature but ${item.path.toShortString()} isn't a TimeId:`, role)
        );
        return makeSuccess(false);
      }
      const isValid = await isTrustedTimeValid(trace, store, {
        timeId,
        trustedTimeSignature: origin.value.trustedTimeSignature,
        parentPath: item.path.parentPath!,
        contentHash: contentHash.value
      });
      if (!isValid.ok) {
        return isValid;
      } else if (!isValid.value) {
        return makeSuccess(false);
      }
    }

    return makeSuccess(true);
  }
);
