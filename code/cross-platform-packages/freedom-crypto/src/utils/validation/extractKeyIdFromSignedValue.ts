import type { Result } from 'freedom-async';
import { makeSyncResultFunc } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId, SignedValue } from 'freedom-crypto-data';

import { extractKeyIdFromSignature } from './extractKeyIdFromSignature.ts';

export const extractKeyIdFromSignedValue = makeSyncResultFunc(
  [import.meta.filename],
  <T, SignatureExtrasT>(
    trace: Trace,
    { signedValue }: { signedValue: SignedValue<T, SignatureExtrasT> }
  ): Result<CryptoKeySetId, 'not-found'> => extractKeyIdFromSignature(trace, { signature: base64String.toBuffer(signedValue.signature) })
);
