import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import { userDecryptValue } from 'freedom-crypto-service';

import type { ApiViewMessage } from '../types/ApiViewMessage.ts';
import { listFieldsOfMessageSchema, viewFieldsOfMessageSchema } from '../types/DecryptedMessage.ts';
import type { DecryptedViewMessage } from '../types/DecryptedViewMessage.ts';

export const decryptViewMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, message: ApiViewMessage): PR<DecryptedViewMessage> => {
    // Split
    const { listFields, viewFields, ...openFields } = message;

    // Decrypt
    const decryptedListPart = await userDecryptValue(trace, {
      schema: listFieldsOfMessageSchema,
      encryptedValue: listFields,
      userKeys
    });
    if (!decryptedListPart.ok) {
      return decryptedListPart;
    }

    // Decrypt
    const decryptedViewPart = await userDecryptValue(trace, {
      schema: viewFieldsOfMessageSchema,
      encryptedValue: viewFields,
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
