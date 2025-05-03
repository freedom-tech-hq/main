import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { StorageRootId } from 'freedom-sync-types';

import { getConfig } from '../../config.ts';

export const getFsRootPathForStorageRootId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, storageRootId: StorageRootId): PR<string> => {
    const storageRootPath = getConfig('STORAGE_ROOT_PATH');

    const hashedStorageRootId = await generateSha256HashFromString(trace, storageRootId);
    if (!hashedStorageRootId.ok) {
      return hashedStorageRootId;
    }

    return makeSuccess(path.join(storageRootPath, encodeURIComponent(hashedStorageRootId.value)));
  }
);
