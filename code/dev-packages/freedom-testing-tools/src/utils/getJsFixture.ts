import path from 'node:path';

export async function getJsFixture<T>(dirname: string, filePath: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const object = await import(path.resolve(dirname, filePath));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const [singleValue] = Object.values(object);
  return singleValue as T;
}
