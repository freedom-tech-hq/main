import path from 'node:path';

import type { SyncableId } from 'freedom-sync-types';

import { sanitizeFileSystemComponent } from './sanitizeFileSystemComponent.ts';

export const getFsPath = (
  rootPath: string,
  ids: readonly SyncableId[],
  { suffixPaths = [], extension }: { suffixPaths?: string[]; extension?: string } = {}
): string =>
  `${path.join(rootPath, ...ids.map(sanitizeFileSystemComponent), ...suffixPaths)}${extension !== undefined ? `.${extension}` : ''}`;
