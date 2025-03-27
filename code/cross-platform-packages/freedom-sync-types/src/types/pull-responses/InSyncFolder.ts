import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const inSyncFolderSchema = schema.object({
  type: schema.string('folder'),
  outOfSync: schema.boolean(false),
  accessControlHash: sha256HashInfo.schema.optional(),
  hashesById: schema.undefinedValue().optional()
});
export type InSyncFolder = typeof inSyncFolderSchema.valueType;
