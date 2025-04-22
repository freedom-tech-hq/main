import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import type { EmailAccess } from '../types/EmailAccess.ts';
import type { TimeOrganizedMailStorage } from './getMailPaths.ts';
import type {
  TimeOrganizedMailStorageTraverserAccessor,
  TimeOrganizedMailStorageUnitValue
} from './makeBottomUpTimeOrganizedMailStorageTraverser.ts';
import { makeBottomUpTimeOrganizedMailStorageTraverser } from './makeBottomUpTimeOrganizedMailStorageTraverser.ts';

export type BottomUpMailStorageTraversalResult = 'inspect' | 'skip' | 'stop';

export type BottomUpMailStorageTraversalCallback = PRFunc<
  BottomUpMailStorageTraversalResult,
  never,
  [cursor: TimeOrganizedMailStorageTraverserAccessor]
>;

/**
 * Traverses the specified time-organized mail storage from the bottom up, starting with the newest year.  For each year with content, the
 * specified callback is called.  The callback can choose, by returning, to:
 * - stop – stops the traversal
 * - skip - skips the current year and moves on to the previous year
 * - inspect - begins calling the callback with the months of the current year, in descending order
 *
 * This works recursively for year, month, day, and hour.  Returning `'skip'` or `'inspect'` on `hour` items is the same, since hours don't have
 * sub-contents.
 */
export const traverseTimeOrganizedMailStorageFromTheBottomUp = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    {
      timeOrganizedMailStorage,
      offset
    }: { timeOrganizedMailStorage: TimeOrganizedMailStorage; offset?: TimeOrganizedMailStorageUnitValue['value'] },
    callback: BottomUpMailStorageTraversalCallback
  ): PR<undefined> => {
    const cursor = await makeBottomUpTimeOrganizedMailStorageTraverser(trace, access, { timeOrganizedMailStorage, offset });
    if (!cursor.ok) {
      return cursor;
    }

    const handledLevel = await handleLevel(trace, cursor.value, { offset }, callback);
    if (!handledLevel.ok) {
      return handledLevel;
    }

    return makeSuccess(undefined);
  }
);

// Helpers

const handleLevel = makeAsyncResultFunc(
  [import.meta.filename, 'handleLevel'],
  async (
    trace,
    cursor: TimeOrganizedMailStorageTraverserAccessor | undefined,
    { offset }: { offset: TimeOrganizedMailStorageUnitValue['value'] | undefined },
    callback: BottomUpMailStorageTraversalCallback
  ): PR<'stop' | undefined> => {
    while (cursor !== undefined) {
      const result = shouldIgnoreForOffset(cursor.value, offset) ? makeSuccess('inspect' as const) : await callback(trace, cursor);
      if (!result.ok) {
        return result;
      }

      switch (result.value) {
        case 'stop':
          return makeSuccess('stop' as const);
        case 'inspect': {
          const nextLevel = await cursor.inside(trace);
          if (!nextLevel.ok) {
            return nextLevel;
          }

          const handledLevel = await handleLevel(trace, nextLevel.value, { offset }, callback);
          if (!handledLevel.ok) {
            return handledLevel;
          } else if (handledLevel.value === 'stop') {
            return makeSuccess('stop' as const);
          }

          break;
        }
        case 'skip':
          // Nothing to do
          break;
      }

      const previous = await cursor.previous(trace);
      if (!previous.ok) {
        return previous;
      }

      cursor = previous.value;
    }

    return makeSuccess(undefined);
  }
);

const shouldIgnoreForOffset = (
  cursor: TimeOrganizedMailStorageTraverserAccessor['value'],
  offset: TimeOrganizedMailStorageUnitValue['value'] | undefined
): boolean => {
  if (offset === undefined) {
    return false;
  }

  if (offset.hour !== undefined) {
    return (
      (cursor.year === offset.year && cursor.month === offset.month && cursor.day === offset.day && cursor.hour === undefined) ||
      (cursor.year === offset.year && cursor.month === offset.month && cursor.day === undefined) ||
      (cursor.year === offset.year && cursor.month === undefined)
    );
  } else if (offset.day !== undefined) {
    return (
      (cursor.year === offset.year && cursor.month === offset.month && cursor.day === undefined) ||
      (cursor.year === offset.year && cursor.month === undefined)
    );
  } else if (offset.month !== undefined) {
    return cursor.year === offset.year && cursor.month === undefined;
  }

  return false;
};
