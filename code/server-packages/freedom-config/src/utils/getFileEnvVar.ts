import fs from 'node:fs';

import type { FreedomEnvVar } from './from.ts';
import { resolveConfigPath } from './resolveConfigPath.ts';

export function getFileEnvVar<T>(
  env: FreedomEnvVar<NodeJS.ProcessEnv>,
  rootDir: string,
  // Reads from XXX_RAW then XXX_PATH
  // End type with '_' to prevent wrong assumptions when reading the code
  namePrefix: `${string}_`,
  parser: (value: string) => T
): T {
  return (
    env.getAsCustom(`${namePrefix}RAW`, (v) => (v !== '' ? parser(v) : undefined)) ??
    env.getRequiredAsCustom(`${namePrefix}PATH`, (pathValue) => {
      const value = fs.readFileSync(resolveConfigPath(rootDir, pathValue), 'utf8');
      return parser(value);
    })
  );
}
