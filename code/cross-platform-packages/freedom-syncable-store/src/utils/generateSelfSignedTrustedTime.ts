import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateSignatureForValue } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { type TrustedTime, trustedTimeSignatureParamsSchema } from 'freedom-trusted-time-source';

export const generateSelfSignedTrustedTime = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPath, contentHash }: { parentPath: SyncablePath; contentHash: Sha256Hash }
  ): PR<TrustedTime> => {
    const timeId = timeIdInfo.make();

    const privateKeys = await store.userKeys.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    const trustedTimeSignature = await generateSignatureForValue(trace, {
      value: { timeId, parentPath: parentPath.toString(), contentHash },
      valueSchema: trustedTimeSignatureParamsSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: privateKeys.value
    });
    if (!trustedTimeSignature.ok) {
      return trustedTimeSignature;
    }

    return makeSuccess({ timeId, trustedTimeSignature: trustedTimeSignature.value });
  }
);
