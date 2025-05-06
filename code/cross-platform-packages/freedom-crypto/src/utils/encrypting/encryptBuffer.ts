import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { EncryptingKeySet, EncryptionMode } from 'freedom-crypto-data';
import { asymmetricalAlgorithmByEncryptionMode, preferredEncryptionMode } from 'freedom-crypto-data';

import { intValuesByEncryptionMode } from '../../internal/consts/encryption-mode-integers.ts';
import { MAX_RSA_OAEP_4096_PAYLOAD_LENGTH_BYTES } from '../../internal/consts/limits.ts';
import { encrypt } from '../../internal/utils/encrypt.ts';

export const encryptBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    {
      mode = preferredEncryptionMode,
      value,
      encryptingKeys,
      includeKeyId: includeKeyId = true
    }: { mode?: EncryptionMode; value: Uint8Array; encryptingKeys: EncryptingKeySet; includeKeyId?: boolean }
  ): PR<Uint8Array> => {
    const keyIdPrefix = includeKeyId ? Buffer.from(encryptingKeys.id, 'utf-8') : undefined;

    try {
      switch (mode) {
        case 'RSA-OAEP/4096/SHA-256+AES/256/GCM': {
          // Safari doesn't support encrypting 0 bytes with RSA-OAEP/4096/SHA-256 (though Chrome does)
          const singleStageMode = value.byteLength > 0 && value.byteLength <= MAX_RSA_OAEP_4096_PAYLOAD_LENGTH_BYTES;

          if (singleStageMode) {
            // Single stage mode is used for encrypting short messages, using RSA encryption directly

            const encryptedString = await encrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              encryptingKeys.forEncrypting.rsaPublicKey,
              value
            );

            /**
             * Format:
             * - mode: Uint8 - 1 byte (always `0` for 'RSA-OAEP/4096/SHA-256+AES/256/GCM')
             * - includeKeyId: Uint8 - 0 for false, any other value for true
             * - If includeKeyId is true:
             *   - keyIdPrefix length (bytes): Uint32 - 4 bytes
             *   - keyIdPrefix: Uint8[] with length = keyIdPrefix length
             * - complexityMode: Uint8 - 1 byte (always `1` for single-stage mode)
             * - encrypted string: Uint8[] using remaining length
             */
            const outBuffer = new Uint8Array(
              1 + 1 + (keyIdPrefix !== undefined ? 4 + keyIdPrefix.byteLength : 0) + 1 + encryptedString.byteLength
            );
            const outDataView = new DataView(outBuffer.buffer, outBuffer.byteOffset, outBuffer.byteLength);

            let offset = 0;

            outDataView.setUint8(offset, intValuesByEncryptionMode[mode]);
            offset += 1;

            outDataView.setUint8(offset, keyIdPrefix !== undefined ? 1 : 0);
            offset += 1;

            if (keyIdPrefix !== undefined) {
              outDataView.setUint32(offset, keyIdPrefix.byteLength, false);
              offset += 4;

              outBuffer.set(keyIdPrefix, offset);
              offset += keyIdPrefix.byteLength;
            }

            outDataView.setUint8(offset, 1);
            offset += 1;

            outBuffer.set(new Uint8Array(encryptedString), offset);
            offset += encryptedString.byteLength;

            return makeSuccess(outBuffer);
          } else {
            // Two-stage mode is used for longer messages where the actual message body is encrypted with AES

            const iv = await encryptingKeys.forEncrypting.getNextIv();
            const encryptedIv = await encrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              encryptingKeys.forEncrypting.rsaPublicKey,
              iv
            );

            const { raw: rawAesKey, native: aesKey } = await encryptingKeys.forEncrypting.getRawAesKey();

            const encryptedAesKey = await encrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              encryptingKeys.forEncrypting.rsaPublicKey,
              rawAesKey
            );

            const encryptedString = await encrypt({ name: 'AES-GCM', iv }, aesKey, value);

            /**
             * Format:
             * - mode: Uint8 - 1 byte (always `0` for 'RSA-OAEP/4096/SHA-256+AES/256/GCM')
             * - includeKeyId: Uint8 - 0 for false, any other value for true
             * - If includeKeyId is true:
             *   - keyIdPrefix length (bytes): Uint32 - 4 bytes
             *   - keyIdPrefix: Uint8[] with length = keyIdPrefix length
             * - complexityMode: Uint8 - 1 byte (always `2` for two-stage mode)
             * - encrypted iv length (bytes): Uint32 - 4 bytes
             * - encrypted iv: Uint8[] with length = encrypted iv length
             * - encrypted AES key length (bytes): Uint32 - 4 bytes
             * - encrypted AES key: Uint8[] with length = encrypted AES key length
             * - encrypted string: Uint8[] using remaining length
             */
            const outBuffer = new Uint8Array(
              1 +
                1 +
                (keyIdPrefix !== undefined ? 4 + keyIdPrefix.byteLength : 0) +
                1 +
                4 +
                encryptedIv.byteLength +
                4 +
                encryptedAesKey.byteLength +
                encryptedString.byteLength
            );
            const outDataView = new DataView(outBuffer.buffer, outBuffer.byteOffset, outBuffer.byteLength);

            let offset = 0;

            outDataView.setUint8(offset, intValuesByEncryptionMode[mode]);
            offset += 1;

            outDataView.setUint8(offset, keyIdPrefix !== undefined ? 1 : 0);
            offset += 1;

            if (keyIdPrefix !== undefined) {
              outDataView.setUint32(offset, keyIdPrefix.byteLength, false);
              offset += 4;

              outBuffer.set(keyIdPrefix, offset);
              offset += keyIdPrefix.byteLength;
            }

            outDataView.setUint8(offset, 2);
            offset += 1;

            outDataView.setUint32(offset, encryptedIv.byteLength, false);
            offset += 4;

            outBuffer.set(new Uint8Array(encryptedIv), offset);
            offset += encryptedIv.byteLength;

            outDataView.setUint32(offset, encryptedAesKey.byteLength, false);
            offset += 4;

            outBuffer.set(new Uint8Array(encryptedAesKey), offset);
            offset += encryptedAesKey.byteLength;

            outBuffer.set(new Uint8Array(encryptedString), offset);
            offset += encryptedString.byteLength;

            return makeSuccess(outBuffer);
          }
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
