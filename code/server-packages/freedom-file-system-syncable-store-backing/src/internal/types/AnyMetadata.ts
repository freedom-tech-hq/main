import { schema } from 'yaschema';

import { fileMetadataSchema } from './FileMetadata.ts';
import { folderMetadataSchema } from './FolderMetadata.ts';

export const anyMetadataSchema = schema.oneOf(fileMetadataSchema, folderMetadataSchema);
export type AnyMetadata = typeof anyMetadataSchema.valueType;
