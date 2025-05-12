import type { PRFunc } from 'freedom-async';
import { schema } from 'yaschema';

import type { PullItem } from './push-pull/PullItem.ts';
import { structHashesSchema } from './StructHashes.ts';
import { syncablePathSchema } from './SyncablePath.ts';
import { syncGlobSchema } from './SyncGlob.ts';

export const syncPullArgsSchema = schema.object({
  basePath: syncablePathSchema,
  /** Hashes for the base path and may include hashes for the relative paths matching any of the specified glob-like patterns as well.  An
   * `undefined` / missing value indicates that the local doesn't have the item. */
  localHashesRelativeToBasePath: structHashesSchema,
  /**
   * If `true` data will be included for out-of-sync files.
   *
   * @defaultValue `false`
   */
  sendData: schema.boolean().optional(),
  /** If specified, any of the matching items will also be pulled, if they're out of sync based on `localHashesRelativeToBasePath` */
  glob: syncGlobSchema.optional()
});
export type SyncPullArgs = typeof syncPullArgsSchema.valueType;

// TODO: during pull, if we're the creator, we should try to validate and auto-approve / reject
export type SyncPuller = PRFunc<PullItem, 'not-found', [SyncPullArgs]>;
