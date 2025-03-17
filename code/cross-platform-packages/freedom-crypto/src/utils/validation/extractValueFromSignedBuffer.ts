import type { Result } from 'freedom-async';
import { makeSuccess, makeSyncResultFunc } from 'freedom-async';

export const extractValueFromSignedBuffer = makeSyncResultFunc(
  [import.meta.filename],
  (_trace, { signedBuffer }: { signedBuffer: Uint8Array }): Result<Uint8Array> => {
    const dataView = new DataView(signedBuffer.buffer, signedBuffer.byteOffset, signedBuffer.byteLength);

    let offset = 0;

    const signatureLength = dataView.getUint32(offset, false);
    offset += 4 + signatureLength;

    const unsignedValue = signedBuffer.slice(offset);

    return makeSuccess(unsignedValue);
  }
);
