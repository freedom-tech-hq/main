import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';

import { extractKeyIdFromEncryptedString } from './extractKeyIdFromEncryptedString.ts';

export const extractKeyIdFromEncryptedValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, { encryptedValue }: { encryptedValue: EncryptedValue<T> }): PR<CryptoKeySetId, 'not-found'> => {
    const keyId = await extractKeyIdFromEncryptedString(trace, { encryptedValue: encryptedValue.encryptedValue });
    if (!keyId.ok) {
      return keyId;
    }

    return makeSuccess(keyId.value);
  }
);
