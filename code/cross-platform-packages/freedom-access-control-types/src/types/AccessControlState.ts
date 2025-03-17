import type { CryptoKeySetId } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

export const makeAccessControlStateSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.record(cryptoKeySetIdInfo.schema, roleSchema);
export type AccessControlState<RoleT extends string> = Partial<Record<CryptoKeySetId, RoleT>>;
