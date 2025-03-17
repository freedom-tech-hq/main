import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { VerifyingKeySet } from 'freedom-crypto-data';

import { isSignatureValidForBuffer } from './isSignatureValidForBuffer.ts';

export const isSignatureValidForString = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { signature, value, verifyingKeys }: { signature: Base64String; value: string; verifyingKeys: VerifyingKeySet }
  ): PR<boolean> =>
    isSignatureValidForBuffer(trace, {
      signature: base64String.toBuffer(signature),
      value: Buffer.from(value, 'utf-8'),
      verifyingKeys
    })
);
