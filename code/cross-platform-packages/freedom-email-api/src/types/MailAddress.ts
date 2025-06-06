import { schema } from 'yaschema';

export const mailAddressSchema = schema.object({
  // TODO: Revise the semantics of '' vs absent. parseEmail() now returns an empty string in all cases
  name: schema.string().allowEmptyString().optional(),
  address: schema.string()
});

export type MailAddress = typeof mailAddressSchema.valueType;
