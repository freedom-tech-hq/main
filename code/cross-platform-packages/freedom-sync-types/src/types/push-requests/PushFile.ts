import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { type SyncableItemMetadata, syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';

export const pushFileSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  data: uint8ArraySchema
});
export interface PushFile {
  metadata: SyncableItemMetadata;
  data: Uint8Array;
}
