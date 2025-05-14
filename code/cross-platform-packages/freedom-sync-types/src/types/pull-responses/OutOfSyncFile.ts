import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from '../exports.ts';
import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';

export const outOfSyncFileSchema = schema.object_noAutoOptional<OutOfSyncFile>({
  outOfSync: schema.boolean(true),
  data: uint8ArraySchema.optional(),
  metadata: syncableItemMetadataSchema
});
export interface OutOfSyncFile {
  outOfSync: true;
  data?: Uint8Array;
  metadata: SyncableItemMetadata;
}
