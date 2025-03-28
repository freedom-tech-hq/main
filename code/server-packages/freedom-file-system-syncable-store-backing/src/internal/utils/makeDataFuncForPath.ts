import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import { getFsPath } from './getFsPath.ts';

export const makeDataFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<Uint8Array, 'not-found' | 'wrong-type'> => {
    const filePath = getFsPath(rootPath, ids);

    try {
      const data = await fs.readFile(filePath);
      return makeSuccess(data);
    } catch (e) {
      if (get(e, 'code') === 'ENOENT') {
        return makeFailure(new NotFoundError(trace, { message: `No file found at ${filePath}`, errorCode: 'not-found' }));
      }

      return makeFailure(new GeneralError(trace, e));
    }
  });
