import { schema } from 'yaschema';

export const directlyUploadableSchema = schema.object({
  direct: schema.boolean(true),
  postUrl: schema.string()
});

export type DirectlyUploadable = typeof directlyUploadableSchema.valueType;
