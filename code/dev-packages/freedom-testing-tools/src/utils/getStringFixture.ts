import path from 'node:path';
import fs from 'node:fs';

export function getStringFixture(dirname: string, filePath: string): string {
  const fixturePath = path.join(dirname, filePath);
  return fs.readFileSync(fixturePath, 'utf-8');
}
