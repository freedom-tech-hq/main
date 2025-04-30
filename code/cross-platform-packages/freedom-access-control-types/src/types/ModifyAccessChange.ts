import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo, makeEncryptedValueSchema } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import { sharedKeysSchema } from './SharedKeys.ts';
import { sharedSecretKeysSchema } from './SharedSecretKeys.ts';

export const makeModifyAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object_noAutoOptional<ModifyAccessChangeParams<RoleT>>({
    type: schema.string('modify-access'),
    publicKeyId: cryptoKeySetIdInfo.schema,
    oldRole: roleSchema,
    newRole: roleSchema
  });
export interface ModifyAccessChangeParams<RoleT extends string> {
  type: 'modify-access';
  publicKeyId: CryptoKeySetId;
  oldRole: RoleT;
  newRole: RoleT;
}

const computedFieldsSchema = schema.object({
  /** All of the current secrets, encrypted for the modified user.  This is only used if the user is gaining read access. */
  encryptedSecretKeysForModifiedUserBySharedKeysId: schema
    .record(cryptoKeySetIdInfo.schema, makeEncryptedValueSchema(sharedSecretKeysSchema))
    .optional(),
  /** New shared keys.  This is only used if the user is losing read access. */
  newSharedKeys: sharedKeysSchema.optional()
});
type ComputedFields = typeof computedFieldsSchema.valueType;

export const makeModifyAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.extendsObject_noAutoOptional<ModifyAccessChangeParams<RoleT>, ComputedFields>(
    makeModifyAccessChangeParamsSchema({ roleSchema }),
    computedFieldsSchema
  );
export type ModifyAccessChange<RoleT extends string> = ModifyAccessChangeParams<RoleT> & ComputedFields;
