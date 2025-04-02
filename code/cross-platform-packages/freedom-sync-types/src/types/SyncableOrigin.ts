import type { Base64String } from 'freedom-basic-data';
import { base64String, sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValueSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { syncableItemNameSchema } from './metadata/SyncableItemName.ts';
import { syncableItemTypeSchema } from './SyncableItemType.ts';
import { syncablePathSchema } from './SyncablePath.ts';

// Forcing type so users have to specify the values even if they're undefined
export const syncableOriginOptionsSchema = schema.object<SyncableOriginOptions, 'no-infer'>({
  /** For use when the `SyncableId` is a `TimeId` that requires trust, ex. with an access control change */
  trustedTimeSignature: base64String.schema.optional()
});
export interface SyncableOriginOptions {
  trustedTimeSignature: Base64String | undefined;
}

export const syncableOriginSchema = schema.extendsObject(
  syncableOriginOptionsSchema,
  schema.object({
    contentHash: sha256HashInfo.schema
  })
);
export const syncableOriginSignatureExtrasSchema = schema.object({
  path: syncablePathSchema,
  type: syncableItemTypeSchema,
  name: syncableItemNameSchema
});
export type SyncableOrigin = typeof syncableOriginSchema.valueType;
export type SyncableOriginSignatureExtras = typeof syncableOriginSignatureExtrasSchema.valueType;

export const signedSyncableOriginSchema = makeSignedValueSchema(syncableOriginSchema, syncableOriginSignatureExtrasSchema);
export type SignedSyncableOrigin = typeof signedSyncableOriginSchema.valueType;
