import { sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValueSchema, trustedTimeNameInfo } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { syncablePathSchema } from './SyncablePath.ts';

export const syncableAcceptanceSchema = schema.object({ trustedTimeName: trustedTimeNameInfo.schema });
export const syncableAcceptanceSignatureExtrasSchema = schema.object({
  contentHash: sha256HashInfo.schema,
  path: syncablePathSchema
});
export type SyncableAcceptance = typeof syncableAcceptanceSchema.valueType;
export type SyncableAcceptanceSignatureExtras = typeof syncableAcceptanceSignatureExtrasSchema.valueType;

export const signedSyncableAcceptanceSchema = makeSignedValueSchema(syncableAcceptanceSchema, syncableAcceptanceSignatureExtrasSchema);
export type SignedSyncableAcceptance = typeof signedSyncableAcceptanceSchema.valueType;
