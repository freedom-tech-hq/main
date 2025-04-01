import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SigningMode, VerifyingKeySet } from 'freedom-crypto-data';
import { algorithmBySigningMode } from 'freedom-crypto-data';

import { signingModesByIntValue } from '../../internal/consts/signing-mode-integers.ts';
import { verify } from '../../internal/utils/verify.ts';

export const isSignatureValidForBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { signature, value, verifyingKeys }: { mode?: SigningMode; signature: Uint8Array; value: Uint8Array; verifyingKeys: VerifyingKeySet }
  ): PR<boolean> => {
    try {
      const signatureDataView = new DataView(signature.buffer, signature.byteOffset, signature.byteLength);

      let offset = 0;

      const modeInt = signatureDataView.getUint8(offset);
      offset += 1;
      const mode = signingModesByIntValue[modeInt];
      if (mode === undefined) {
        return makeSuccess(false);
      }

      const includesKeyId = signatureDataView.getUint8(offset) !== 0;
      offset += 1;

      if (includesKeyId) {
        const keyIdPrefixLength = signatureDataView.getUint32(offset, false);
        offset += 4 + keyIdPrefixLength;
      }

      switch (mode) {
        case 'RSASSA-PKCS1-v1_5/4096/SHA-256': {
          const rawSignature = signature.slice(offset);
          const isValid = await verify(
            verifyingKeys.id,
            algorithmBySigningMode[mode],
            verifyingKeys.forVerifying.rsaPublicKey,
            rawSignature,
            value
          );
          return makeSuccess(isValid);
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
