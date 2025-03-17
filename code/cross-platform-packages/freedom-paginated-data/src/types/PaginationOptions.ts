import { schema } from 'yaschema';

import { pageTokenInfo } from './PageToken.ts';

export const paginationOptionsSchema = schema.object({
  pageToken: pageTokenInfo.schema.optional()
});
export type PaginationOptions = typeof paginationOptionsSchema.valueType;
