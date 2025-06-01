import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import { userDecryptValue } from 'freedom-crypto-service';
import { type DecryptedThread, decryptedThreadPartSchema } from 'freedom-email-sync';
import type { types } from 'freedom-store-api-server-api';

export const decryptThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, thread: types.mail.Thread): PR<DecryptedThread> => {
    // Split
    const { listFields, ...openFields } = thread;

    // Decrypt
    const decryptedPart = await userDecryptValue(trace, {
      schema: decryptedThreadPartSchema,
      encryptedValue: listFields,
      userKeys
    });
    if (!decryptedPart.ok) {
      return decryptedPart;
    }

    // Reconstruct
    return makeSuccess<DecryptedThread>({
      ...openFields,
      ...decryptedPart.value
    });
  }
);
