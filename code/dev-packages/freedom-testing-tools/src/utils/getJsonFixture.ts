import { getStringFixture } from './getStringFixture.ts';

export function getJsonFixture(dirname: string, filePath: string): any {
  return JSON.parse(getStringFixture(dirname, filePath));
}
