import { schema } from 'yaschema';

import { syncablePathPatternSchema } from './SyncablePathPattern.ts';

export const syncGlobSchema = schema.object({
  include: schema.array({ items: syncablePathPatternSchema }),
  exclude: schema.array({ items: syncablePathPatternSchema }).optional()
});
export type SyncGlob = typeof syncGlobSchema.valueType;
