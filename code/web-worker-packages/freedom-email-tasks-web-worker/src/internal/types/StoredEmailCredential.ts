import { base64String } from 'freedom-basic-data';
import { encryptedEmailCredentialSchema } from 'freedom-email-api';
import { schema } from 'yaschema';

export const storedEmailCredentialSchema = schema.object({
  /** Encrypted using a master password */
  encryptedCredential: encryptedEmailCredentialSchema,
  webAuthnCredentialId: base64String.schema.optional(),
  /** The master password encrypted using the webauthn password */
  pwEncryptedForWebAuthn: base64String.schema.optional()
});
export type StoredEmailCredential = typeof storedEmailCredentialSchema.valueType;
