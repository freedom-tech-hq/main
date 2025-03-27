import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableFileMetadataSchema } from '../metadata/SyncableFileMetadata.ts';

export const outOfSyncFileSchema = schema.object({
  type: schema.string('file'),
  outOfSync: schema.boolean(true),
  data: uint8ArraySchema.optional(),
  metadata: syncableFileMetadataSchema
});
export type OutOfSyncFile = typeof outOfSyncFileSchema.valueType;
