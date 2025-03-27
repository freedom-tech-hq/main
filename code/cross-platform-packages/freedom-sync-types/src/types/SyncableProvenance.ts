import { schema } from 'yaschema';

import { signedSyncableAcceptanceSchema } from './SyncableAcceptance.ts';
import { signedSyncableOriginSchema } from './SyncableOrigin.ts';

export const syncableProvenanceSchema = schema.object({
  origin: signedSyncableOriginSchema,
  acceptance: signedSyncableAcceptanceSchema.optional()
});
export type SyncableProvenance = typeof syncableProvenanceSchema.valueType;
