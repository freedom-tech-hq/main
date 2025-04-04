import { schema } from 'yaschema';

export const inSyncFileSchema = schema.object({
  type: schema.string('file'),
  outOfSync: schema.boolean(false),
  data: schema.undefinedValue().optional()
});
export type InSyncFile = typeof inSyncFileSchema.valueType;
