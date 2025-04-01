import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { StorageRootId } from 'freedom-sync-types';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

export const getFsRootPathForStorageRootId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, storageRootId: StorageRootId): PR<string> => {
    const allStorageRootPath = await uncheckedResult(getAllStorageRootPath(trace));

    const hashedStorageRootId = await generateSha256HashFromString(trace, storageRootId);
    if (!hashedStorageRootId.ok) {
      return hashedStorageRootId;
    }

    return makeSuccess(path.join(allStorageRootPath, encodeURIComponent(hashedStorageRootId.value)));
  }
);
