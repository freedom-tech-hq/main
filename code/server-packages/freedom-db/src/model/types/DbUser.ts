import { base64String } from 'freedom-basic-data';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { schema } from 'yaschema';

export const dbUserSchema = schema.object({
  email: schema.string(),
  userId: emailUserIdInfo.schema,
  publicKeys: combinationCryptoKeySetSchema,
  defaultSalt: schema.string(),
  encryptedCredentials: base64String.schema.optional()
});

export type DbUser = typeof dbUserSchema.valueType;
