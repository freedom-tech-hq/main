import { schema } from 'yaschema';

import { localMetadataSchema } from './LocalMetadata.ts';
import { syncableMetadataBaseSchema } from './SyncableMetadataBase.ts';

export const folderMetadataSchema = schema.allOf3(
  syncableMetadataBaseSchema,
  localMetadataSchema,
  schema.oneOf(
    schema.object({
      type: schema.string('folder'),
      encrypted: schema.boolean(true)
    }),
    schema.object({
      type: schema.string('bundleFile')
    })
  )
);
