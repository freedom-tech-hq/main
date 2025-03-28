import { schema } from 'yaschema';

import { syncableItemMetadataBaseSchema } from './SyncableItemMetadataBase.ts';

export const syncableBundleMetadataSchema = schema.extendsObject(
  syncableItemMetadataBaseSchema,
  schema.object({
    type: schema.string('bundle')
  })
);
export type SyncableBundleMetadata = typeof syncableBundleMetadataSchema.valueType;
