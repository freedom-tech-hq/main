import type { Result } from 'freedom-async';
import { makeSyncResultFunc } from 'freedom-async';
import type { CryptoKeySetId } from 'freedom-crypto-data';

import { extractKeyIdFromSignature } from './extractKeyIdFromSignature.ts';

export const extractKeyIdFromSignedBuffer = makeSyncResultFunc(
  [import.meta.filename],
  (trace, { signedBuffer }: { signedBuffer: Uint8Array }): Result<CryptoKeySetId, 'not-found'> => {
    const dataView = new DataView(signedBuffer.buffer, signedBuffer.byteOffset, signedBuffer.byteLength);

    let offset = 0;

    const signatureLength = dataView.getUint32(offset, false);
    offset += 4;

    const signature = signedBuffer.slice(offset, offset + signatureLength);
    offset += signatureLength;

    return extractKeyIdFromSignature(trace, { signature });
  }
);
