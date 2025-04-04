import { schema } from 'yaschema';

export const inSyncBundleSchema = schema.object({
  type: schema.string('bundle'),
  outOfSync: schema.boolean(false),
  hashesById: schema.undefinedValue().optional()
});
export type InSyncBundle = typeof inSyncBundleSchema.valueType;
