import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { emailUserIdInfo } from './EmailUserId.ts';

export const emailCredentialSchema = schema.object({
  userId: emailUserIdInfo.schema,
  privateKeys: privateCombinationCryptoKeySetSchema
});
export type EmailCredential = typeof emailCredentialSchema.valueType;
