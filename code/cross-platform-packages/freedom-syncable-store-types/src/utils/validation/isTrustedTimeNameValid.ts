import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { TrustedTimeName } from 'freedom-crypto-data';
import { extractSignedTimeNameFromTrustedTimeName } from 'freedom-crypto-data';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../../types/SyncableStore.ts';

export const isTrustedTimeNameValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      trustedTimeName,
      pathHash,
      contentHash,
      trustedTimeSources
    }: {
      trustedTimeName: TrustedTimeName;
      pathHash: Sha256Hash;
      contentHash: Sha256Hash;
      trustedTimeSources: TrustedTimeSource[];
    }
  ): PR<boolean> => {
    const signedTimeName = await extractSignedTimeNameFromTrustedTimeName(trace, trustedTimeName);
    if (!signedTimeName.ok) {
      return signedTimeName;
    }

    const signingCryptoKeySetId = extractKeyIdFromSignedValue(trace, { signedValue: signedTimeName.value });
    if (!signingCryptoKeySetId.ok) {
      return generalizeFailureResult(trace, signingCryptoKeySetId, 'not-found');
    }

    if (signingCryptoKeySetId.value === store.creatorCryptoKeySetId) {
      return await store.cryptoService.isSignedValueValid(trace, signedTimeName.value, { pathHash, contentHash });
    }

    const trustedTimeValid = await allResultsMapped(
      trace,
      trustedTimeSources,
      {},
      async (trace, trustedTimeSource) => await trustedTimeSource.isTrustedTimeNameValid(trace, trustedTimeName, { pathHash, contentHash })
    );
    if (!trustedTimeValid.ok) {
      return trustedTimeValid;
    }

    return makeSuccess(trustedTimeValid.value.includes(true));
  }
);
