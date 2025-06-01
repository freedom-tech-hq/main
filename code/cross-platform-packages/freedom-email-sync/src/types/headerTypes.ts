import { schema } from 'yaschema';

export const mailAddressSchema = schema.object({
  name: schema.string().allowEmptyString().optional(),
  address: schema.string()
});

export const mailAddressGroupSchema = schema.object({
  name: schema.string(),
  addresses: schema.array({ items: mailAddressSchema })
});

export const mailAddressListSchema = schema.array({
  items: schema.oneOf(mailAddressSchema, mailAddressGroupSchema)
});

export type MailAddressList = typeof mailAddressListSchema.valueType;

export const mailPrioritySchema = schema.string('normal', 'low', 'high');
