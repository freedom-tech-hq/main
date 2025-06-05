import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo, encryptedEmailCredentialSchema } from 'freedom-email-api';
import { schema } from 'yaschema';

export const dbUserSchema = schema.object({
  email: schema.string(),
  userId: emailUserIdInfo.schema,
  publicKeys: combinationCryptoKeySetSchema,
  encryptedCredential: encryptedEmailCredentialSchema.optional()
});

export type DbUser = typeof dbUserSchema.valueType;
