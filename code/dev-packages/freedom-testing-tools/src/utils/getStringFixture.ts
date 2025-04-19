import fs from 'node:fs';
import path from 'node:path';

export function getStringFixture(dirname: string, filePath: string): string {
  const fixturePath = path.join(
    // Fixtures are not copied on build
    dirname.replace('/lib/', '/src/'),
    filePath
  );

  return fs.readFileSync(fixturePath, 'utf-8');
}
