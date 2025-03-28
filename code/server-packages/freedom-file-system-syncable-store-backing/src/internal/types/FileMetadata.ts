import { syncableFileMetadataSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

import { fileSystemLocalItemMetadataSchema } from './FileSystemLocalItemMetadata.ts';

export const fileMetadataSchema = schema.allOf(syncableFileMetadataSchema, fileSystemLocalItemMetadataSchema);
