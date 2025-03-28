import { schema } from 'yaschema';

import { syncableBundleMetadataSchema } from './SyncableBundleMetadata.ts';
import { syncableFileMetadataSchema } from './SyncableFileMetadata.ts';
import { syncableFolderMetadataSchema } from './SyncableFolderMetadata.ts';

export const syncableItemMetadataSchema = schema.oneOf3(
  syncableBundleMetadataSchema,
  syncableFileMetadataSchema,
  syncableFolderMetadataSchema
);
export type SyncableItemMetadata = typeof syncableItemMetadataSchema.valueType;
