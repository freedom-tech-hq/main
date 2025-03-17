import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { TrustedTimeId } from 'freedom-crypto-data';
import { extractSignedTimeIdFromTrustedTimeId } from 'freedom-crypto-data';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../../types/SyncableStore.ts';

export const isTrustedTimeIdValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      trustedTimeId,
      parentPathHash,
      contentHash,
      trustedTimeSources
    }: {
      trustedTimeId: TrustedTimeId;
      parentPathHash: Sha256Hash;
      contentHash: Sha256Hash;
      trustedTimeSources: TrustedTimeSource[];
    }
  ): PR<boolean> => {
    const signedTimeId = await extractSignedTimeIdFromTrustedTimeId(trace, trustedTimeId);
    if (!signedTimeId.ok) {
      return signedTimeId;
    }

    const signingCryptoKeySetId = extractKeyIdFromSignedValue(trace, { signedValue: signedTimeId.value });
    if (!signingCryptoKeySetId.ok) {
      return generalizeFailureResult(trace, signingCryptoKeySetId, 'not-found');
    }

    if (signingCryptoKeySetId.value === store.creatorCryptoKeySetId) {
      return store.cryptoService.isSignedValueValid(trace, signedTimeId.value, { parentPathHash, contentHash });
    }

    const trustedTimeValid = await allResultsMapped(trace, trustedTimeSources, {}, async (trace, trustedTimeSource) =>
      trustedTimeSource.isTrustedTimeIdValid(trace, trustedTimeId, { parentPathHash, contentHash })
    );
    if (!trustedTimeValid.ok) {
      return trustedTimeValid;
    }

    return makeSuccess(trustedTimeValid.value.includes(true));
  }
);
