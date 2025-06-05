import { schema } from 'yaschema';

export const mailAddressSchema = schema.object({
  name: schema.string().allowEmptyString().optional(),
  address: schema.string()
});

export type MailAddress = typeof mailAddressSchema.valueType;
