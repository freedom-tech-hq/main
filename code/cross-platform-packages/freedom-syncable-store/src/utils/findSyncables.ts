import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { checkSyncablePathPatterns } from 'freedom-sync-types';
import { isExpectedType } from 'freedom-syncable-store-backing-types';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import type { SingleOrArray } from 'yaschema';

import { getSyncableAtPath } from './get/getSyncableAtPath.ts';
import type { TraversalResult } from './traverse.ts';
import { traverse } from './traverse.ts';

/** @returns 'not-found' if no item was found at basePath */
export const findSyncables = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: SyncableStore,
    { basePath, glob, type }: { basePath: SyncablePath; glob: SyncGlob; type?: SingleOrArray<T> }
  ): PR<Array<SyncableItemAccessor & { type: T }>, 'not-found'> => {
    const baseItem = await getSyncableAtPath(trace, store, basePath);
    if (!baseItem.ok) {
      return generalizeFailureResult(trace, baseItem, ['untrusted', 'wrong-type']);
    }

    const found: Array<SyncableItemAccessor & { type: T }> = [];

    const traversed = await traverse(trace, baseItem.value, async (trace, item): PR<TraversalResult> => {
      const relativePathIds = item.path.relativeTo(basePath);
      if (relativePathIds === undefined) {
        return makeSuccess('skip' as const);
      }

      const patternMatchResult = checkSyncablePathPatterns(trace, relativePathIds, glob);
      if (!patternMatchResult.ok) {
        return patternMatchResult;
      }

      switch (patternMatchResult.value) {
        case 'impossible':
          return makeSuccess('skip' as const);

        case 'definite': {
          const isExpected = isExpectedType(trace, item, type);
          if (isExpected.ok && isExpected.value) {
            found.push(item as SyncableItemAccessor & { type: T });
          }

          break;
        }

        case 'possible':
          // Nothing special to do
          break;
      }

      return makeSuccess('inspect' as const);
    });
    if (!traversed.ok) {
      return traversed;
    }

    return makeSuccess(found);
  }
);
