import { makeAsyncFunc } from 'freedom-async';
import type { LoggingFunc } from 'freedom-logging-types';

import type { StoreBase } from '../types/StoreBase.ts';

export const logLs = makeAsyncFunc(
  [import.meta.filename],
  async (trace, store: StoreBase, loggingFunc: LoggingFunc | undefined, { prefix, suffix }: { prefix?: string; suffix?: string } = {}) => {
    if (loggingFunc === undefined) {
      return;
    }

    const ls = await store.ls(trace);
    if (!ls.ok) {
      return;
    }

    for (const line of ls.value) {
      loggingFunc(...(prefix !== undefined ? [prefix] : []), line, ...(suffix !== undefined ? [suffix] : []));
    }
  }
);
