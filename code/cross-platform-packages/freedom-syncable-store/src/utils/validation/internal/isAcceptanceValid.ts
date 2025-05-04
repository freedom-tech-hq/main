import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue, isSignedValueValid } from 'freedom-crypto';
import type { SignedSyncableAcceptance } from 'freedom-sync-types';
import type { ISyncableStoreAccessControlDocument, SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import { ownerAndAboveRoles } from 'freedom-syncable-store-types';

import { getNearestFolder } from '../../get/getNearestFolder.ts';
import { getSha256HashForItemProvenance } from '../../getSha256HashForItemProvenance.ts';
import { isTrustedTimeValid } from '../isTrustedTimeValid.ts';

export const isAcceptanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    item: SyncableItemAccessor,
    { acceptance, accessControlDoc }: { acceptance: SignedSyncableAcceptance; accessControlDoc: ISyncableStoreAccessControlDocument }
  ): PR<boolean> => {
    const signedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: acceptance });
    if (!signedByKeyId.ok) {
      return generalizeFailureResult(trace, signedByKeyId, 'not-found');
    }

    const signedByPublicKeys = await accessControlDoc.getPublicKeysById(trace, signedByKeyId.value);
    if (!signedByPublicKeys.ok) {
      return generalizeFailureResult(trace, signedByPublicKeys, 'not-found');
    }

    const signedValueValid = await isSignedValueValid(trace, acceptance, undefined, { verifyingKeys: signedByPublicKeys.value });
    if (!signedValueValid.ok) {
      return signedValueValid;
    } else if (!signedValueValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Signed acceptance invalid for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    // If the acceptance was signed by the creator, then it's always valid.  Otherwise, we'll do additional checks
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

    const contentHash = await getSha256HashForItemProvenance(trace, item);
    if (!contentHash.ok) {
      return contentHash;
    }

    const trustedTimeValid = await isTrustedTimeValid(trace, store, {
      ...acceptance.value,
      parentPath: item.path,
      contentHash: contentHash.value
    });
    if (!trustedTimeValid.ok) {
      return trustedTimeValid;
    } else if (!trustedTimeValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Invalid trusted time name for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    const nearestFolder = await getNearestFolder(trace, store, item.path);
    if (!nearestFolder.ok) {
      return generalizeFailureResult(trace, nearestFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const timeMSec = timeIdInfo.extractTimeMSec(acceptance.value.timeId);

    const isValid = await nearestFolder.value.didCryptoKeyHaveRoleAtTimeMSec(trace, {
      cryptoKeySetId: signedByKeyId.value,
      oneOfRoles: ownerAndAboveRoles,
      timeMSec
    });
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      DEV: debugTopic('VALIDATION', (log) =>
        log(`Origin didn't have change accepting access at ${new Date(timeMSec).toString()} for ${item.path.toString()}`)
      );
      return makeSuccess(false);
    }

    return makeSuccess(true);
  }
);
