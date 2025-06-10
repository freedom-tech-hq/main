import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { encryptValue } from 'freedom-crypto';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';

import type { ApiInputMessage } from '../types/ApiInputMessage.ts';
import type { DecryptedInputMessage } from '../types/DecryptedInputMessage.ts';
import { listFieldsOfMessageSchema, viewFieldsOfMessageSchema } from '../types/MailMessage.ts';

export const encryptInputMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, publicKeys: CombinationCryptoKeySet, mail: DecryptedInputMessage): PR<ApiInputMessage> => {
    // listFields
    const listFieldsResult = await encryptValue(trace, {
      valueSchema: listFieldsOfMessageSchema,
      value: mail, // Schema picks relevant fields
      encryptingKeys: publicKeys
    });
    if (!listFieldsResult.ok) {
      return listFieldsResult;
    }

    // viewFields
    const viewFieldsResult = await encryptValue(trace, {
      valueSchema: viewFieldsOfMessageSchema,
      value: mail, // Schema picks relevant fields
      encryptingKeys: publicKeys
    });
    if (!viewFieldsResult.ok) {
      return viewFieldsResult;
    }

    return makeSuccess<ApiInputMessage>({
      // server-controlled:
      // 'id'
      // 'userId'
      // 'updatedAt'
      // 'folder' - always 'drafts' for user and 'inbox' for MailAgent
      // 'messageId' - auto on server to <id@domain>
      inReplyTo: mail.inReplyTo,
      listFields: listFieldsResult.value,
      viewFields: viewFieldsResult.value
    });
  }
);
