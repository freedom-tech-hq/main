import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { DecryptingKeySet } from 'freedom-crypto-data';
import { asymmetricalAlgorithmByEncryptionMode, symmetricalAlgorithmByEncryptionMode } from 'freedom-crypto-data';

import { encryptionModesByIntValue } from '../../internal/consts/encryption-mode-integers.ts';
import { decrypt } from '../../internal/utils/decrypt.ts';

export const decryptBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { encryptedValue, decryptingKeys }: { encryptedValue: Uint8Array; decryptingKeys: DecryptingKeySet }
  ): PR<Uint8Array> => {
    try {
      const dataView = new DataView(encryptedValue.buffer, encryptedValue.byteOffset, encryptedValue.byteLength);

      let offset = 0;

      const modeInt = dataView.getUint8(offset);
      offset += 1;
      const mode = encryptionModesByIntValue[modeInt];
      if (mode === undefined) {
        return makeFailure(
          new InternalSchemaValidationError(trace, {
            message: `Expected mode = ${objectKeys(encryptionModesByIntValue).join(' | ')}, found: ${modeInt}`
          })
        );
      }

      const includesKeyId = dataView.getUint8(offset) !== 0;
      offset += 1;

      if (includesKeyId) {
        const keyIdPrefixLength = dataView.getUint32(offset, false);
        offset += 4 + keyIdPrefixLength;
      }

      switch (mode) {
        case 'RSA-OAEP/4096/SHA-256+AES/256/GCM': {
          const complexityMode = dataView.getUint8(offset);
          offset += 1;

          if (complexityMode === 1) {
            // Single-stage mode

            /*
             * Format:
             * - mode: Uint8 - 1 byte (always `0` for 'RSA-OAEP/4096/SHA-256+AES/256/GCM')
             * - includeKeyId: Uint8 - 0 for false, any other value for true
             * - If includesKeyId is true:
             *   - keyIdPrefix length (bytes): Uint32 - 4 bytes
             *   - keyIdPrefix: Uint8[] with length = keyIdPrefix length
             * - complexityMode: Uint8 - 1 byte (always `1` for single-stage mode)
             * - encrypted string: Uint8[] using remaining length
             */

            const encryptedString = encryptedValue.slice(offset);

            const decryptedString = await decrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              decryptingKeys.forDecrypting.rsaPrivateKey,
              encryptedString
            );

            return makeSuccess(Buffer.from(decryptedString));
          } else if (complexityMode === 2) {
            // Two-stage mode

            /*
             * Format:
             * - mode: Uint8 - 1 byte (always `0` for 'RSA-OAEP/4096/SHA-256+AES/256/GCM')
             * - includeKeyId: Uint8 - 0 for false, any other value for true
             * - If includesKeyId is true:
             *   - keyIdPrefix length (bytes): Uint32 - 4 bytes
             *   - keyIdPrefix: Uint8[] with length = keyIdPrefix length
             * - complexityMode: Uint8 - 1 byte (always `2` for two-stage mode)
             * - encrypted iv length (bytes): Uint32 - 4 bytes
             * - encrypted iv: Uint8[] with length = encrypted iv length
             * - encrypted AES key length (bytes): Uint32 - 4 bytes
             * - encrypted AES key: Uint8[] with length = encrypted AES key length
             * - encrypted string: Uint8[] using remaining length
             */

            const encryptedIvLength = dataView.getUint32(offset, false);
            offset += 4;

            const encryptedIv = encryptedValue.slice(offset, offset + encryptedIvLength);
            offset += encryptedIvLength;

            const encryptedAesKeyLength = dataView.getUint32(offset, false);
            offset += 4;

            const encryptedAesKey = encryptedValue.slice(offset, offset + encryptedAesKeyLength);
            offset += encryptedAesKeyLength;

            const encryptedString = encryptedValue.slice(offset);

            const decryptedIv = await decrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              decryptingKeys.forDecrypting.rsaPrivateKey,
              encryptedIv
            );

            const decryptedAesKey = await decrypt(
              asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
              decryptingKeys.forDecrypting.rsaPrivateKey,
              encryptedAesKey
            );

            const aesKey = await crypto.subtle.importKey(
              'raw',
              decryptedAesKey,
              symmetricalAlgorithmByEncryptionMode['AES/256/GCM'],
              true,
              ['decrypt']
            );

            const decrypted = await decrypt({ name: 'AES-GCM', iv: decryptedIv }, aesKey, encryptedString);

            return makeSuccess(Buffer.from(decrypted));
          } else {
            return makeFailure(
              new InternalSchemaValidationError(trace, { message: `Expected complexityMode = 1 | 2, found: ${complexityMode}` })
            );
          }
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
