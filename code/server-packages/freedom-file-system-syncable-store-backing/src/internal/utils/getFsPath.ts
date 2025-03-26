import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

export const getFsPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, rootPath: string, ids: readonly SyncableId[], specialIds: string[] = []): PR<string> => {
    // TODO: this isn't quite right yet, we should use hashes of the ids probably
    const dirPath = path.join(rootPath, ...ids, ...specialIds);
    return makeSuccess(dirPath);
  }
);
