import { sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValueSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { syncablePathSchema } from './SyncablePath.ts';

export const syncableOriginSchema = schema.object({
  contentHash: sha256HashInfo.schema
});
export const syncableOriginSignatureExtrasSchema = schema.object({
  path: syncablePathSchema
});
export type SyncableOrigin = typeof syncableOriginSchema.valueType;
export type SyncableOriginSignatureExtras = typeof syncableOriginSignatureExtrasSchema.valueType;

export const signedSyncableOriginSchema = makeSignedValueSchema(syncableOriginSchema, syncableOriginSignatureExtrasSchema);
export type SignedSyncableOrigin = typeof signedSyncableOriginSchema.valueType;
