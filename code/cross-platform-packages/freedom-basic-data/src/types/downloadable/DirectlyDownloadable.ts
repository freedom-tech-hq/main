import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

export const makeDirectlyDownloadableSchema = <T>(contentSchema: Schema<T>) =>
  schema.object_noAutoOptional<DirectlyDownloadable<T>>({
    direct: schema.boolean(true),
    content: contentSchema
  });

export interface DirectlyDownloadable<T> {
  direct: true;
  content: T;
}
