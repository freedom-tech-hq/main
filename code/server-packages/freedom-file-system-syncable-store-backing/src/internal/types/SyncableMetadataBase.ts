import { syncableItemTypeSchema, syncableProvenanceSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

export const syncableMetadataBaseSchema = schema.object({
  provenance: syncableProvenanceSchema,
  type: syncableItemTypeSchema,
  encrypted: schema.boolean()
});
