import { schema } from 'yaschema';

import type { DirectlyUploadable } from './DirectlyUploadable.ts';
import { directlyUploadableSchema } from './DirectlyUploadable.ts';
import type { IndirectlyUploadable } from './IndirectlyUploadable.ts';
import { indirectlyUploadableSchema } from './IndirectlyUploadable.ts';

export const uploadableSchema = schema.oneOf(directlyUploadableSchema, indirectlyUploadableSchema);

export type Uploadable = DirectlyUploadable | IndirectlyUploadable;
