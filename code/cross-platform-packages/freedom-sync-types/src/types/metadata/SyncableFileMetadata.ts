import { schema } from 'yaschema';

import { syncableItemMetadataBaseSchema } from './SyncableItemMetadataBase.ts';

export const syncableFileMetadataSchema = schema.extendsObject(
  syncableItemMetadataBaseSchema,
  schema.object({
    type: schema.string('file')
  })
);
export type SyncableFileMetadata = typeof syncableFileMetadataSchema.valueType;
