import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { saltsByIdSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

export const emailCredentialSchema = schema.object({
  userId: emailUserIdInfo.schema,
  privateKeys: privateCombinationCryptoKeySetSchema,
  saltsById: saltsByIdSchema
});
export type EmailCredential = typeof emailCredentialSchema.valueType;
