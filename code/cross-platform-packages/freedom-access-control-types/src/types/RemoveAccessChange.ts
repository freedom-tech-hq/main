import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SharedSecret } from './SharedSecret.ts';
import { sharedSecretSchema } from './SharedSecret.ts';

export const makeRemoveAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object<RemoveAccessChangeParams<RoleT>, 'no-infer'>({
    type: schema.string('remove-access'),
    publicKeyId: cryptoKeySetIdInfo.schema,
    newSharedSecret: sharedSecretSchema,
    oldRole: roleSchema
  });
export interface RemoveAccessChangeParams<RoleT extends string> {
  type: 'remove-access';
  publicKeyId: CryptoKeySetId;
  /** A new secret encrypted for each remaining member */
  newSharedSecret: SharedSecret;
  oldRole: RoleT;
}

export const makeRemoveAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  makeRemoveAccessChangeParamsSchema({ roleSchema });
export type RemoveAccessChange<RoleT extends string> = RemoveAccessChangeParams<RoleT>;
