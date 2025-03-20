import { makeSerializedValueSchema } from 'freedom-basic-data';
import { cryptoKeySetIdInfo, makeEncryptedValueSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { sharedPublicKeysSchema } from './SharedPublicKeys.ts';
import { sharedSecretKeysSchema } from './SharedSecretKeys.ts';

export const sharedKeysSchema = schema.object({
  id: cryptoKeySetIdInfo.schema,

  publicKeys: makeSerializedValueSchema(sharedPublicKeysSchema),

  /**
   * The secret keys encrypted for each member with read access.
   *
   * When new members with read access are added, the secret needs to be encrypted again for the new member.
   *
   * When members are removed or when a member loses their read access, the a new secret should be generated and encrypted for the remaining
   * members who have read access.  And, eventually, the old data should be re-encrypted with newer secrets.
   */
  secretKeysEncryptedPerMember: schema.record(cryptoKeySetIdInfo.schema, makeEncryptedValueSchema(sharedSecretKeysSchema))
});
export type SharedKeys = typeof sharedKeysSchema.valueType;
