import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo, makeEncryptedValueSchema } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SharedSecretKeys } from './SharedSecretKeys.ts';
import { sharedSecretKeysSchema } from './SharedSecretKeys.ts';

export const makeAddAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object<AddAccessChangeParams<RoleT>, 'no-infer'>({
    type: schema.string('add-access'),
    publicKeyId: cryptoKeySetIdInfo.schema,
    role: roleSchema
  });
export interface AddAccessChangeParams<RoleT extends string> {
  type: 'add-access';
  publicKeyId: CryptoKeySetId;
  role: RoleT;
}

const computedFieldsSchema = schema.object({
  encryptedSecretKeysForNewUserBySharedSecretId: schema.record(cryptoKeySetIdInfo.schema, makeEncryptedValueSchema(sharedSecretKeysSchema))
});
type ComputedFields = typeof computedFieldsSchema.valueType;

export const makeAddAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.extendsObject<AddAccessChangeParams<RoleT>, ComputedFields, 'no-infer', 'infer', 'no-infer'>(
    makeAddAccessChangeParamsSchema({ roleSchema }),
    computedFieldsSchema
  );
export interface AddAccessChange<RoleT extends string> extends AddAccessChangeParams<RoleT> {
  /** All of the current secrets, encrypted for the new user */
  encryptedSecretKeysForNewUserBySharedSecretId: Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>;
}
