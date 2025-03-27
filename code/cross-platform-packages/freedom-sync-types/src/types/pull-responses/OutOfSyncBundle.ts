import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableBundleMetadataSchema } from '../metadata/SyncableBundleMetadata.ts';
import { syncableIdSchema } from '../SyncableId.ts';

export const outOfSyncBundleSchema = schema.object({
  type: schema.string('bundle'),
  outOfSync: schema.boolean(true),
  hashesById: schema.record(syncableIdSchema, sha256HashInfo.schema),
  metadata: syncableBundleMetadataSchema
});
export type OutOfSyncBundle = typeof outOfSyncBundleSchema.valueType;
