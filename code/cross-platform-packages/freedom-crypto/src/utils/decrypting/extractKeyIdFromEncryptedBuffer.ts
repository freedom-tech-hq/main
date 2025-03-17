import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo } from 'freedom-crypto-data';

export const extractKeyIdFromEncryptedBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { encryptedValue }: { encryptedValue: Uint8Array }): PR<CryptoKeySetId, 'not-found'> => {
    const dataView = new DataView(encryptedValue.buffer, encryptedValue.byteOffset, encryptedValue.byteLength);

    let offset = 1; // Mode is always the first byte

    const includesKeyId = dataView.getUint8(offset) !== 0;
    offset += 1;
    /* node:coverage disable */
    if (!includesKeyId) {
      return makeFailure(
        new NotFoundError(trace, {
          message: 'The encrypted value does not include key ID information',
          errorCode: 'not-found'
        })
      );
    }
    /* node:coverage enable */

    const keyIdPrefixLength = dataView.getUint32(offset, false);
    offset += 4;

    const extracted = Buffer.from(encryptedValue.subarray(offset, offset + keyIdPrefixLength)).toString('utf-8');
    /* node:coverage disable */
    if (!cryptoKeySetIdInfo.is(extracted)) {
      return makeFailure(
        new NotFoundError(trace, {
          message: 'The encrypted value does not include valid key ID information',
          errorCode: 'not-found'
        })
      );
    }
    /* node:coverage enable */

    return makeSuccess(extracted);
  }
);
