import path from 'node:path';

import type { SyncableId } from 'freedom-sync-types';

export const getFsPath = (
  rootPath: string,
  ids: readonly SyncableId[],
  { suffixPaths = [], extension }: { suffixPaths?: string[]; extension?: string } = {}
): string => `${path.join(rootPath, ...ids.map(encodeURIComponent), ...suffixPaths)}${extension !== undefined ? `.${extension}` : ''}`;
