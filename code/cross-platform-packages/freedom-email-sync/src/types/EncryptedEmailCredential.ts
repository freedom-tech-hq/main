import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const encryptedEmailCredentialSchema = schema.object({
  email: schema.string(),
  encrypted: base64String.schema
});
export type EncryptedEmailCredential = typeof encryptedEmailCredentialSchema.valueType;
