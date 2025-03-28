import { syncableBundleMetadataSchema, syncableFolderMetadataSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

import { fileSystemLocalItemMetadataSchema } from './FileSystemLocalItemMetadata.ts';

export const folderMetadataSchema = schema.allOf(
  schema.oneOf(syncableFolderMetadataSchema, syncableBundleMetadataSchema),
  fileSystemLocalItemMetadataSchema
);
