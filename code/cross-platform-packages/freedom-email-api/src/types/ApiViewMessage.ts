import { schema } from 'yaschema';

import { apiMessageSchema } from './ApiMessage.ts';

export const apiViewMessageSchema = schema.pick(apiMessageSchema, [
  'id',
  // assumed // userId,
  'transferredAt',
  // assumed // folder,

  // Encrypted
  'listFields',
  'viewFields'

  // Dynamic
  // TODO: 'attachmentsSummary',
]);

export type ApiViewMessage = typeof apiViewMessageSchema.valueType;
