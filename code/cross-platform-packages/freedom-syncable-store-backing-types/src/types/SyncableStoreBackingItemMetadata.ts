import { localItemMetadataSchema, syncableItemMetadataSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

export const syncableStoreBackingItemMetadataSchema = schema.allOf(syncableItemMetadataSchema, schema.partial(localItemMetadataSchema));
export type SyncableStoreBackingItemMetadata = typeof syncableStoreBackingItemMetadataSchema.valueType;
