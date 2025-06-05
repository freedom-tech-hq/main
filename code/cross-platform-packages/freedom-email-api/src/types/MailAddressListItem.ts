import { schema } from 'yaschema';

import { mailAddressSchema } from './MailAddress.ts';
import { mailAddressGroupSchema } from './MailAddressGroup.ts';

export const mailAddressListItemSchema = schema.oneOf(mailAddressSchema, mailAddressGroupSchema);
export type MailAddressListItem = typeof mailAddressListItemSchema.valueType;
