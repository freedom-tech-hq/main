import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { VerifyingKeySet } from 'freedom-crypto-data';

import { isSignatureValidForBuffer } from './isSignatureValidForBuffer.ts';

export const isSignatureValidForSignedBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { signedBuffer, verifyingKeys }: { signedBuffer: Uint8Array; verifyingKeys: VerifyingKeySet }): PR<boolean> => {
    const dataView = new DataView(signedBuffer.buffer, signedBuffer.byteOffset, signedBuffer.byteLength);

    let offset = 0;

    const signatureLength = dataView.getUint32(offset, false);
    offset += 4;

    const signature = signedBuffer.slice(offset, offset + signatureLength);
    offset += signatureLength;

    const unsignedValue = signedBuffer.slice(offset);

    return isSignatureValidForBuffer(trace, { signature, value: unsignedValue, verifyingKeys });
  }
);
