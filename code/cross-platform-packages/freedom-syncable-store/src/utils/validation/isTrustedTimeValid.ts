import type { PR } from 'freedom-async';
import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { base64String, type Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignature, isSignatureValidForValue } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { TrustedTime, TrustedTimeSignatureParams } from 'freedom-trusted-time-source';
import { trustedTimeSignatureParamsSchema } from 'freedom-trusted-time-source';

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
    const signedByKeyId = extractKeyIdFromSignature(trace, { signature: base64String.toBuffer(trustedTimeSignature) });
    if (!signedByKeyId.ok) {
      return generalizeFailureResult(trace, signedByKeyId, 'not-found');
    }

    const params: TrustedTimeSignatureParams = {
      timeId,
      parentPath: parentPath.toString(),
      contentHash
    };

    // If the trusted time was signed by the creator, we just need to check that the signature is valid since creators can sign their own
    // trusted times
    if (signedByKeyId.value === store.creatorPublicKeys.id) {
      return await isSignatureValidForValue(trace, {
        signature: trustedTimeSignature,
        value: params,
        valueSchema: trustedTimeSignatureParamsSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined,
        verifyingKeys: store.creatorPublicKeys
      });
    }

    const trustedTimeSources = await disableLam(trace, 'untrusted', (trace) => getTrustedTimeSourcesForPath(trace, store, parentPath));
    if (!trustedTimeSources.ok) {
      if (trustedTimeSources.value.errorCode === 'untrusted') {
        return makeSuccess(false);
      }
      return generalizeFailureResult(trace, excludeFailureResult(trustedTimeSources, 'untrusted'), ['not-found', 'wrong-type']);
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
