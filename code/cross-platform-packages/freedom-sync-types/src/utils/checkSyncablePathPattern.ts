import { makeSuccess, makeSyncFunc, type Result } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { SyncableId } from '../types/SyncableId.ts';
import { SyncablePathPattern } from '../types/SyncablePathPattern.ts';
import type { CheckSyncablePathPatternsResult } from './checkSyncablePathPatterns.ts';

/**
 * Returns 'impossible' if this relative path doesn't match and if it's also impossible for subpaths to match.
 *
 * Returns 'possible' if this relative path doesn't match but subpaths might match.
 *
 * Returns 'definite' if this relative path matches.
 */
export const checkSyncablePathPattern = makeSyncFunc(
  [import.meta.filename],
  (trace: Trace, relativeIds: SyncableId[], pattern: SyncablePathPattern): Result<CheckSyncablePathPatternsResult> => {
    const patternIds = pattern.ids;

    // If the pattern is empty, it can only match an empty path
    if (patternIds.length === 0) {
      return makeSuccess(relativeIds.length === 0 ? 'definite' : 'impossible');
    }

    // Special case: if the pattern starts with '**', it can match any path
    // and we need to check if the rest of the pattern can match the path
    if (patternIds[0] === '**') {
      // If '**' is the only pattern element, it matches any path (including empty)
      if (patternIds.length === 1) {
        return makeSuccess('definite');
      }

      // Try to match from each position in the relativeIds
      for (let i = 0; i <= relativeIds.length; i += 1) {
        const remainingIds = relativeIds.slice(i);
        const remainingPattern = new SyncablePathPattern(...patternIds.slice(1));

        const result = checkSyncablePathPattern(trace, remainingIds, remainingPattern);
        if (!result.ok) {
          return result;
        }

        switch (result.value) {
          case 'definite':
            return makeSuccess('definite');
          case 'possible':
            return makeSuccess('possible');
          case 'impossible':
            // Nothing to do, will keep checking
            break;
        }
      }

      // If we didn't find a definite or possible match, the pattern allows future paths
      return makeSuccess('possible');
    }

    // If we've consumed all relativeIds, it's possible that adding ids will match
    if (relativeIds.length === 0) {
      return makeSuccess('possible');
    }

    // Check the first id against the first pattern element
    const firstId = relativeIds[0];
    const firstPatternElement = patternIds[0];

    // If the first id is incorrect, nothing else should be checked
    if (firstPatternElement !== '*' && firstId !== firstPatternElement) {
      return makeSuccess('impossible');
    }

    // Direct match or wildcard '*' (which matches exactly one segment)
    if (firstId === firstPatternElement || firstPatternElement === '*') {
      // We've matched the first element, now check the rest
      const remainingIds = relativeIds.slice(1);
      const remainingPattern = new SyncablePathPattern(...patternIds.slice(1));

      return checkSyncablePathPattern(trace, remainingIds, remainingPattern);
    }

    return makeSuccess('possible');
  }
);
