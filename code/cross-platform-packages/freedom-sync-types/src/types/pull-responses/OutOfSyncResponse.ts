import type { Sha256Hash } from 'freedom-basic-data';
import { sha256HashInfo, uint8ArraySchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import { syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';
import { syncableIdSchema } from '../SyncableId.ts';

export const outOfSyncBundleSchema = schema.object_noAutoOptional<OutOfSyncBundle>({
  outOfSync: schema.boolean(true),
  contentById: schema.record(
    syncableIdSchema,
    schema.oneOf(
      sha256HashInfo.schema,
      schema.ref((): Schema<OutOfSyncResponse> => outOfSyncResponseSchema)
    )
  ),
  metadata: syncableItemMetadataSchema
});
export interface OutOfSyncBundle {
  outOfSync: true;
  contentById: Partial<Record<SyncableId, Sha256Hash | OutOfSyncResponse>>;
  metadata: SyncableItemMetadata;
}

export const outOfSyncFileSchema = schema.object_noAutoOptional<OutOfSyncFile>({
  outOfSync: schema.boolean(true),
  data: uint8ArraySchema.optional(),
  metadata: syncableItemMetadataSchema
});
export interface OutOfSyncFile {
  outOfSync: true;
  data?: Uint8Array;
  metadata: SyncableItemMetadata;
}

export const outOfSyncFolderSchema = schema.object_noAutoOptional<OutOfSyncFolder>({
  outOfSync: schema.boolean(true),
  contentById: schema.record(
    syncableIdSchema,
    schema.oneOf(
      sha256HashInfo.schema,
      schema.ref((): Schema<OutOfSyncResponse> => outOfSyncResponseSchema)
    )
  ),
  metadata: syncableItemMetadataSchema
});
export interface OutOfSyncFolder {
  outOfSync: true;
  contentById: Partial<Record<SyncableId, Sha256Hash | OutOfSyncResponse>>;
  metadata: SyncableItemMetadata;
}

export const outOfSyncResponseSchema = schema.oneOf3(outOfSyncFolderSchema, outOfSyncFileSchema, outOfSyncBundleSchema);
export type OutOfSyncResponse = OutOfSyncFolder | OutOfSyncFile | OutOfSyncBundle;
