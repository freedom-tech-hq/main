import { schema } from 'yaschema';

import { apiMessage } from './ApiMessage.ts';

export const apiViewMessageSchema = schema.pick(apiMessage, [
  'id',
  // assumed // userId,
  'transferredAt',
  // assumed // folder,

  // Encrypted
  'listMessage',
  'viewMessage'

  // Dynamic
  // TODO: 'attachmentsSummary',
]);

export type ApiViewMessage = typeof apiViewMessageSchema.valueType;
