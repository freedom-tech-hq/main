import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import { userDecryptValue } from 'freedom-crypto-service';
import { decryptedListMessagePartSchema, type DecryptedViewMessage, decryptedViewMessagePartSchema } from 'freedom-email-sync';
import type { types } from 'freedom-store-api-server-api';

export const decryptViewMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, message: types.mail.ViewMessage): PR<DecryptedViewMessage> => {
    // Split
    const { listMessage, viewMessage, ...openFields } = message;

    // Decrypt
    const decryptedListPart = await userDecryptValue(trace, {
      schema: decryptedListMessagePartSchema,
      encryptedValue: listMessage,
      userKeys
    });
    if (!decryptedListPart.ok) {
      return decryptedListPart;
    }

    // Decrypt
    const decryptedViewPart = await userDecryptValue(trace, {
      schema: decryptedViewMessagePartSchema,
      encryptedValue: viewMessage,
      userKeys
    });
    if (!decryptedViewPart.ok) {
      return decryptedViewPart;
    }

    // Reconstruct
    return makeSuccess<DecryptedViewMessage>({
      ...openFields,
      ...decryptedListPart.value,
      ...decryptedViewPart.value
    });
  }
);
