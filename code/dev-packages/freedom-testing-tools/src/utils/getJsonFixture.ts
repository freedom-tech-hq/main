import type { JsonValue } from 'yaschema';

import { getStringFixture } from './getStringFixture.ts';

export function getJsonFixture(dirname: string, filePath: string): JsonValue {
  return JSON.parse(getStringFixture(dirname, filePath)) as JsonValue;
}
