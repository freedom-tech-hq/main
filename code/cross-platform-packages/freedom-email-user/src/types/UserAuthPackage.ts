import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { schema } from 'yaschema';

export const userAuthPackageSchema = schema.object({
  userId: emailUserIdInfo.schema,
  privateKeys: privateCombinationCryptoKeySetSchema
});
export type UserAuthPackage = typeof userAuthPackageSchema.valueType;
