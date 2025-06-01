import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import { userDecryptValue } from 'freedom-crypto-service';

import { listFieldsOfMessageSchema } from '../types/AllFieldsOfMessage.ts';
import type { ApiListMessage } from '../types/ApiListMessage.ts';
import type { DecryptedListMessage } from '../types/DecryptedListMessage.ts';

export const decryptListMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, message: ApiListMessage): PR<DecryptedListMessage> => {
    // Split
    const { listFields, ...openFields } = message;

    // Decrypt
    const decryptedPart = await userDecryptValue(trace, {
      schema: listFieldsOfMessageSchema,
      encryptedValue: listFields,
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
