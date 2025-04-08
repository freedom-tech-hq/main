import type { SyncableId } from 'freedom-sync-types';

export const getDirectoryHandle = async (
  rootHandle: FileSystemDirectoryHandle,
  ids: readonly SyncableId[]
): Promise<FileSystemDirectoryHandle> => {
  let cursor = rootHandle;
  for (const id of ids) {
    cursor = await cursor.getDirectoryHandle(id, { create: true });
  }
  return cursor;
};
