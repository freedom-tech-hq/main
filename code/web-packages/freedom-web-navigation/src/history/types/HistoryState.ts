import { schema } from 'yaschema';

import { historyStateOptionsSchema } from './HistoryStateOptions.ts';

export const historyStateSchema = schema.extendsObject(
  historyStateOptionsSchema,
  schema.object({
    path: schema.string().allowEmptyString()
  })
);

export type HistoryState = typeof historyStateSchema.valueType;

export const historyStateArraySchema = schema.array({ items: historyStateSchema });
