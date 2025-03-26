import { schema } from 'yaschema';

import { localMetadataSchema } from './LocalMetadata.ts';
import { syncableMetadataBaseSchema } from './SyncableMetadataBase.ts';

export const flatFileMetadataSchema = schema.allOf3(
  syncableMetadataBaseSchema,
  localMetadataSchema,
  schema.object({
    type: schema.string('flatFile')
  })
);
