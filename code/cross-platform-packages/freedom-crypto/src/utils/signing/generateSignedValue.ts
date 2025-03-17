import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SignedValue, SigningKeySet, SigningMode } from 'freedom-crypto-data';
import { makeSignedValue, preferredSigningMode } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

import { generateSignatureForValue } from './generateSignatureForValue.ts';

export const generateSignedValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, SignatureExtrasT = never>(
    trace: Trace,
    {
      mode = preferredSigningMode,
      value,
      valueSchema,
      signatureExtras,
      signatureExtrasSchema,
      signingKeys
    }: {
      mode?: SigningMode;
      value: T;
      valueSchema: Schema<T>;
      signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
      signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
      signingKeys: SigningKeySet;
    }
  ): PR<SignedValue<T, SignatureExtrasT>> => {
    const signature = await generateSignatureForValue(trace, {
      mode,
      value,
      valueSchema,
      signatureExtras,
      signatureExtrasSchema,
      signingKeys
    });
    if (!signature.ok) {
      return signature;
    }

    return makeSuccess(makeSignedValue({ signature: signature.value, value, valueSchema, signatureExtrasSchema }));
  }
);
