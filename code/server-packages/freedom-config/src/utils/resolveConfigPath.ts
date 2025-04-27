import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let thisSessionTempDir: string | undefined;

export function resolveConfigPath(appRootDir: string, value: string): string {
  // Allow :TEMP: for dev-only environments
  DEV: {
    if (value.startsWith(':TEMP:')) {
      // Using sync, because it is DEV-only application startup stage
      if (thisSessionTempDir === undefined) {
        thisSessionTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testing-'));
      }
      value = value.replace(':TEMP:', thisSessionTempDir);
    }
  }

  return path.resolve(appRootDir, value);
}
