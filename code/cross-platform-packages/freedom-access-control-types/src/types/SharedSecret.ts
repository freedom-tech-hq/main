import { cryptoKeySetIdInfo, makeEncryptedValueSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { sharedSecretKeysSchema } from './SharedSecretKeys.ts';

export const sharedSecretSchema = schema.object({
  id: cryptoKeySetIdInfo.schema,

  /**
   * The secret keys encrypted for each member.
   *
   * When new members are added, the secret needs to be encrypted again for the new member.
   *
   * When members are removed, the a new secret should be generated and encrypted for the remaining members.  And, eventually, the old data
   * should be re-encrypted with newer secrets.
   */
  secretKeysEncryptedPerMember: schema.record(cryptoKeySetIdInfo.schema, makeEncryptedValueSchema(sharedSecretKeysSchema))
});
export type SharedSecret = typeof sharedSecretSchema.valueType;
