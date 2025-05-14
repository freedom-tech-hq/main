import type { Sha256Hash } from 'freedom-basic-data';
import { sha256HashInfo } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { SyncableId } from './SyncableId.ts';
import { syncableIdSchema } from './SyncableId.ts';

export const structHashesSchema = schema.object({
  hash: sha256HashInfo.schema.optional(),
  contents: schema
    .record(
      syncableIdSchema,
      schema.ref((): Schema<StructHashes> => structHashesSchema)
    )
    .optional()
});
export interface StructHashes {
  hash?: Sha256Hash;
  contents?: Partial<Record<SyncableId, StructHashes>>;
}
