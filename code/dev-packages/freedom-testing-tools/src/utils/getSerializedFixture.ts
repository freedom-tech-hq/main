import type { Schema } from 'yaschema';

import { getJsonFixture } from './getJsonFixture.ts';

export async function getSerializedFixture<T>(
  dirname: string,
  filePath: string,
  schema: Schema<T>
): Promise<T> {
  // Read
  const serialized = getJsonFixture(dirname, filePath);

  // Deserialize
  const deserializedResult = await schema.deserializeAsync(serialized);
  if (deserializedResult.error !== undefined) {
    throw new Error(deserializedResult.error);
  }

  return deserializedResult.deserialized;
}
