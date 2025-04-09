import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { InternalSchemaValidationError } from 'freedom-common-errors';

import { passwordEncryptionModesByIntValue } from '../../internal/consts/password-encryption-mode-integers.ts';
import { decrypt } from '../../internal/utils/decrypt.ts';

export const decryptBufferWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { encryptedValue, password }: { encryptedValue: Uint8Array; password: string }): PR<Uint8Array> => {
    try {
      const dataView = new DataView(encryptedValue.buffer, encryptedValue.byteOffset, encryptedValue.byteLength);

      let offset = 0;

      const modeInt = dataView.getUint8(offset);
      offset += 1;
      const mode = passwordEncryptionModesByIntValue[modeInt];
      if (mode === undefined) {
        return makeFailure(
          new InternalSchemaValidationError(trace, {
            message: `Expected mode = ${objectKeys(passwordEncryptionModesByIntValue).join(' | ')}, found: ${modeInt}`
          })
        );
      }

      switch (mode) {
        case 'PBKDF2/SHA-256*650000+AES/256/GCM': {
          const ivLength = dataView.getUint32(offset, false);
          offset += 4;

          const iv = encryptedValue.slice(offset, offset + ivLength);
          offset += ivLength;

          const saltLength = dataView.getUint32(offset, false);
          offset += 4;

          const salt = encryptedValue.slice(offset, offset + saltLength);
          offset += saltLength;

          const encryptedLength = dataView.getUint32(offset, false);
          offset += 4;

          const encrypted = encryptedValue.slice(offset, offset + encryptedLength);
          offset += saltLength;

          // Derive key using PBKDF2
          const keyMaterial = await crypto.subtle.importKey('raw', Buffer.from(password, 'utf-8'), { name: 'PBKDF2' }, false, [
            'deriveKey'
          ]);

          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', iterations: 650000, hash: 'SHA-256', salt },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
          );

          const decrypted = await decrypt({ name: 'AES-GCM', iv }, key, encrypted);

          return makeSuccess(Buffer.from(decrypted));
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
