import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const storedEmailCredentialSchema = schema.object({
  /** Encrypted using a master password */
  encrypted: base64String.schema,
  /** The master password encrypted using the biometrics password */
  pwEncryptedForBiometrics: base64String.schema.optional(),
  description: schema.string()
});
export type StoredEmailCredential = typeof storedEmailCredentialSchema.valueType;
