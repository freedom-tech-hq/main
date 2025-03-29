import { schema } from 'yaschema';

import { syncableProvenanceSchema } from '../SyncableProvenance.ts';
import { syncableItemNameSchema } from './SyncableItemName.ts';

export const syncableItemMetadataSchema = schema.object({
  name: syncableItemNameSchema,
  provenance: syncableProvenanceSchema
});
export type SyncableItemMetadata = typeof syncableItemMetadataSchema.valueType;
