export const ls = async (dir: FileSystemDirectoryHandle): Promise<string[]> => {
  const output: string[] = [];

  let cursor = await dir.keys().next();
  while (cursor.done !== true) {
    output.push(cursor.value);
    cursor = await dir.keys().next();
  }
  return output;
};
