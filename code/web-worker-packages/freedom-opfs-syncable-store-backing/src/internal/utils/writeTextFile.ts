import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';

import { writeFile } from './writeFile.ts';

export const writeTextFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, fileHandle: FileSystemFileHandle, { lockKey, stringValue }: { lockKey: string; stringValue: string }): PR<undefined> => {
    const data = Buffer.from(stringValue, 'utf-8');
    return await writeFile(trace, fileHandle, { lockKey, data });
  }
);
