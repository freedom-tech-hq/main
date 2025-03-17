import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { DirectlyDownloadable } from './DirectlyDownloadable.ts';
import { makeDirectlyDownloadableSchema } from './DirectlyDownloadable.ts';
import type { IndirectlyDownloadable } from './IndirectlyDownloadable.ts';
import { indirectlyDownloadableSchema } from './IndirectlyDownloadable.ts';

export const makeDownloadableSchema = <T>(contentSchema: Schema<T>) =>
  schema.oneOf(makeDirectlyDownloadableSchema(contentSchema), indirectlyDownloadableSchema);

export type Downloadable<T> = DirectlyDownloadable<T> | IndirectlyDownloadable;
