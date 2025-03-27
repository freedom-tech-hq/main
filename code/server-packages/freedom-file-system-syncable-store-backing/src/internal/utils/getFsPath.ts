import path from 'node:path';

import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { generateFilenameSafeHashFromString } from './generateFilenameSafeHashFromString.ts';

export const getFsPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootPath: string,
    ids: readonly SyncableId[],
    { suffixPaths = [], extension }: { suffixPaths?: string[]; extension?: string } = {}
  ): PR<string> => {
    const hashedIds = await allResultsMapped(trace, ids, {}, generateFilenameSafeHashFromString);
    if (!hashedIds.ok) {
      return hashedIds;
    }

    const fsPath = `${path.join(rootPath, ...hashedIds.value, ...suffixPaths)}${extension !== undefined ? `.${extension}` : ''}`;
    return makeSuccess(fsPath);
  }
);
