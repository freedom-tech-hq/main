import { syncableItemMetadataSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

import { fileSystemLocalItemMetadataSchema } from './FileSystemLocalItemMetadata.ts';

export const storedMetadataSchema = schema.allOf(syncableItemMetadataSchema, fileSystemLocalItemMetadataSchema);
export type StoredMetadata = typeof storedMetadataSchema.valueType;
