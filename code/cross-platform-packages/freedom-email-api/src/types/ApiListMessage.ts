import { schema } from 'yaschema';

import { apiMessage } from './ApiMessage.ts';

export const apiListMessageSchema = schema.pick(apiMessage, [
  'id',
  // assumed // userId,
  'transferredAt',
  // assumed // folder,

  // Encrypted
  'listFields',

  // Dynamic
  'hasAttachments'
]);

export type ApiListMessage = typeof apiListMessageSchema.valueType;
