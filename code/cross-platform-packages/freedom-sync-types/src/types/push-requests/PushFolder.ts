import { type Schema, schema } from 'yaschema';

import { type SyncableItemMetadata, syncableItemMetadataSchema } from '../metadata/SyncableItemMetadata.ts';
import { syncableIdSchema } from '../SyncableId.ts';
import type { PushContent } from './PushContent.ts';
import { pushContentSchema } from './PushContent.ts';

export const pushFolderSchema = schema.object({
  metadata: syncableItemMetadataSchema,
  contentsById: schema
    .record(
      syncableIdSchema,
      schema.ref((): Schema<PushContent> => pushContentSchema)
    )
    .optional()
});
export interface PushFolder {
  metadata: SyncableItemMetadata;
  contentsById?: Partial<Record<string, PushContent>>;
}
