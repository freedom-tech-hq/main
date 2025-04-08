import type { SyncableId } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const getDirectoryHandleAndFilenameForMetadataFile = async (
  rootHandle: FileSystemDirectoryHandle,
  ids: readonly SyncableId[]
): Promise<{ dir: FileSystemDirectoryHandle; filename: string }> => {
  if (ids.length === 0) {
    const dir = await getDirectoryHandle(rootHandle, []);
    return { dir, filename: 'metadata.json' };
  }

  const lastId = ids[ids.length - 1];
  const dir = await getDirectoryHandle(rootHandle, ids.slice(0, ids.length - 1));
  return { dir, filename: `metadata.${encodeURIComponent(lastId)}.json` };
};
