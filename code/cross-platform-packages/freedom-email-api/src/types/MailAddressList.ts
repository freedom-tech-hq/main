import { schema } from 'yaschema';

import { mailAddressListItemSchema } from './MailAddressListItem.ts';

export const mailAddressListSchema = schema.array({
  items: mailAddressListItemSchema
});

export type MailAddressList = typeof mailAddressListSchema.valueType;
