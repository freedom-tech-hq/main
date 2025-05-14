import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemAccessor } from 'freedom-syncable-store-types';

export type TraversalResult = 'inspect' | 'skip' | 'stop';

export type TraversalCallback = PRFunc<TraversalResult, never, [item: SyncableItemAccessor]>;

export const traverse = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, baseItem: SyncableItemAccessor, callback: TraversalCallback): PR<undefined> => {
    const traversed = await internalTraverse(trace, baseItem, callback);
    if (!traversed.ok) {
      return traversed;
    }

    return makeSuccess(undefined);
  }
);

// Helpers

export const internalTraverse = async (
  trace: Trace,
  baseItem: SyncableItemAccessor,
  callback: TraversalCallback
): PR<'stop' | undefined> => {
  if (baseItem.type === 'file') {
    return makeSuccess(undefined);
  }

  const ids = await baseItem.getIds(trace);
  if (!ids.ok) {
    return ids;
  }

  for (const id of ids.value) {
    const item = await baseItem.get(trace, id);
    if (!item.ok) {
      return generalizeFailureResult(trace, item, ['not-found', 'untrusted', 'wrong-type']);
    }

    const result = await callback(trace, item.value);
    switch (result.value) {
      case 'stop':
        return makeSuccess('stop' as const);
      case 'inspect': {
        const traversed = await internalTraverse(trace, item.value, callback);
        if (!traversed.ok) {
          return traversed;
        } else if (traversed.value === 'stop') {
          return makeSuccess('stop' as const);
        }
        break;
      }
      case 'skip':
        // Nothing to do
        break;
    }
  }

  return makeSuccess(undefined);
};
