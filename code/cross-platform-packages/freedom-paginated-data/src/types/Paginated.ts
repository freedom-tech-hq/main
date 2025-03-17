import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { PageToken } from './PageToken.ts';
import { pageTokenInfo } from './PageToken.ts';

export const makePaginatedSchema = <T>(itemSchema: Schema<T>) =>
  schema.object<Paginated<T>, 'no-infer'>({
    estCount: nonNegativeIntegerSchema.optional(),
    items: schema.array({ items: itemSchema }),
    nextPageToken: pageTokenInfo.schema.optional()
  });

export interface Paginated<T> {
  estCount?: number;
  items: T[];
  nextPageToken?: PageToken;
}
