import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SigningKeySet, SigningMode } from 'freedom-crypto-data';
import { preferredSigningMode } from 'freedom-crypto-data';

import { generateSignatureForBuffer } from './generateSignatureForBuffer.ts';

export const generateSignedBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    {
      mode = preferredSigningMode,
      value,
      signingKeys,
      includeKeyId = true
    }: { mode?: SigningMode; value: Uint8Array; signingKeys: SigningKeySet; includeKeyId?: boolean }
  ): PR<Uint8Array> => {
    const signature = await generateSignatureForBuffer(trace, { mode, value, signingKeys, includeKeyId });
    /* node:coverage disable */
    if (!signature.ok) {
      return signature;
    }
    /* node:coverage enable */

    /**
     * Format:
     * - signature length (bytes): Uint32 - 4 bytes
     * - signature: Uint8[] with length = signature length
     * - unsigned value: Uint8[] using remaining length
     */
    const outBuffer = new Uint8Array(4 + signature.value.byteLength + value.byteLength);
    const outDataView = new DataView(outBuffer.buffer, outBuffer.byteOffset, outBuffer.byteLength);

    let offset = 0;

    outDataView.setUint32(offset, signature.value.byteLength, false);
    offset += 4;

    outBuffer.set(signature.value, offset);
    offset += signature.value.byteLength;

    outBuffer.set(value, offset);
    offset += value.byteLength;

    return makeSuccess(outBuffer);
  }
);
