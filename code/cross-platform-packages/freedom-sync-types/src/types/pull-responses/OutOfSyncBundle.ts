import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from '../exports.ts';
import { syncableIdSchema } from '../SyncableId.ts';
import { syncBatchContentsSchema } from '../SyncBatchContents.ts';

export const outOfSyncBundleSchema = schema.object({
  type: schema.string('bundle'),
  outOfSync: schema.boolean(true),
  hashesById: schema.record(syncableIdSchema, sha256HashInfo.schema),
  metadata: syncableItemMetadataSchema,
  batchContents: syncBatchContentsSchema.optional()
});
export type OutOfSyncBundle = typeof outOfSyncBundleSchema.valueType;
