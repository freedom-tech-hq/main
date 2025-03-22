import path from 'node:path';

export async function getJsFixture(dirname: string, filePath: string): Promise<any> {
  const object = await import(path.resolve(dirname, filePath));
  const [singleValue] = Object.values(object);
  return singleValue;
}
