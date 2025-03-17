import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

export const makeModifyAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object<ModifyAccessChangeParams<RoleT>, 'no-infer'>({
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

export const makeModifyAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  makeModifyAccessChangeParamsSchema({ roleSchema });
export type ModifyAccessChange<RoleT extends string> = ModifyAccessChangeParams<RoleT>;
