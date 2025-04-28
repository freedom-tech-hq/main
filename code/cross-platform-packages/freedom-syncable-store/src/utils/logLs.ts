import type { PR } from 'freedom-async';
import { makeAsyncFunc, makeSuccess } from 'freedom-async';
import type { LoggingFunc } from 'freedom-contexts';
import type { StoreBase } from 'freedom-syncable-store-types';

export const logLs = makeAsyncFunc(
  [import.meta.filename],
  async (
    trace,
    store: StoreBase,
    loggingFunc: LoggingFunc | undefined,
    { prefix, suffix }: { prefix?: string; suffix?: string } = {}
  ): PR<undefined> => {
    if (loggingFunc === undefined) {
      return makeSuccess(undefined);
    }

    const ls = await store.ls(trace);
    if (!ls.ok) {
      return ls;
    }

    for (const line of ls.value) {
      loggingFunc(...(prefix !== undefined ? [prefix] : []), line, ...(suffix !== undefined ? [suffix] : []));
    }

    return makeSuccess(undefined);
  }
);
