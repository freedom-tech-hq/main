import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { combinationCryptoKeySetSchema, cryptoKeySetIdInfo, makeEncryptedValueSchema } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import { sharedSecretKeysSchema } from './SharedSecretKeys.ts';

export const makeAddAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object<AddAccessChangeParams<RoleT>, 'no-infer'>({
    type: schema.string('add-access'),
    publicKeys: combinationCryptoKeySetSchema,
    role: roleSchema
  });
export interface AddAccessChangeParams<RoleT extends string> {
  type: 'add-access';
  publicKeys: CombinationCryptoKeySet;
  role: RoleT;
}

const computedFieldsSchema = schema.object({
  /** All of the current secrets, encrypted for the new user */
  encryptedSecretKeysForNewUserBySharedKeysId: schema.record(cryptoKeySetIdInfo.schema, makeEncryptedValueSchema(sharedSecretKeysSchema))
});
type ComputedFields = typeof computedFieldsSchema.valueType;

export const makeAddAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.extendsObject<AddAccessChangeParams<RoleT>, ComputedFields, 'no-infer', 'infer', 'no-infer'>(
    makeAddAccessChangeParamsSchema({ roleSchema }),
    computedFieldsSchema
  );
export type AddAccessChange<RoleT extends string> = AddAccessChangeParams<RoleT> & ComputedFields;
