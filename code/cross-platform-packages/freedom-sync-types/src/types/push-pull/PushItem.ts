import { uint8ArraySchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import { syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';
import { syncableIdSchema } from '../SyncableId.ts';

export const pushFolderLikeItemSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  itemsById: schema
    .record(
      syncableIdSchema,
      schema.ref((): Schema<PushItem> => pushItemSchema)
    )
    .optional()
});
export interface PushFolderLikeItem {
  metadata: SyncableItemMetadata;
  itemsById?: Partial<Record<SyncableId, PushItem>>;
}

export const pushBundleSchema = pushFolderLikeItemSchema;
export type PushBundle = PushFolderLikeItem;

export const pushFileSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  data: uint8ArraySchema
});
export interface PushFile {
  metadata: SyncableItemMetadata;
  data: Uint8Array;
}

export const pushFolderSchema = pushFolderLikeItemSchema;
export type PushFolder = PushFolderLikeItem;

export const pushItemSchema = schema.oneOf3(pushFolderSchema, pushFileSchema, pushBundleSchema);
export type PushItem = PushFolder | PushFile | PushBundle;
