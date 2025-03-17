import { schema } from 'yaschema';

import { nonNegativeIntegerSchema } from '../NonNegativeInteger.ts';

export const indirectlyUploadableSchema = schema.object({
  direct: schema.boolean(false),
  chunkSizeBytes: nonNegativeIntegerSchema,
  chunkUrls: schema.array({ items: schema.string() }),
  finalizationUrl: schema.string()
});

export type IndirectlyUploadable = typeof indirectlyUploadableSchema.valueType;
