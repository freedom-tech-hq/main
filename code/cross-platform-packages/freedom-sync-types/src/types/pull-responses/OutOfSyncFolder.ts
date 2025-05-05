import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from '../exports.ts';
import { syncableIdSchema } from '../SyncableId.ts';
import { syncBatchContentsSchema } from '../SyncBatchContents.ts';

export const outOfSyncFolderSchema = schema.object({
  type: schema.string('folder'),
  outOfSync: schema.boolean(true),
  hashesById: schema.record(syncableIdSchema, sha256HashInfo.schema),
  metadata: syncableItemMetadataSchema,
  batchContents: syncBatchContentsSchema.optional()
});
export type OutOfSyncFolder = typeof outOfSyncFolderSchema.valueType;
