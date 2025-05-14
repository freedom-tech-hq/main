import type { Sha256Hash } from 'freedom-basic-data';
import { nonNegativeIntegerSchema, sha256HashInfo, uint8ArraySchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import { syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';
import { syncableIdSchema } from '../SyncableId.ts';

// TODO: shorten since it's used a lot
export const pullInSyncItemSchema = schema.string('in-sync');
export type PullInSyncItem = typeof pullInSyncItemSchema.valueType;

// TODO: shorten keys since they're used a lot
export const pullOutOfSyncFolderLikeItemSchema = schema.object_noAutoOptional<PullOutOfSyncFolderLikeItem>({
  metadata: syncableItemMetadataSchema,
  itemsById: schema.record(
    syncableIdSchema,
    schema.ref((): Schema<PullItem> => pullItemSchema)
  )
});
export interface PullOutOfSyncFolderLikeItem {
  /** The metadata of this item */
  metadata: SyncableItemMetadata;
  /** Information about each sub-item */
  itemsById: Partial<Record<SyncableId, PullItem>>;
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
  /** Included when `sendData` = `true` is sent with the pull request */
  data?: Uint8Array;
  sizeBytes: number;
  metadata: SyncableItemMetadata;
}

export type PullOutOfSyncFileWithData = PullOutOfSyncFile & { data: Uint8Array };

export const pullOutOfSyncItemSchema = schema.oneOf4<Sha256Hash, PullOutOfSyncFolder, PullOutOfSyncFile, PullOutOfSyncBundle>(
  sha256HashInfo.schema,
  pullOutOfSyncFolderSchema,
  pullOutOfSyncFileSchema,
  pullOutOfSyncBundleSchema
);
export type PullOutOfSyncItem = Sha256Hash | PullOutOfSyncFolder | PullOutOfSyncFile | PullOutOfSyncBundle;

export const pullItemSchema = schema.oneOf<PullInSyncItem, PullOutOfSyncItem>(pullInSyncItemSchema, pullOutOfSyncItemSchema);
export type PullItem = PullInSyncItem | PullOutOfSyncItem;
