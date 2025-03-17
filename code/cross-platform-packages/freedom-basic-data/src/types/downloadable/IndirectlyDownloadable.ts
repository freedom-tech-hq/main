import { schema } from 'yaschema';

export const indirectlyDownloadableSchema = schema.object({
  direct: schema.boolean(false),
  getUrl: schema.string()
});

export type IndirectlyDownloadable = typeof indirectlyDownloadableSchema.valueType;
