import type { Result } from 'freedom-async';
import { makeFailure, makeSuccess, makeSyncResultFunc } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';

import { isExpectedType } from '../validation/isExpectedType.ts';

export const guardIsExpectedType = makeSyncResultFunc(
  [import.meta.filename],
  <ErrorCodeT extends string>(
    trace: Trace,
    path: SyncablePath,
    itemOrType: SyncableItemType | { type: SyncableItemType },
    expectedType: SyncableItemType | Array<SyncableItemType> | undefined,
    errorCode: ErrorCodeT
  ): Result<undefined, ErrorCodeT> => {
    const isExpected = isExpectedType(trace, itemOrType, expectedType);
    if (!isExpected.ok) {
      return isExpected;
    } else if (!isExpected.value) {
      const type = typeof itemOrType === 'string' ? itemOrType : itemOrType.type;

      return makeFailure(
        new NotFoundError(trace, {
          message: `Expected ${Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType} for ${path.toString()}, found: ${type}`,
          errorCode
        })
      );
    }

    return makeSuccess(undefined);
  }
);
