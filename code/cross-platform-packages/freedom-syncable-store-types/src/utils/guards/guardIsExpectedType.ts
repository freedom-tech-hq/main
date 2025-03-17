import type { PR } from 'freedom-async';
import { makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';

export const guardIsExpectedType = async <ErrorCodeT extends string>(
  trace: Trace,
  path: SyncablePath,
  item: { type: SyncableItemType },
  expectedType: SyncableItemType | Array<SyncableItemType> | undefined,
  errorCode: ErrorCodeT
): PR<undefined, ErrorCodeT> => {
  if (
    expectedType !== undefined &&
    (Array.isArray(expectedType) ? !(expectedType as string[]).includes(item.type) : expectedType !== item.type)
  ) {
    return makeFailure(
      new NotFoundError(trace, {
        message: `Expected ${Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType} for ${path.toString()}, found: ${item.type}`,
        errorCode
      })
    );
  }

  return makeSuccess(undefined);
};
