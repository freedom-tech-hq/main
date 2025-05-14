import type { PRFunc } from 'freedom-async';
import { schema } from 'yaschema';

import type { PullItem } from './push-pull/PullItem.ts';
import { pushItemSchema } from './push-pull/PushItem.ts';
import { syncablePathSchema } from './SyncablePath.ts';

export const syncPushArgsSchema = schema.object_noAutoOptional({
  basePath: syncablePathSchema,
  item: pushItemSchema
});
export type SyncPushArgs = typeof syncPushArgsSchema.valueType;

/** @returns the PullItem for the specified `basePath` */
export type SyncPusher = PRFunc<PullItem, 'not-found', [SyncPushArgs]>;
