import { schema } from 'yaschema';

import { syncableItemTypeSchema } from '../SyncableItemType.ts';
import { syncableProvenanceSchema } from '../SyncableProvenance.ts';
import { syncableItemNameSchema } from './SyncableItemName.ts';

export const syncableItemMetadataBaseSchema = schema.object({
  name: syncableItemNameSchema,
  provenance: syncableProvenanceSchema,
  type: syncableItemTypeSchema,
  encrypted: schema.boolean()
});
export type SyncableItemMetadataBase = typeof syncableItemMetadataBaseSchema.valueType;
