import type { Sha256Hash } from 'freedom-basic-data';
import { sha256HashInfo } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import { syncableItemMetadataSchema } from '../exports.ts';
import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';
import { syncableIdSchema } from '../SyncableId.ts';
import type { OutOfSyncResponse } from './OutOfSyncResponse.ts';
import { outOfSyncResponseSchema } from './OutOfSyncResponse.ts';

export const outOfSyncBundleSchema = schema.object_noAutoOptional<OutOfSyncBundle>({
  outOfSync: schema.boolean(true),
  contentById: schema.record(
    syncableIdSchema,
    schema.oneOf(
      sha256HashInfo.schema,
      schema.ref((): Schema<OutOfSyncResponse> => outOfSyncResponseSchema)
    )
  ),
  metadata: syncableItemMetadataSchema
});
export interface OutOfSyncBundle {
  outOfSync: true;
  contentById: Partial<Record<SyncableId, Sha256Hash | OutOfSyncResponse>>;
  metadata: SyncableItemMetadata;
}
