import type { PRFunc } from 'freedom-async';
import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from './exports.ts';
import { syncablePathSchema } from './SyncablePath.ts';

export const syncPushArgsSchema = schema.allOf(
  schema.object({ path: syncablePathSchema }),
  schema.oneOf3(
    schema.object({
      type: schema.string('folder'),
      data: schema.undefinedValue().optional(),
      metadata: syncableItemMetadataSchema
    }),
    schema.object({
      type: schema.string('bundle'),
      data: schema.undefinedValue().optional(),
      metadata: syncableItemMetadataSchema
    }),
    schema.object({
      type: schema.string('file'),
      data: uint8ArraySchema,
      metadata: syncableItemMetadataSchema
    })
  )
);
export type SyncPushArgs = typeof syncPushArgsSchema.valueType;

export type SyncPusher = PRFunc<undefined, never, [SyncPushArgs]>;
