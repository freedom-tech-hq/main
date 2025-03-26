import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { generateFilenameSafeHashFromString } from './generateFilenameSafeHashFromString.ts';
import { getFsPath } from './getFsPath.ts';

export const getFsPathForMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[]): PR<string> => {
    const lastId = ids[ids.length - 1];
    if (lastId === undefined) {
      const filePath = await getFsPath(trace, rootPath, ids.slice(0, ids.length - 1), {
        suffixPaths: ['metadata'],
        extension: 'json'
      });
      if (!filePath.ok) {
        return filePath;
      }

      return makeSuccess(filePath.value);
    }

    const hashedLastId = await generateFilenameSafeHashFromString(trace, lastId);
    if (!hashedLastId.ok) {
      return hashedLastId;
    }

    const filePath = await getFsPath(trace, rootPath, ids.slice(0, ids.length - 1), {
      suffixPaths: [`metadata.${hashedLastId.value}`],
      extension: 'json'
    });
    if (!filePath.ok) {
      return filePath;
    }

    return makeSuccess(filePath.value);
  }
);
