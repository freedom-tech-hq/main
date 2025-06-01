import { schema } from 'yaschema';

import { decryptedViewMessageSchema } from './DecryptedViewMessage.ts';

export const decryptedMessage = schema.allOf(
  decryptedViewMessageSchema,
  schema.object({
    rawMessage: schema.string()
  })
);

export type DecryptedMessage = typeof decryptedMessage.valueType;
