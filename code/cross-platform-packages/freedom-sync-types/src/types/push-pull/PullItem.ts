import { nonNegativeIntegerSchema, uint8ArraySchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { LocalItemMetadata } from '../metadata/LocalItemMetadata.ts';
import { localItemMetadataSchema } from '../metadata/LocalItemMetadata.ts';
import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import { syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';
import { syncableIdSchema } from '../SyncableId.ts';

export const pullInSyncItemSchema = schema.string('in-sync');
export type PullInSyncItem = typeof pullInSyncItemSchema.valueType;

export const pullOutOfSyncFolderLikeItemSchema = schema.object_noAutoOptional<PullOutOfSyncFolderLikeItem>({
  metadata: syncableItemMetadataSchema,
  remoteMetadataById: schema.record(syncableIdSchema, localItemMetadataSchema),
  itemsById: schema
    .record(
      syncableIdSchema,
      schema.ref((): Schema<PullOutOfSyncItem> => pullOutOfSyncItemSchema)
    )
    .optional()
});
export interface PullOutOfSyncFolderLikeItem {
  /** The metadata of this item */
  metadata: SyncableItemMetadata;
  /** The local metadata of sub-items, as represented on the remote being pulled from, by their SyncableIds */
  remoteMetadataById: Partial<Record<SyncableId, LocalItemMetadata>>;
  /** When `include` (and possibly `exclude`) is used, the matched sub-items that are out of sync (in sync items aren't included) */
  itemsById?: Partial<Record<SyncableId, PullOutOfSyncItem>>;
}

export const pullOutOfSyncBundleSchema = pullOutOfSyncFolderLikeItemSchema;
export type PullOutOfSyncBundle = PullOutOfSyncFolderLikeItem;

export const pullOutOfSyncFolderSchema = pullOutOfSyncFolderLikeItemSchema;
export type PullOutOfSyncFolder = PullOutOfSyncFolderLikeItem;

export const pullOutOfSyncFileSchema = schema.object_noAutoOptional<PullOutOfSyncFile>({
  data: uint8ArraySchema.optional(),
  sizeBytes: nonNegativeIntegerSchema,
  metadata: syncableItemMetadataSchema
});
export interface PullOutOfSyncFile {
  data?: Uint8Array;
  sizeBytes: number;
  metadata: SyncableItemMetadata;
}

export const pullOutOfSyncItemSchema = schema.oneOf3<PullOutOfSyncFolder, PullOutOfSyncFile, PullOutOfSyncBundle>(
  pullOutOfSyncFolderSchema,
  pullOutOfSyncFileSchema,
  pullOutOfSyncBundleSchema
);
export type PullOutOfSyncItem = PullOutOfSyncFolder | PullOutOfSyncFile | PullOutOfSyncBundle;

export const pullItemSchema = schema.oneOf<PullInSyncItem, PullOutOfSyncItem>(pullInSyncItemSchema, pullOutOfSyncItemSchema);
export type PullItem = PullInSyncItem | PullOutOfSyncItem;
