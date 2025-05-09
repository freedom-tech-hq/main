import type { Result } from 'freedom-async';
import { makeSuccess, makeSyncFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { SyncableId } from '../types/SyncableId.ts';
import type { SyncablePathPattern } from '../types/SyncablePathPattern.ts';
import { checkSyncablePathPattern } from './checkSyncablePathPattern.ts';

export type CheckSyncablePathPatternsResult = 'impossible' | 'possible' | 'definite';

/**
 * Returns 'impossible' if this relative path doesn't match and if it's also impossible for subpaths to match.
 *
 * Returns 'possible' if this relative path doesn't match but subpaths might match.
 *
 * Returns 'definite' if this relative path matches.
 */
export const checkSyncablePathPatterns = makeSyncFunc(
  [import.meta.filename],
  (
    trace: Trace,
    relativeIds: SyncableId[],
    { include, exclude }: { include: SyncablePathPattern[]; exclude?: SyncablePathPattern[] }
  ): Result<CheckSyncablePathPatternsResult> => {
    for (const pattern of exclude ?? []) {
      const result = checkSyncablePathPattern(trace, relativeIds, pattern);
      if (!result.ok) {
        return result;
      }

      switch (result.value) {
        case 'definite':
          // If any exclusion pattern matches, we can stop checking
          return makeSuccess('impossible');
        case 'impossible':
        case 'possible':
          // Nothing special to do
          break;
      }
    }

    let allAreImpossible = true;
    for (const pattern of include) {
      const result = checkSyncablePathPattern(trace, relativeIds, pattern);
      if (!result.ok) {
        return result;
      }

      switch (result.value) {
        case 'impossible':
          break;
        case 'possible':
          allAreImpossible = false;
          break;
        case 'definite':
          // If any inclusion pattern matches (and is not excluded), we know we have a match
          return makeSuccess('definite');
      }
    }

    return makeSuccess(allAreImpossible ? 'impossible' : 'possible');
  }
);
