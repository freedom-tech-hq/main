import { schema } from 'yaschema';

import { mailAddressSchema } from './MailAddress.ts';

export const mailAddressGroupSchema = schema.object({
  groupName: schema.string(),
  // According to the standard, can be empty
  addresses: schema.array({ items: mailAddressSchema })
});

export type MailAddressGroup = typeof mailAddressGroupSchema.valueType;
