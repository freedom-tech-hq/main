import type { PRFunc } from 'freedom-async';
import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import type { SyncPullResponse } from './pull-responses/SyncPullResponse.ts';
import { syncablePathSchema } from './SyncablePath.ts';
import { syncStrategies } from './SyncStrategy.ts';

export const syncPullArgsSchema = schema.object({
  path: syncablePathSchema,
  hash: sha256HashInfo.schema.optional(),
  /** @defaultValue `false` */
  sendData: schema.boolean().optional(),
  strategy: schema.string(...syncStrategies)
});
export type SyncPullArgs = typeof syncPullArgsSchema.valueType;

// TODO: during pull, if we're the creator, we should try to validate and auto-approve / reject
export type SyncPuller = PRFunc<SyncPullResponse, 'not-found', [SyncPullArgs]>;
