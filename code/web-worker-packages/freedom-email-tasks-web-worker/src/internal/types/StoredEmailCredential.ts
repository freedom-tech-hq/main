import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const storedEmailCredentialSchema = schema.object({
  encrypted: base64String.schema,
  description: schema.string()
});
export type StoredEmailCredential = typeof storedEmailCredentialSchema.valueType;
