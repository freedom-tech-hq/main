import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { apiViewMessageSchema } from './ApiViewMessage.ts';

export const apiMessage = schema.allOf(
  apiViewMessageSchema,
  schema.object({
    rawMessage: base64String.schema
  })
);

export type ApiMessage = typeof apiMessage.valueType;
