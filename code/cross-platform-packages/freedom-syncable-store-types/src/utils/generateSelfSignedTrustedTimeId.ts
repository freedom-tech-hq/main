import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import { makeIsoDateTime } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { signedTimeIdSchema, signedTimeIdSignatureExtrasSchema, timeIdInfo, trustedTimeIdInfo } from 'freedom-crypto-data';

import type { SyncableStore } from '../types/SyncableStore.ts';

export const generateSelfSignedTrustedTimeId = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPathHash, uuid, contentHash }: { parentPathHash: Sha256Hash; uuid: Uuid; contentHash: Sha256Hash }
  ) => {
    const signedTimeId = await store.cryptoService.generateSignedValue(trace, {
      value: timeIdInfo.make(`${makeIsoDateTime()}-${uuid}`),
      valueSchema: timeIdInfo.schema,
      signatureExtras: { parentPathHash, contentHash },
      signatureExtrasSchema: signedTimeIdSignatureExtrasSchema
    });
    if (!signedTimeId.ok) {
      return signedTimeId;
    }

    const serialization = await signedTimeIdSchema.serializeAsync(signedTimeId.value, { validation: 'hard' });
    if (serialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
    }

    return makeSuccess(trustedTimeIdInfo.make(serialization.serialized as string));
  }
);
