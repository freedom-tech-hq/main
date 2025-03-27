import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableIdSchema } from '../SyncableId.ts';
import { syncableItemMetadataSchema } from '../exports.ts';

export const outOfSyncBundleSchema = schema.object({
  type: schema.string('bundle'),
  outOfSync: schema.boolean(true),
  hashesById: schema.record(syncableIdSchema, sha256HashInfo.schema),
  metadata: syncableItemMetadataSchema
});
export type OutOfSyncBundle = typeof outOfSyncBundleSchema.valueType;
