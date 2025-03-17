import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SignedValue, VerifyingKeySet } from 'freedom-crypto-data';

import { isSignatureValidForValue } from './isSignatureValidForValue.ts';

export const isSignedValueValid = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, SignatureExtrasT>(
    trace: Trace,
    signedValue: SignedValue<T, SignatureExtrasT>,
    signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>,
    { verifyingKeys }: { verifyingKeys: VerifyingKeySet }
  ): PR<boolean> =>
    isSignatureValidForValue<T, SignatureExtrasT>(trace, {
      signature: signedValue.signature,
      value: signedValue.value,
      valueSchema: signedValue.valueSchema,
      signatureExtras,
      signatureExtrasSchema: signedValue.signatureExtrasSchema,
      verifyingKeys
    })
);
