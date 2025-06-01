import { schema } from 'yaschema';

export const mailAddressSchema = schema.object({
  name: schema.string().allowEmptyString().optional(),
  address: schema.string()
});

export type MailAddress = typeof mailAddressSchema.valueType;

export const mailAddressGroupSchema = schema.object({
  groupName: schema.string(),
  addresses: schema.array({ items: mailAddressSchema })
});

export type MailAddressGroup = typeof mailAddressGroupSchema.valueType;

export const mailAddressListSchema = schema.array({
  items: schema.oneOf(mailAddressSchema, mailAddressGroupSchema)
});

export type MailAddressList = typeof mailAddressListSchema.valueType;

export const mailPrioritySchema = schema.string('normal', 'low', 'high');
