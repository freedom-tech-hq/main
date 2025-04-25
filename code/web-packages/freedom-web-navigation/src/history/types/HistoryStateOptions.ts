import { schema } from 'yaschema';

export const historyStateOptionsSchema = schema.object({
  search: schema.record(schema.string(), schema.string().allowEmptyString()).optional(),
  hash: schema.string().allowEmptyString().optional()
});

export type HistoryStateOptions = typeof historyStateOptionsSchema.valueType;
