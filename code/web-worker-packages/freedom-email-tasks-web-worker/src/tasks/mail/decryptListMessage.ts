import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import { userDecryptValue } from 'freedom-crypto-service';
import { type DecryptedListMessage, decryptedListMessagePartSchema } from 'freedom-email-sync';
import type { types } from 'freedom-store-api-server-api';

export const decryptListMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, message: types.mail.ListMessage): PR<DecryptedListMessage> => {
    // Split
    const { listMessage, ...openFields } = message;

    // Decrypt
    const decryptedPart = await userDecryptValue(trace, {
      schema: decryptedListMessagePartSchema,
      encryptedValue: listMessage,
      userKeys
    });
    if (!decryptedPart.ok) {
      return decryptedPart;
    }

    // Reconstruct
    return makeSuccess<DecryptedListMessage>({
      ...openFields,
      ...decryptedPart.value
    });
  }
);
