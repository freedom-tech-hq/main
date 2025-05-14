import { schema } from 'yaschema';

import { inSyncResponseSchema } from './InSyncResponse.ts';
import { outOfSyncResponseSchema } from './OutOfSyncResponse.ts';

export const syncPullResponseSchema = schema.oneOf(inSyncResponseSchema, outOfSyncResponseSchema);
export type SyncPullResponse = typeof syncPullResponseSchema.valueType;
