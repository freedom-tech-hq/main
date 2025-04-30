import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import { getFsPath } from './getFsPath.ts';

export const checkExistsAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[]): PR<boolean> => {
    const filePath = getFsPath(rootPath, ids);

    try {
      await fs.stat(filePath);
      return makeSuccess(true);
    } catch (e) {
      if (get(e, 'code') === 'ENOENT') {
        return makeSuccess(false);
      }

      return makeFailure(new GeneralError(trace, e));
    }
  }
);
