import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo, encryptedEmailCredentialSchema } from 'freedom-email-sync';
import { schema } from 'yaschema';

const userSchema = schema.object({
  email: schema.string(),
  userId: emailUserIdInfo.schema,
  publicKeys: combinationCryptoKeySetSchema,
  defaultSalt: schema.string(),
  encryptedCredential: encryptedEmailCredentialSchema.optional()
});

export type User = typeof userSchema.valueType;
export { userSchema };
