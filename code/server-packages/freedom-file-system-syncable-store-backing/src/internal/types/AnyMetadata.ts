import { schema } from 'yaschema';

import { flatFileMetadataSchema } from './FlatFileMetadata.ts';
import { folderMetadataSchema } from './FolderMetadata.ts';

export const anyMetadataSchema = schema.oneOf(flatFileMetadataSchema, folderMetadataSchema);
export type AnyMetadata = typeof anyMetadataSchema.valueType;
