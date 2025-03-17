import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { SigningKeySet, SigningMode } from 'freedom-crypto-data';

import { generateSignatureForBuffer } from './generateSignatureForBuffer.ts';

export const generateSignatureForString = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { mode, value, signingKeys, includeKeyId }: { mode?: SigningMode; value: string; signingKeys: SigningKeySet; includeKeyId?: boolean }
  ): PR<Base64String> => {
    const signature = await generateSignatureForBuffer(trace, { mode, value: Buffer.from(value, 'utf-8'), signingKeys, includeKeyId });
    if (!signature.ok) {
      return signature;
    }

    return makeSuccess(base64String.makeWithBuffer(signature.value));
  }
);
