import { uint8ArraySchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import { syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import { syncableIdSchema } from '../SyncableId.ts';

export const pushBundleSchema = schema.object({
  metadata: syncableItemMetadataSchema
});
export interface PushBundle {
  metadata: SyncableItemMetadata;
  contentsById?: Partial<Record<string, PushContent>>;
}

export const pushFileSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  data: uint8ArraySchema
});
export interface PushFile {
  metadata: SyncableItemMetadata;
  data: Uint8Array;
}

export const pushFolderSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  contentsById: schema
    .record(
      syncableIdSchema,
      schema.ref((): Schema<PushContent> => pushContentSchema)
    )
    .optional()
});
export interface PushFolder {
  metadata: SyncableItemMetadata;
  contentsById?: Partial<Record<string, PushContent>>;
}

export const pushContentSchema = schema.oneOf3(pushFolderSchema, pushFileSchema, pushBundleSchema);
export type PushContent = PushFolder | PushFile | PushBundle;
