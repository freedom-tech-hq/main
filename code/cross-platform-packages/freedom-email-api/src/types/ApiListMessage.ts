import { schema } from 'yaschema';

import { apiMessageSchema } from './ApiMessage.ts';

export const apiListMessageSchema = schema.pick(apiMessageSchema, [
  'id',
  // assumed // userId,
  'updatedAt',
  // assumed // folder,

  // Encrypted
  'listFields',

  // Dynamic
  'hasAttachments'
]);

export type ApiListMessage = typeof apiListMessageSchema.valueType;
