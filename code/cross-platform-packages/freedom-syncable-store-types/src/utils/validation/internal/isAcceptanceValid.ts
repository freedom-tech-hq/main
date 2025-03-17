import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import { extractPartsFromTrustedTimeId } from 'freedom-crypto-data';
import type { SignedSyncableAcceptance } from 'freedom-sync-types';

import type { SyncableItemAccessor } from '../../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../../types/SyncableStore.ts';
import { ownerAndAboveRoles } from '../../../types/SyncableStoreRole.ts';
import { getFolderPath } from '../../get/getFolderPath.ts';
import { getSyncableAtPath } from '../../get/getSyncableAtPath.ts';
import { getSha256HashForItemProvenance } from '../../getSha256HashForItemProvenance.ts';
import { isTrustedTimeIdValidForPath } from '../isTrustedTimeIdValidForPath.ts';

export const isAcceptanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    item: SyncableItemAccessor,
    { acceptance }: { acceptance: SignedSyncableAcceptance }
  ): PR<boolean> => {
    const contentHash = await getSha256HashForItemProvenance(trace, item);
    if (!contentHash.ok) {
      return contentHash;
    }

    const signedValueValid = await store.cryptoService.isSignedValueValid(trace, acceptance, {
      path: item.path,
      contentHash: contentHash.value
    });
    if (!signedValueValid.ok) {
      return signedValueValid;
    } else if (!signedValueValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Signed acceptance invalid for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    const signingCryptoKeySetId = extractKeyIdFromSignedValue(trace, { signedValue: acceptance });
    if (!signingCryptoKeySetId.ok) {
      DEV: debugTopic('VALIDATION', (log) =>
        log(`Failed to extract crypto key ID from signed acceptance for ${item.path.toString()}:`, signingCryptoKeySetId.value)
      );
      return makeSuccess(false);
    }

    // If the acceptance was signed by the creator, then it's always valid.  Otherwise, we'll do additional checks
    if (signingCryptoKeySetId.value === store.creatorCryptoKeySetId) {
      return makeSuccess(true);
    }

    const trustedTimeValid = await isTrustedTimeIdValidForPath(trace, store, {
      path: item.path,
      trustedTimeId: acceptance.value.trustedTimeId,
      contentHash: contentHash.value
    });
    if (!trustedTimeValid.ok) {
      return generalizeFailureResult(trace, trustedTimeValid, ['deleted', 'not-found', 'wrong-type']);
    } else if (!trustedTimeValid.value) {
      DEV: debugTopic('VALIDATION', (log) => log(`Invalid trusted time ID for ${item.path.toString()}`));
      return makeSuccess(false);
    }

    const acceptanceTrustedTimeIdParts = await extractPartsFromTrustedTimeId(trace, acceptance.value.trustedTimeId);
    if (!acceptanceTrustedTimeIdParts.ok) {
      return acceptanceTrustedTimeIdParts;
    }

    const folderPath = await getFolderPath(trace, store, item.path);
    if (!folderPath.ok) {
      return generalizeFailureResult(trace, folderPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const folder = await getSyncableAtPath(trace, store, folderPath.value, 'folder');
    if (!folder.ok) {
      return generalizeFailureResult(trace, folder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const isValid = await folder.value.didCryptoKeyHaveRoleAtTimeMSec(trace, {
      cryptoKeySetId: signingCryptoKeySetId.value,
      oneOfRoles: ownerAndAboveRoles,
      timeMSec: acceptanceTrustedTimeIdParts.value.timeMSec
    });
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      DEV: debugTopic('VALIDATION', (log) =>
        log(
          `Origin didn't have change accepting access at ${new Date(acceptanceTrustedTimeIdParts.value.timeMSec).toString()} for ${item.path.toString()}`
        )
      );
      return makeSuccess(false);
    }

    return makeSuccess(true);
  }
);
