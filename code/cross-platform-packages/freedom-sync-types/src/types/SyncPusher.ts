import type { PRFunc } from 'freedom-async';
import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from './exports.ts';
import { syncablePathSchema } from './SyncablePath.ts';
import { syncBatchContentsSchema } from './SyncBatchContents.ts';

const syncPushBaseSchema = schema.object({
  path: syncablePathSchema
});

export const syncPushArgsSchema = schema.oneOf3(
  schema.object({
    ...syncPushBaseSchema.map,
    type: schema.string('folder'),
    data: schema.undefinedValue().optional(),
    metadata: syncableItemMetadataSchema,
    // TODO: temp, make optional
    batchContents: syncBatchContentsSchema
  }),
  schema.object({
    ...syncPushBaseSchema.map,
    type: schema.string('bundle'),
    data: schema.undefinedValue().optional(),
    metadata: syncableItemMetadataSchema,
    // TODO: temp, make optional
    batchContents: syncBatchContentsSchema
  }),
  schema.object({
    ...syncPushBaseSchema.map,
    type: schema.string('file'),
    data: uint8ArraySchema,
    metadata: syncableItemMetadataSchema,
    // TODO: temp, make optional
    batchContents: schema.undefinedValue()
  })
);
export type SyncPushArgs = typeof syncPushArgsSchema.valueType;

export type SyncPusher = PRFunc<undefined, 'not-found', [SyncPushArgs]>;
