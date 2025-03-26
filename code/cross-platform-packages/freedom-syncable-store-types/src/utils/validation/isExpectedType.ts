import type { Result } from 'freedom-async';
import { makeSuccess, makeSyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType } from 'freedom-sync-types';

export const isExpectedType = makeSyncResultFunc(
  [import.meta.filename],
  (
    _trace: Trace,
    item: { type: SyncableItemType },
    expectedType: SyncableItemType | Array<SyncableItemType> | undefined
  ): Result<boolean> => {
    if (expectedType === undefined) {
      return makeSuccess(true);
    } else if (Array.isArray(expectedType)) {
      return makeSuccess((expectedType as string[]).includes(item.type));
    } else {
      return makeSuccess(expectedType === item.type);
    }
  }
);
