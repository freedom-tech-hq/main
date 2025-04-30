import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SharedKeys } from './SharedKeys.ts';
import { sharedKeysSchema } from './SharedKeys.ts';

export const makeRemoveAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.object_noAutoOptional<RemoveAccessChangeParams<RoleT>>({
    type: schema.string('remove-access'),
    publicKeyId: cryptoKeySetIdInfo.schema,
    newSharedKeys: sharedKeysSchema,
    oldRole: roleSchema
  });
export interface RemoveAccessChangeParams<RoleT extends string> {
  type: 'remove-access';
  publicKeyId: CryptoKeySetId;
  /** A new secret encrypted for each remaining member */
  newSharedKeys: SharedKeys;
  oldRole: RoleT;
}

export const makeRemoveAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  makeRemoveAccessChangeParamsSchema({ roleSchema });
export type RemoveAccessChange<RoleT extends string> = RemoveAccessChangeParams<RoleT>;
