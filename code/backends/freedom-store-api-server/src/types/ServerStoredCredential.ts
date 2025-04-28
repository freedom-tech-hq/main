import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const serverStoredCredentialSchema = schema.object({
  encryptedCredential: base64String.schema,
  description: schema.string(),
  salt: schema.array(schema.number()),
  iv: schema.array(schema.number())
});

export type ServerStoredCredential = typeof serverStoredCredentialSchema.valueType;