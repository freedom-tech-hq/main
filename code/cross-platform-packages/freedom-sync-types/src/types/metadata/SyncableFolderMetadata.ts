import { schema } from 'yaschema';

import { syncableItemMetadataBaseSchema } from './SyncableItemMetadataBase.ts';

export const syncableFolderMetadataSchema = schema.extendsObject(
  syncableItemMetadataBaseSchema,
  schema.object({
    type: schema.string('folder'),
    encrypted: schema.boolean(true)
  })
);
export type SyncableFolderMetadata = typeof syncableFolderMetadataSchema.valueType;
