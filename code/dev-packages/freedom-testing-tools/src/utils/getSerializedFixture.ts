import type { Schema, TypeOrPromisedType } from 'yaschema';

import { getStringFixture } from './getStringFixture.ts';

export function getSerializedFixture<T>(dirname: string, filePath: string, schema: Schema<T>): TypeOrPromisedType<T> {
  return schema.parseAsync(getStringFixture(dirname, filePath));
}
