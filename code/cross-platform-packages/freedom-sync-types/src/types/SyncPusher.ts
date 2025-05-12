import type { PRFunc } from 'freedom-async';
import { schema } from 'yaschema';

import { pushItemSchema } from './push-pull/PushItem.ts';
import { syncablePathSchema } from './SyncablePath.ts';

export const syncPushArgsSchema = schema.object_noAutoOptional({
  basePath: syncablePathSchema,
  item: pushItemSchema
});
export type SyncPushArgs = typeof syncPushArgsSchema.valueType;

export type SyncPusher = PRFunc<undefined, 'not-found', [SyncPushArgs]>;
