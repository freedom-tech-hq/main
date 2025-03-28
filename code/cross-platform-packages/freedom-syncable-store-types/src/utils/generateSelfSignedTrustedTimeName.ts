import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import { makeIsoDateTime } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { signedTimeNameSchema, signedTimeNameSignatureExtrasSchema, timeNameInfo, trustedTimeNameInfo } from 'freedom-crypto-data';

import type { SyncableStore } from '../types/SyncableStore.ts';

export const generateSelfSignedTrustedTimeName = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { pathHash, uuid, contentHash }: { pathHash: Sha256Hash; uuid: Uuid; contentHash: Sha256Hash }) => {
    const signedTimeName = await store.cryptoService.generateSignedValue(trace, {
      value: timeNameInfo.make(`${makeIsoDateTime()}-${uuid}`),
      valueSchema: timeNameInfo.schema,
      signatureExtras: { pathHash, contentHash },
      signatureExtrasSchema: signedTimeNameSignatureExtrasSchema
    });
    if (!signedTimeName.ok) {
      return signedTimeName;
    }

    const serialization = await signedTimeNameSchema.serializeAsync(signedTimeName.value, { validation: 'hard' });
    if (serialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
    }

    return makeSuccess(trustedTimeNameInfo.make(serialization.serialized as string));
  }
);
