import type { JsonValue } from 'yaschema';

import { getStringFixture } from './getStringFixture.ts';

export function getJsonFixture<T extends JsonValue>(dirname: string, filePath: string): T {
  return JSON.parse(getStringFixture(dirname, filePath)) as T;
}
