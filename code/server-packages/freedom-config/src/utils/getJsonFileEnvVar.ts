import type { Schema } from 'yaschema';

import { getFileEnvVar } from './getFileEnvVar.ts';

/**
 * Schema-powered version of getFileEnvVar
 */
export function getJsonFileEnvVar<T>(
  env: Parameters<typeof getFileEnvVar>[0],
  rootDir: string,
  namePrefix: `${string}_`,
  schema: Schema<T>
): T {
  return getFileEnvVar(env, rootDir, namePrefix, (v) => schema.parse(v));
}
