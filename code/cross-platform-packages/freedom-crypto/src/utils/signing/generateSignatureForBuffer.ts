import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SigningKeySet, SigningMode } from 'freedom-crypto-data';
import { algorithmBySigningMode, preferredSigningMode } from 'freedom-crypto-data';

import { intValuesBySigningMode } from '../../internal/consts/signing-mode-integers.ts';
import { sign } from '../../internal/utils/sign.ts';

export const generateSignatureForBuffer = makeAsyncResultFunc(
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
    const keyIdPrefix = includeKeyId ? Buffer.from(signingKeys.id, 'utf-8') : undefined;

    try {
      switch (mode) {
        case 'RSASSA-PKCS1-v1_5/4096/SHA-256': {
          const signature = Buffer.from(
            await sign(signingKeys.id, algorithmBySigningMode[mode], signingKeys.forSigning.rsaPrivateKey, value)
          );

          /**
           * Format:
           * - mode: Uint8 - 1 byte (always `0` for 'RSASSA-PKCS1-v1_5/4096/SHA-256')
           * - includeKeyId: Uint8 - 0 for false, any other value for true
           * - If includeKeyId is true:
           *   - keyIdPrefix length (bytes): Uint32 - 4 bytes
           *   - keyIdPrefix: Uint8[] with length = keyIdPrefix length
           * - signature: Uint8[] using remaining length
           */
          const outBuffer = new Uint8Array(1 + 1 + (keyIdPrefix !== undefined ? 4 + keyIdPrefix.byteLength : 0) + signature.byteLength);
          const outDataView = new DataView(outBuffer.buffer, outBuffer.byteOffset, outBuffer.byteLength);

          let offset = 0;

          outDataView.setUint8(offset, intValuesBySigningMode[mode]);
          offset += 1;

          outDataView.setUint8(offset, keyIdPrefix !== undefined ? 1 : 0);
          offset += 1;

          if (keyIdPrefix !== undefined) {
            outDataView.setUint32(offset, keyIdPrefix.byteLength, false);
            offset += 4;

            outBuffer.set(keyIdPrefix, offset);
            offset += keyIdPrefix.byteLength;
          }

          outBuffer.set(signature, offset);
          offset += signature.byteLength;

          return makeSuccess(outBuffer);
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
