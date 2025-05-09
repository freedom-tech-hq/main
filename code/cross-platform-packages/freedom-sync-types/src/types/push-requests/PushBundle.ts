import { schema } from 'yaschema';

import { type SyncableItemMetadata, syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import type { PushContent } from './PushContent.ts';

export const pushBundleSchema = schema.object({
  metadata: syncableItemMetadataSchema
});
export interface PushBundle {
  metadata: SyncableItemMetadata;
  contentsById?: Partial<Record<string, PushContent>>;
}
