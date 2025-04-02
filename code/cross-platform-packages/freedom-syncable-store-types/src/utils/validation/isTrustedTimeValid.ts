import type { PR } from 'freedom-async';
import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { base64String, type Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignature, isSignatureValidForValue } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';
import type { TrustedTime, TrustedTimeSignatureParams } from 'freedom-trusted-time-source';
import { trustedTimeSignatureParamsSchema } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getTrustedTimeSourcesForPath } from '../getTrustedTimeSourcesForPath.ts';

export const isTrustedTimeValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      timeId,
      trustedTimeSignature,
      parentPath,
      contentHash
    }: TrustedTime & {
      parentPath: SyncablePath;
      contentHash: Sha256Hash;
    }
  ): PR<boolean> => {
    const signingCryptoKeySetId = extractKeyIdFromSignature(trace, { signature: base64String.toBuffer(trustedTimeSignature) });
    if (!signingCryptoKeySetId.ok) {
      return generalizeFailureResult(trace, signingCryptoKeySetId, 'not-found');
    }

    const params: TrustedTimeSignatureParams = {
      timeId,
      parentPath: parentPath.toString(),
      contentHash
    };

    // If the trusted time was signed by the creator, we just need to check that the signature is valid since creators can sign their own
    // trusted times
    if (signingCryptoKeySetId.value === store.creatorCryptoKeySetId) {
      const verifyingKeys = await store.cryptoService.getVerifyingKeySetForId(trace, signingCryptoKeySetId.value);
      if (!verifyingKeys.ok) {
        return generalizeFailureResult(trace, verifyingKeys, 'not-found');
      }

      return await isSignatureValidForValue(trace, {
        signature: trustedTimeSignature,
        value: params,
        valueSchema: trustedTimeSignatureParamsSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined,
        verifyingKeys: verifyingKeys.value
      });
    }

    const trustedTimeSources = await getTrustedTimeSourcesForPath(trace, store, parentPath);
    if (!trustedTimeSources.ok) {
      if (trustedTimeSources.value.errorCode === 'untrusted') {
        return makeSuccess(false);
      }
      return generalizeFailureResult(trace, excludeFailureResult(trustedTimeSources, 'untrusted'), ['deleted', 'not-found', 'wrong-type']);
    }

    const trustedTimeValid = await allResultsMapped(
      trace,
      trustedTimeSources.value,
      {},
      async (trace, trustedTimeSource) => await trustedTimeSource.isTrustedTimeSignatureValid(trace, trustedTimeSignature, params)
    );
    if (!trustedTimeValid.ok) {
      return trustedTimeValid;
    }

    return makeSuccess(trustedTimeValid.value.includes(true));
  }
);
