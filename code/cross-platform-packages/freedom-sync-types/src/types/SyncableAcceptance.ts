import { sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValueSchema, trustedTimeIdInfo } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { syncablePathSchema } from './StaticSyncablePath.ts';

export const syncableAcceptanceSchema = schema.object({ trustedTimeId: trustedTimeIdInfo.schema });
export const syncableAcceptanceSignatureExtrasSchema = schema.object({
  contentHash: sha256HashInfo.schema,
  path: syncablePathSchema
});
export type SyncableAcceptance = typeof syncableAcceptanceSchema.valueType;
export type SyncableAcceptanceSignatureExtras = typeof syncableAcceptanceSignatureExtrasSchema.valueType;

export const signedSyncableAcceptanceSchema = makeSignedValueSchema(syncableAcceptanceSchema, syncableAcceptanceSignatureExtrasSchema);
export type SignedSyncableAcceptance = typeof signedSyncableAcceptanceSchema.valueType;
