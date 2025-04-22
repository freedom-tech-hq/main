import type { Result } from 'freedom-async';
import { makeSuccess, makeSyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType } from 'freedom-sync-types';

// TODO: MOVE / REMOVE
export const isExpectedType = makeSyncResultFunc(
  [import.meta.filename],
  (
    _trace: Trace,
    itemOrType: SyncableItemType | { type: SyncableItemType },
    expectedType: SyncableItemType | Array<SyncableItemType> | undefined
  ): Result<boolean> => {
    const type = typeof itemOrType === 'string' ? itemOrType : itemOrType.type;

    if (expectedType === undefined) {
      return makeSuccess(true);
    } else if (Array.isArray(expectedType)) {
      return makeSuccess((expectedType as string[]).includes(type));
    } else {
      return makeSuccess(expectedType === type);
    }
  }
);
