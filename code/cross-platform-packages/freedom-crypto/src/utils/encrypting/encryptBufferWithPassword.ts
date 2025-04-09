import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { PasswordEncryptionMode } from 'freedom-crypto-data';
import { preferredPasswordEncryptionMode } from 'freedom-crypto-data';

import { intValuesByPasswordEncryptionMode } from '../../internal/consts/password-encryption-mode-integers.ts';
import { encrypt } from '../../internal/utils/encrypt.ts';

export const encryptBufferWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { mode = preferredPasswordEncryptionMode, buffer, password }: { mode?: PasswordEncryptionMode; buffer: Uint8Array; password: string }
  ): PR<Uint8Array> => {
    try {
      switch (mode) {
        case 'PBKDF2/SHA-256*650000+AES/256/GCM': {
          // Generate salt and IV
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const iv = crypto.getRandomValues(new Uint8Array(12));

          // Derive key using PBKDF2
          const keyMaterial = await crypto.subtle.importKey('raw', Buffer.from(password, 'utf-8'), { name: 'PBKDF2' }, false, [
            'deriveKey'
          ]);

          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', iterations: 650000, hash: 'SHA-256', salt },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
          );

          // Encrypt
          const encrypted = await encrypt({ name: 'AES-GCM', iv }, key, buffer);

          /**
           * Format:
           * - mode: Uint8 - 1 byte (always `0` for 'PBKDF2/SHA-256*650000+AES/256/GCM')
           * - iv length: Uint32 - 4 bytes
           * - iv: Uint8[] with length = iv length
           * - salt length: Uint32 - 4 bytes
           * - salt: Uint8[] with length = salt length
           * - encrypted string length: Uint32 - 4 bytes
           * - encrypted string: Uint8[] with length = encrypted string length
           */
          const outBuffer = new Uint8Array(1 + 4 + iv.byteLength + 4 + salt.byteLength + 4 + encrypted.byteLength);
          const outDataView = new DataView(outBuffer.buffer, outBuffer.byteOffset, outBuffer.byteLength);

          let offset = 0;

          outDataView.setUint8(offset, intValuesByPasswordEncryptionMode[mode]);
          offset += 1;

          outDataView.setUint32(offset, iv.byteLength, false);
          offset += 4;

          outBuffer.set(iv, offset);
          offset += iv.byteLength;

          outDataView.setUint32(offset, salt.byteLength, false);
          offset += 4;

          outBuffer.set(salt, offset);
          offset += salt.byteLength;

          outDataView.setUint32(offset, encrypted.byteLength, false);
          offset += 4;

          outBuffer.set(new Uint8Array(encrypted), offset);
          offset += encrypted.byteLength;

          return makeSuccess(outBuffer);
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
