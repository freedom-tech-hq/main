import type { Stats } from 'node:fs';
import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

export const getFsStatsAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, path: string): PR<{ exists: false; stats?: undefined } | { exists: true; stats: Stats }> => {
    try {
      const stats = await fs.lstat(path);
      return makeSuccess({ exists: true as const, stats });
    } catch (_e) {
      return makeSuccess({ exists: false as const });
    }
  }
);
