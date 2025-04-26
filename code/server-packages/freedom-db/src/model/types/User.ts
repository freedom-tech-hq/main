import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { schema } from 'yaschema';

const userSchema = schema.object({
  email: schema.string(),
  userId: emailUserIdInfo.schema,
  publicKeys: combinationCryptoKeySetSchema,
  defaultSalt: schema.string()
});

export type User = typeof userSchema.valueType;
export { userSchema };
