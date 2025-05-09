import type { PRFunc } from 'freedom-async';
import { schema } from 'yaschema';

import { pushContentSchema } from './push-requests/PushContent.ts';
import { syncablePathSchema } from './SyncablePath.ts';

export const syncPushArgsSchema = schema.allOf(
  schema.object({
    basePath: syncablePathSchema
  }),
  pushContentSchema
);
export type SyncPushArgs = typeof syncPushArgsSchema.valueType;

export type SyncPusher = PRFunc<undefined, 'not-found', [SyncPushArgs]>;
