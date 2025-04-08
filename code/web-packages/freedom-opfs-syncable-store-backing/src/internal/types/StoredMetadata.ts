import { syncableItemMetadataSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

import { opfsLocalItemMetadataSchema } from './OpfsLocalItemMetadata.ts';

export const storedMetadataSchema = schema.allOf(syncableItemMetadataSchema, opfsLocalItemMetadataSchema);
export type StoredMetadata = typeof storedMetadataSchema.valueType;
