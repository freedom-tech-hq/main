import { syncablePathSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

export const syncableStoreChangeSchema = schema.object({
  type: schema.string('delete'),
  paths: schema.array({ items: syncablePathSchema })
});
export type SyncableStoreChange = typeof syncableStoreChangeSchema.valueType;
