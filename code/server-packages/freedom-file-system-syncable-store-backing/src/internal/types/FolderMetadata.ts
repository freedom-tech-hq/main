import { schema } from 'yaschema';

import { fileSystemLocalItemMetadataSchema } from './FileSystemLocalItemMetadata.ts';
import { syncableMetadataBaseSchema } from './SyncableMetadataBase.ts';

export const folderMetadataSchema = schema.allOf3(
  syncableMetadataBaseSchema,
  fileSystemLocalItemMetadataSchema,
  schema.oneOf(
    schema.object({
      type: schema.string('folder'),
      encrypted: schema.boolean(true)
    }),
    schema.object({
      type: schema.string('bundle')
    })
  )
);
