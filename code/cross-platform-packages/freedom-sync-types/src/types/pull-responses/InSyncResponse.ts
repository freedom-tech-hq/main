import { schema } from 'yaschema';

export const inSyncResponseSchema = schema.object({ outOfSync: schema.boolean(false) });
export type InSyncResponse = typeof inSyncResponseSchema.valueType;
