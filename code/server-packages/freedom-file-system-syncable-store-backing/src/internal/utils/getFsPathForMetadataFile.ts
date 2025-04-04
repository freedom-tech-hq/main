import type { SyncableId } from 'freedom-sync-types';

import { getFsPath } from './getFsPath.ts';

export const getFsPathForMetadataFile = (rootPath: string, ids: readonly SyncableId[]): string => {
  if (ids.length === 0) {
    return getFsPath(rootPath, [], { suffixPaths: ['metadata'], extension: 'json' });
  }

  const lastId = ids[ids.length - 1];
  return getFsPath(rootPath, ids.slice(0, ids.length - 1), {
    suffixPaths: [`metadata.${encodeURIComponent(lastId)}`],
    extension: 'json'
  });
};
