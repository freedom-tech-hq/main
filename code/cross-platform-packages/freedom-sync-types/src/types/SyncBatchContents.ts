import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from './metadata/SyncableItemMetadata.ts';
import { syncableIdSchema } from './SyncableId.ts';

export const syncBatchContentsSchema = schema.object({
  folders: schema
    .record(
      syncableIdSchema,
      schema.object({
        data: schema.undefinedValue().optional(),
        metadata: syncableItemMetadataSchema
      })
    )
    .optional(),
  bundles: schema
    .record(
      syncableIdSchema,
      schema.object({
        data: schema.undefinedValue().optional(),
        metadata: syncableItemMetadataSchema
      })
    )
    .optional(),
  files: schema
    .record(
      syncableIdSchema,
      schema.object({
        data: uint8ArraySchema,
        metadata: syncableItemMetadataSchema
      })
    )
    .optional()
});
export type SyncBatchContents = typeof syncBatchContentsSchema.valueType;
