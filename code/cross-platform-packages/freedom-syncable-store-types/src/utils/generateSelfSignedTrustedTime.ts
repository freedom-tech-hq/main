import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { makeIsoDateTime, timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { generateSignatureForValue } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';
import { type TrustedTime, trustedTimeSignatureParamsSchema } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../types/SyncableStore.ts';

export const generateSelfSignedTrustedTime = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPath, contentHash }: { parentPath: SyncablePath; contentHash: Sha256Hash }
  ): PR<TrustedTime> => {
    const timeId = timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`);

    const signingKeys = await store.cryptoService.getSigningKeySet(trace);
    if (!signingKeys.ok) {
      return generalizeFailureResult(trace, signingKeys, 'not-found');
    }

    const trustedTimeSignature = await generateSignatureForValue(trace, {
      value: { timeId, parentPath: parentPath.toString(), contentHash },
      valueSchema: trustedTimeSignatureParamsSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: signingKeys.value
    });
    if (!trustedTimeSignature.ok) {
      return trustedTimeSignature;
    }

    return makeSuccess({ timeId, trustedTimeSignature: trustedTimeSignature.value });
  }
);
