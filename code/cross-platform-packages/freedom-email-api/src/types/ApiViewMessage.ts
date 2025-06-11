import { schema } from 'yaschema';

import { apiMessageSchema } from './ApiMessage.ts';

export const apiViewMessageSchema = schema.pick(apiMessageSchema, [
  'id',
  // assumed // userId,
  'updatedAt',
  // assumed // folder,
  'messageId',

  // Encrypted
  'listFields',
  'viewFields'

  // Dynamic
  // TODO: 'attachmentsSummary',
]);

export type ApiViewMessage = typeof apiViewMessageSchema.valueType;
