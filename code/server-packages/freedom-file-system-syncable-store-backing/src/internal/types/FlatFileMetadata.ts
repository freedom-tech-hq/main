import { schema } from 'yaschema';

import { fileSystemLocalItemMetadataSchema } from './FileSystemLocalItemMetadata.ts';
import { syncableMetadataBaseSchema } from './SyncableMetadataBase.ts';

export const flatFileMetadataSchema = schema.allOf3(
  syncableMetadataBaseSchema,
  fileSystemLocalItemMetadataSchema,
  schema.object({
    type: schema.string('flatFile')
  })
);
